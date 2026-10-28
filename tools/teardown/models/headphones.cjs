// Over-ear wireless headphones, illustrative concept. Cups on the x axis, headband over the top.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, turnX, frontTube} = K;
  const camera = {azimuth: -62, elevation: 14, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const CX = 82, R = 46;
  const yz = origin => ({origin, ...G.plane('yz')});

  // Mirror a finished part across x = 0 (reflection, so triangles flip).
  const mirrorX = p => {
    const m = v => [-v[0], v[1], v[2]];
    p.vertices = p.vertices.map(m);
    p.triangles = p.triangles.map(([a, b, c]) => [a, c, b]);
    p.lines = p.lines.map(l => ({...l, a: m(l.a), b: m(l.b)}));
    return p;
  };

  // One ear cup's pieces, built on the +x side.
  const cup = {
    cushion(p) {
      G.lathe(p, rr(19, 21, 8, [56.5, 36.5]), {creaseAngle: 40});
      G.ring(p, 56.5, 47.02, {role: 'texture'});
    },
    mesh(p) {
      turnX(p, 0, 0, [[65.4, 0], [65.4, 40], [66.2, 40], [66.2, 0]]);
      for (const r of [8, 16, 24, 32]) G.circle(p, [65.38, 0, 0], r, [-1, 0, 0], {role: 'texture'});
    },
    baffle(p) {
      const vents = [0, 1, 2, 3, 4, 5].map(k => disc(31 * Math.cos(k * Math.PI / 3 + .5), 31 * Math.sin(k * Math.PI / 3 + .5), 3, 36));
      G.merge(p, G.transform(G.extrude(G.piece(), disc(0, 0, 44, 144), {depth: 2.2, holes: [disc(0, 0, 21, 96), ...vents]}), yz([66.4, 0, 0])));
    },
    driver(p) {
      turnX(p, 0, 0, [[68.6, 0], [68.7, 5], [69.1, 10], [69.9, 15], [70.6, 19.2], [71.6, 21.6], [73.2, 21.6], [73.8, 18], [75.6, 12.6], [76, 12.6], [76, 11.4], [82.6, 11.4], [82.6, 0]], {creaseAngle: 18});
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        G.line(p, [73.85, 17.6 * Math.cos(a), 17.6 * Math.sin(a)], [75.5, 13 * Math.cos(a), 13 * Math.sin(a)], 'detail');
      }
      G.ring(p, 79.4, 11.42, {role: 'texture'});
    },
    shell(p) {
      turnX(p, 0, 0, [[66, 43.4], [66, R], [89, R], [93.6, 45.2], [96.8, 43.4], [98.6, 41.2], [98.6, 38], [95.6, 38], [95.6, 43.4]], {creaseAngle: 30});
    },
    board(p) {
      G.merge(p, G.transform(G.extrude(G.piece(), disc(0, 0, 34, 120), {depth: 1.4, holes: [disc(0, 0, 6, 36), disc(24, -12, 1.6, 24), disc(-24, -12, 1.6, 24)]}), yz([86, 0, 0])));
      const chip = (y0, z0, y1, z1, h) => {
        G.merge(p, G.transform(G.extrude(G.piece(), K.rect(y0, z0, y1, z1), {depth: h + .1}), yz([87.3, 0, 0])));
        G.polyline(p, K.rect(y0 - .05, z0 - .05, y1 + .05, z1 + .05).map(([y, z]) => [87.45, y, z]), {closed: true});
      };
      chip(-10, 8, 6, 22, 1.2);
      chip(10, 6, 20, 16, 1);
      chip(-22, -4, -12, 4, 1.4);
      chip(-6, -24, 14, -16, 2.4);
      for (let i = 0; i < 7; i++) G.line(p, [87.45, -9 + i * 2.2, 22.05], [87.45, -9 + i * 2.2, 23.5], 'detail');
    },
    battery(p) {
      G.merge(p, G.transform(G.extrude(G.piece(), rr(46, 34, 3), {depth: 6}), yz([89.4, 0, -2])));
      G.polyline(p, rr(40, 10, 2, [0, 6]).map(([y, z]) => [95.45, y, z - 2]), {closed: true, role: 'detail'});
      G.line(p, [95.45, -23, 12], [95.45, -23, 4], 'detail');
    },
    cap(p) {
      turnX(p, 0, 0, [[98.5, 0], [98.5, 41.1], [100.4, 41.1], [101.5, 40], [102.1, 37], [102.3, 30], [102.3, 0]], {creaseAngle: 22});
      G.circle(p, [98.62, 0, 0], 41.15, [1, 0, 0], {segments: 144});
      G.circle(p, [102.32, 0, 0], 22, [1, 0, 0], {role: 'detail'});
    }
  };

  // Left cup, assembled, as one part.
  const left = add('left-cup', 'Left ear cup');
  for (const make of Object.values(cup)) make(left);
  mirrorX(left);

  // Right cup, exploded outward along its axis.
  const order = [['cushion', 'Ear cushion', 0], ['mesh', 'Acoustic mesh', 16], ['baffle', 'Baffle', 30], ['driver', '40 mm driver', 50], ['shell', 'Cup shell', 76], ['board', 'Bluetooth board', 100], ['battery', 'Battery', 118], ['cap', 'Touch cover', 140]];
  for (const [id, name, dx] of order) cup[id](add(id, name, [dx, 0, 0]));

  // Headband with sliders and yokes.
  const band = add('headband', 'Headband');
  const arc = [];
  for (let i = 0; i <= 64; i++) {
    const t = Math.PI * i / 64;
    arc.push([CX * Math.cos(t), 0, 60 + 76 * Math.sin(t)]);
  }
  G.sweep(band, [[CX, 0, 52], ...arc, [-CX, 0, 52]], rr(30, 7, 3));
  for (const s of [1, -1]) {
    const yoke = [];
    for (let i = 0; i <= 40; i++) {
      const a = -0.08 + (Math.PI + 0.16) * i / 40;
      yoke.push([s * CX, 51 * Math.cos(a), 51 * Math.sin(a)]);
    }
    G.sweep(band, yoke, rr(8, 7, 2.5));
    G.sweep(band, [[s * CX, 0, 50.5], [s * CX, 0, 58]], rr(12, 5, 2));
    for (const y of [-51, 51]) G.lathe(band, [[-3, 0], [-3, 2.2], [3, 2.2], [3, 0]], {axis: 'y', at: [s * CX, y - Math.sign(y) * 4, 0]});
  }

  const pad = add('pad', 'Headband cushion', [0, 0, -16]);
  const inner = [];
  for (let i = 0; i <= 40; i++) {
    const t = Math.PI * (0.22 + 0.56 * i / 40);
    inner.push([CX * Math.cos(t), 0, 60 + 76 * Math.sin(t)]);
  }
  G.sweep(pad, inner, rr(24, 6, 2.6, [0, 6.6]));

  const trails = [{a: [55, 0, 0], b: [102.3, 0, 0], from: 'cushion', to: 'cap'}];
  return {
    parts, trails, camera,
    skirts: [{of: 'shell', piece: frontTube(66, 98.6, 43.4, R, camera)}],
    anchors: {
      headband: ['headband', [0, -15, 139.5]], pad: ['pad', [0, -12, 118]], cushion: ['cushion', [57, -30, -30]],
      mesh: ['mesh', [66.2, -20, -20]], baffle: ['baffle', [68.6, -30, -26]], driver: ['driver', [82.6, -7, -7]],
      shell: ['shell', [98.6, -28, -28]], board: ['board', [87.4, 12, 14]], battery: ['battery', [95.4, 0, 6]], cap: ['cap', [102.3, 0, -28]]
    },
    overlays: [],
    sequence: ['cap', 'battery', 'board', 'shell', 'driver', 'baffle', 'mesh', 'pad']
  };
};
