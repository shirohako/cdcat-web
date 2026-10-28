// Renders the home page's device drawings (models/*.cjs) into the layered data TeardownFigure animates.
// Every part is drawn on its own in its assembled place, hidden lines removed within the part, together with the
// paper offset it travels when the device comes apart, and the extent of its own layer. Parts are listed in painting order. A container's front walls
// ("skirts") are drawn again over the parts still inside it, and the exact assembled drawing covers the first moments.
//
// Run after changing a model:  node tools/teardown/build-landing.cjs   (writes public/landing/teardown/*.json)
const fs = require('fs');
const path = require('path');
const G = require('./vendor/geometry.cjs');
const P = require('./vendor/projection.cjs');

const OUT = path.resolve(__dirname, '../../public/landing/teardown');
const DEVICES = ['discman', 'jewelcase', 'headphones', 'turntable'];
const ARCS = [[29, -95, -35], [34, -100, -30], [39, -105, -25], [44, -110, -20], [29, 85, 145], [34, 80, 150], [39, 75, 155], [44, 70, 160]];

const num = n => {
  const r = n.toFixed(1);
  return r === '-0.0' ? '0' : r.replace(/\.0$/, '');
};
// Rewrites absolute M/L/C/Z path data as relative commands in tenths of a millimetre, about a third shorter.
function roundPath(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const tenth = n => Math.round(+n * 10), print = n => {
    const s = (n / 10).toString();
    return s.replace(/^(-?)0\./, '$1.');
  };
  const join = list => list.map((s, i) => (i && !s.startsWith('-') ? ' ' : '') + s).join('');
  let out = '', x = 0, y = 0, sx = 0, sy = 0, cmd = '', first = true;
  for (let i = 0; i < tokens.length;) {
    if (/[MLCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'Z') {
      out += 'z';
      [x, y] = [sx, sy];
      continue;
    }
    const n = cmd === 'C' ? 6 : 2, v = tokens.slice(i, i + n).map(tenth);
    i += n;
    if (cmd === 'M' && first) {
      out += 'M' + join(v.map(print));
      first = false;
    } else {
      const rel = v.map((k, j) => k - (j % 2 ? y : x));
      out += (cmd === 'M' ? 'm' : cmd === 'L' ? 'l' : 'c') + join(rel.map(print));
    }
    [x, y] = [v[n - 2], v[n - 1]];
    if (cmd === 'M') [sx, sy] = [x, y];
  }
  return out;
}
const round = v => v.map(n => +num(n));

// Pulls the fills and the per-part line paths out of a render's markup.
function parse(markup) {
  const fills = [], lines = new Map();
  for (const [, part, covers, d] of markup.matchAll(/<path data-fill="([^"]+)" data-covers="([^"]*)" fill="none" d="([^"]*)"/g)) {
    fills.push({part, covers: covers ? covers.split(' ') : [], d});
  }
  for (const [, part, inner] of markup.matchAll(/<g id="[^"]*" data-item="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const roles = {};
    for (const [, role, d] of inner.matchAll(/<path data-line-role="([a-z]+)" fill="none" d="([^"]*)"/g)) {
      roles[role] = roles[role] ? `${roles[role]} ${d}` : d;
    }
    lines.set(part, roles);
  }
  return {fills, lines};
}
const roundRoles = roles => Object.fromEntries(Object.entries(roles).map(([role, d]) => [role, roundPath(d)]));

function boxOf(part) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const v of part.vertices) v.forEach((n, i) => { lo[i] = Math.min(lo[i], n); hi[i] = Math.max(hi[i], n); });
  return [...lo, ...hi];
}
const overlap = (a, b) => [0, 1, 2].reduce((v, i) => v * Math.max(0, Math.min(a[i + 3], b[i + 3]) - Math.max(a[i], b[i])), 1);
const volume = b => (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]);

function build(name) {
  const model = require(`./models/${name}.cjs`).build(G);
  const {parts, camera, trails = []} = model;
  const cam = P.createCamera(camera);

  // Assembled, exact, fitted over both the assembled and the exploded drawing: this fixes the shared paper frame.
  const base = P.render(parts, {explosion: 0, fitExplosion: 1, camera, trails, fill: true});
  const frame = {scale: base.scale, offset: base.offset, bounds: base.bounds};
  const paper = p => {
    const q = cam.project(p);
    return [q[0] * frame.scale + frame.offset[0], q[1] * frame.scale + frame.offset[1]];
  };
  // Where a part is drawn when assembled, in paper units with room for its strokes: each part gets a layer this size.
  const extentOf = part => {
    const points = [...part.vertices, ...part.lines.flatMap(l => [l.a, l.b])].map(paper);
    const xs = points.map(q => q[0]), ys = points.map(q => q[1]), pad = 2.5;
    const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
    return round([x, y, Math.max(...xs) + pad - x, Math.max(...ys) + pad - y]);
  };
  const shiftOf = part => {
    const q = cam.project(part.explosion);
    return round([q[0] * frame.scale, q[1] * frame.scale]);
  };

  // Painting order: who covers whom once the device is apart, nearer parts last.
  const exploded = parse(P.render(parts, {explosion: 1, camera, fill: true, frame}).markup);
  const depth = part => {
    const b = boxOf(part), c = [0, 1, 2].map(i => (b[i] + b[i + 3]) / 2 + part.explosion[i]);
    return G.dot(c, cam.direction);
  };
  const before = new Map(parts.map(p => [p.id, new Set()]));
  for (const f of exploded.fills) for (const behind of f.covers) if (behind !== f.part) before.get(f.part).add(behind);
  const order = [], placed = new Set();
  const pending = [...parts].sort((a, b) => depth(a) - depth(b));
  while (pending.length) {
    const i = pending.findIndex(p => [...before.get(p.id)].every(id => placed.has(id)));
    const [next] = pending.splice(i < 0 ? 0 : i, 1);
    order.push(next);
    placed.add(next.id);
  }

  const sequence = model.sequence ?? [];
  const delayOf = id => (sequence.includes(id) ? sequence.indexOf(id) / Math.max(1, sequence.length - 1) : 0);

  const overlaysOf = id => (model.overlays ?? []).filter(o => o.part === id).map(o => {
    const ring = (r, a0, a1, steps) => Array.from({length: steps + 1}, (_, i) => {
      const t = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
      return paper([o.centre[0] + r * Math.cos(t), o.centre[1] + r * Math.sin(t), o.centre[2]]);
    });
    const line = pts => 'M' + pts.map(p => p.map(num).join(' ')).join('L');
    if (o.kind === 'arcs') return {kind: 'arcs', paths: ARCS.map(([r, a0, a1]) => line(ring(r, a0, a1, 36)))};
    return {kind: 'label', paths: [line(ring(o.radius, 0, 360, 96)) + 'Z', line(ring(o.hole, 0, 360, 36)) + 'Z']};
  });

  const layers = order.map(part => {
    const own = parse(P.render(parts, {explosion: 0, isolated: part.id, camera, fill: true, frame}).markup);
    return {
      id: part.id,
      name: part.name,
      glass: !!part.transparent,
      shift: shiftOf(part),
      delay: +delayOf(part.id).toFixed(3),
      box: round(boxOf(part)),
      exp: round(part.explosion),
      fill: own.fills.length ? roundPath(own.fills.map(f => f.d).join(' ')) : null,
      lines: roundRoles(own.lines.get(part.id) ?? {}),
      overlays: overlaysOf(part.id),
      extent: extentOf(part)
    };
  });

  const skirts = (model.skirts ?? []).map(({of, piece, exclude = []}) => {
    const container = parts.find(p => p.id === of);
    const skirt = G.part(`${of}-front`, 'Front walls');
    G.merge(skirt, piece);
    skirt.explosion = [...container.explosion];
    const own = parse(P.render([skirt], {explosion: 0, camera, fill: true, frame}).markup);
    // The space the front walls enclose: the container's box cut down to the walls' own box.
    const c = boxOf(container), w = boxOf(skirt);
    const box = [0, 1, 2].map(i => Math.max(c[i], w[i])).concat([0, 1, 2].map(i => Math.min(c[i + 3], w[i + 3])));
    const contents = parts.filter(p => p !== container && !exclude.includes(p.id) && overlap(boxOf(p), box) > .25 * volume(boxOf(p))).map(p => p.id);
    return {of, box: round(box), extent: extentOf(skirt), fill: roundPath(own.fills.map(f => f.d).join(' ')), contents};
  });

  const assembled = parse(base.markup);
  const anchors = Object.fromEntries(Object.entries(model.anchors ?? {}).map(([key, [part, at]]) => [key, {part, at: round(paper(at))}]));
  const data = {
    name,
    bounds: round([frame.bounds.x, frame.bounds.y, frame.bounds.width, frame.bounds.height]),
    parts: layers,
    skirts,
    // Only where layering cannot show the assembled device, such as an obi wrapped round its case.
    assembled: model.assembledFrame ? {
      fills: assembled.fills.map(f => ({part: f.part, d: roundPath(f.d)})),
      lines: order.map(p => ({part: p.id, lines: roundRoles(assembled.lines.get(p.id) ?? {})}))
    } : null,
    trails: trails.map(t => ({a: round(paper(t.a)), b: round(paper(t.b)), from: t.from, to: t.to})),
    anchors
  };
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
  return data;
}

fs.mkdirSync(OUT, {recursive: true});
for (const name of process.argv.slice(2).length ? process.argv.slice(2) : DEVICES) {
  const started = Date.now(), data = build(name);
  const size = fs.statSync(path.join(OUT, `${name}.json`)).size;
  console.log(`${name}: ${data.parts.length} parts, ${data.skirts.length} skirts, ${(size / 1024).toFixed(0)} KB, ${Date.now() - started} ms`);
}
