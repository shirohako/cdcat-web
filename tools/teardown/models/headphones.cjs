// Over-ear wireless headphones, illustrative concept. Cups on the x axis, headband over the top.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, turnX, frontTube} = K;
  const camera = {azimuth: -70, elevation: 15, roll: 0};
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

  // One ear cup's pieces, built on the +x side, inside out. Each has its span along x and its radius, to explode by.
  const cup = {
    cushion: [47, 66, R, p => {
      G.lathe(p, rr(19, 21, 8, [56.5, 36.5]), {creaseAngle: 40});
      G.ring(p, 56.5, 47.02, {role: 'texture'});
    }],
    // The baffle plate with its vents, and the driver mounted behind it.
    driver: [66.4, 82.6, 44, p => {
      const vents = [0, 1, 2, 3, 4, 5].map(k => disc(31 * Math.cos(k * Math.PI / 3 + .5), 31 * Math.sin(k * Math.PI / 3 + .5), 3, 36));
      G.merge(p, G.transform(G.extrude(G.piece(), disc(0, 0, 44, 144), {depth: 2.2, holes: [disc(0, 0, 21, 96), ...vents]}), yz([66.4, 0, 0])));
      turnX(p, 0, 0, [[68.6, 21.6], [70.6, 21.6], [71.6, 21.6], [73.2, 21.6], [73.8, 18], [75.6, 12.6], [76, 12.6], [76, 11.4], [82.6, 11.4], [82.6, 0], [68.6, 0]], {creaseAngle: 18});
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        G.line(p, [73.85, 17.6 * Math.cos(a), 17.6 * Math.sin(a)], [75.5, 13 * Math.cos(a), 13 * Math.sin(a)], 'detail');
      }
      G.ring(p, 79.4, 11.42, {role: 'texture'});
    }],
    shell: [66, 98.6, R, p => {
      turnX(p, 0, 0, [[66, 43.4], [66, R], [89, R], [93.6, 45.2], [96.8, 43.4], [98.6, 41.2], [98.6, 38], [95.6, 38], [95.6, 43.4]], {creaseAngle: 30});
    }],
    // The Bluetooth board, chips on its outer face and the battery on the lower half.
    board: [86, 94.8, 34, p => {
      G.merge(p, G.transform(G.extrude(G.piece(), disc(0, 0, 34, 120), {depth: 1.4, holes: [disc(24, 14, 1.6, 24), disc(-24, 14, 1.6, 24)]}), yz([86, 0, 0])));
      const chip = (y0, z0, y1, z1, h) => {
        G.merge(p, G.transform(G.extrude(G.piece(), K.rect(y0, z0, y1, z1), {depth: h + .1}), yz([87.3, 0, 0])));
        G.polyline(p, K.rect(y0 - .05, z0 - .05, y1 + .05, z1 + .05).map(([y, z]) => [87.45, y, z]), {closed: true});
      };
      chip(-14, 4, 2, 18, 1.2);
      chip(7, 5, 17, 13, 1);
      chip(-27, -4, -19, 2, 1.4);
      for (let i = 0; i < 6; i++) G.line(p, [87.45, 6 + i * 2.2, 19], [87.45, 6 + i * 2.2, 22], 'detail');
      G.merge(p, G.transform(G.extrude(G.piece(), rr(36, 18, 3, [0, -17]), {depth: 7.4}), yz([87.4, 0, 0])));
      G.polyline(p, rr(28, 6, 2, [0, -15]).map(([y, z]) => [94.82, y, z]), {closed: true, role: 'detail'});
    }],
    cap: [98.5, 102.3, 41.1, p => {
      turnX(p, 0, 0, [[98.5, 0], [98.5, 41.1], [99.6, 41.1], [100.8, 40.6], [101.7, 38.6], [102.2, 35], [102.3, 30], [102.3, 0]], {creaseAngle: 50});
      G.circle(p, [102.32, 0, 0], 22, [1, 0, 0], {role: 'detail'});
    }]
  };

  // Left cup, assembled, as one part.
  const left = add('left-cup', 'Left ear cup');
  for (const [, , , make] of Object.values(cup)) make(left);
  mirrorX(left);

  // Right cup: each piece slides out along the cup's axis until, on paper, it clears the one before by GAP.
  {
    const a = camera.azimuth * Math.PI / 180, e = camera.elevation * Math.PI / 180;
    const squash = Math.abs(Math.cos(a) * Math.cos(e)), along = Math.sqrt(1 - squash ** 2), GAP = 7;
    const names = {cushion: 'Ear cushion', driver: '40 mm driver', shell: 'Cup shell', board: 'Bluetooth board', cap: 'Touch cover'};
    let reach = -Infinity;
    for (const [id, [x0, x1, r, make]] of Object.entries(cup)) {
      const dx = Math.max(0, (reach + GAP - (x0 * along - r * squash)) / along);
      make(add(id, names[id], [+dx.toFixed(1), 0, 0]));
      reach = x1 * along + r * squash + dx * along;
    }
  }

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
      const t = -0.08 + (Math.PI + 0.16) * i / 40;
      yoke.push([s * CX, 51 * Math.cos(t), 51 * Math.sin(t)]);
    }
    G.sweep(band, yoke, rr(8, 7, 2.5));
    G.sweep(band, [[s * CX, 0, 50.5], [s * CX, 0, 58]], rr(12, 5, 2));
    for (const y of [-51, 51]) G.lathe(band, [[-3, 0], [-3, 2.2], [3, 2.2], [3, 0]], {axis: 'y', at: [s * CX, y - Math.sign(y) * 4, 0]});
  }

  const pad = add('pad', 'Headband cushion', [0, 0, -20]);
  const inner = [];
  for (let i = 0; i <= 40; i++) {
    const t = Math.PI * (0.22 + 0.56 * i / 40);
    inner.push([CX * Math.cos(t), 0, 60 + 76 * Math.sin(t)]);
  }
  G.sweep(pad, inner, rr(24, 6, 2.6, [0, 6.6]));

  const trails = [{a: [66, 0, 0], b: [98.5, 0, 0], from: 'cushion', to: 'cap'}];
  return {
    parts, trails, camera,
    skirts: [{of: 'shell', piece: frontTube(66, 98.6, 43.4, R, camera)}],
    anchors: {
      headband: ['headband', [0, -15, 139.5]], pad: ['pad', [0, -12, 118]], cushion: ['cushion', [57, -30, -30]],
      driver: ['driver', [68.6, -30, -26]], shell: ['shell', [98.6, -28, -28]], board: ['board', [87.4, 12, 14]], cap: ['cap', [102.3, 0, -28]]
    },
    overlays: [],
    sequence: ['cap', 'board', 'shell', 'driver', 'pad']
  };
};
