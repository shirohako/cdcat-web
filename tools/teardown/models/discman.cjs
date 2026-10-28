// Portable CD player, illustrative concept (dimensions invented, ~136 mm square).
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, slab, block, rect, turnZ, turnX, post, flat, frontWalls} = K;
  const camera = {azimuth: -116, elevation: 21, roll: 0};
  const parts = [];
  const add = (id, name, explosion) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const W = 136, R = 18, T = 2;
  const inner = (d = 0) => rr(W - 2 * T + d, W - 2 * T + d, R - T + d / 2);
  const corners = [[54, 54], [-54, 54], [54, -54], [-54, -54]];

  // Bottom shell: wall ring plus floor, ports on the left and a hold slot on the front.
  const shell = add('shell', 'Bottom shell', [0, 0, -50]);
  slab(shell, rr(W, W, R), 0, 17, [inner()]);
  slab(shell, inner(.4), 0, 1.8);
  G.polyline(shell, flat(inner(-.1), 1.85), {closed: true});
  for (const [x, y] of corners) post(shell, x, y, 1.8, 2.6, 2.2);
  G.circle(shell, [-68.05, -24, 8.5], 2.7, [-1, 0, 0], {segments: 72});
  G.circle(shell, [-68.05, -24, 8.5], 1.7, [-1, 0, 0], {segments: 72, role: 'detail'});
  G.circle(shell, [-68.05, 22, 8.5], 2.2, [-1, 0, 0], {segments: 72});
  G.polyline(shell, rr(16, 4.4, 2.2, [30, 8.5]).map(([x, z]) => [x, -68.05, z]), {closed: true});
  G.polyline(shell, rr(5, 3.2, 1.6, [26, 8.5]).map(([x, z]) => [x, -68.1, z]), {closed: true, role: 'detail'});

  // Main board with its chips.
  const pcb = add('pcb', 'Main board', [0, 0, -24]);
  slab(pcb, rr(126, 126, 14), 2.4, 1.6, corners.map(([x, y]) => disc(x, y, 1.6, 36)));
  const chip = (x0, y0, x1, y1, h, pins = 0) => {
    block(pcb, rect(x0, y0, x1, y1), 4, h);
    G.polyline(pcb, flat(rect(x0 + 1.2, y0 + 1.2, x1 - 1.2, y1 - 1.2), 4 + h + .02), {closed: true, role: 'texture'});
    for (let i = 0; i < pins; i++) {
      const t = (i + .5) / pins;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      G.line(pcb, [x, y0, 4.03], [x, y0 - 1.4, 4.03], 'detail');
      G.line(pcb, [x, y1, 4.03], [x, y1 + 1.4, 4.03], 'detail');
      G.line(pcb, [x0, y, 4.03], [x0 - 1.4, y, 4.03], 'detail');
      G.line(pcb, [x1, y, 4.03], [x1 + 1.4, y, 4.03], 'detail');
    }
  };
  chip(18, -42, 38, -22, 1.4, 8);
  chip(20, 18, 32, 30, 1.2, 5);
  chip(-14, -56, 0, -46, 1.1);
  chip(-36, 44, -8, 50, 3);
  block(pcb, rr(7, 3.6, 1.2, [44, -6]), 4, 1.8);
  for (const [x, y, r, h] of [[46, 34, 2.6, 5.5], [52, 24, 2, 4.2], [40, 44, 2, 4.2], [-46, -40, 2.6, 5.5]]) {
    post(pcb, x, y, 4, r, h);
    G.circle(pcb, [x, y, 4 + h + .02], r * .55, [0, 0, 1], {segments: 48, role: 'texture'});
  }
  for (let i = 0; i < 6; i++) G.line(pcb, [-60 + i * 3.2, -60, 4.03], [-60 + i * 3.2, -30, 4.03], 'texture');

  // Mechanism chassis: plate with sled slot and motor bore, posts, rails, sled motor and worm, spindle motor.
  const chassis = add('chassis', 'Mechanism chassis', [0, 0, 0]);
  slab(chassis, rr(124, 124, 13), 8, 1.4, [rr(44, 30, 3, [-37, 0]), disc(0, 0, 11, 96), ...corners.map(([x, y]) => disc(x, y, 1.2, 36))]);
  for (const [x, y] of corners) {
    turnZ(chassis, x, y, [[4, 1.2], [4, 2.4], [8.1, 2.4], [8.1, 1.2]]);
  }
  turnZ(chassis, 0, 0, [[4.6, 0], [4.6, 10], [8.1, 10], [8.1, 0]]);
  turnZ(chassis, 0, 0, [[8.1, 0], [8.1, 9.6], [12.4, 9.6], [12.8, 9], [12.8, 1], [13.8, 1], [13.8, 0]], {creaseAngle: 20});
  for (const y of [-11, 11]) {
    turnX(chassis, y, 11, [[-61, 0], [-61, 1.1], [-14, 1.1], [-14, 0]]);
  }
  block(chassis, rect(-64, -15, -59, 15), 9.4, 3.6);
  block(chassis, rect(-16, -15, -11, 15), 9.4, 3.6);
  turnX(chassis, -22, 11.9, [[-63, 0], [-63, 2.6], [-51, 2.6], [-51, .6], [-50, .6], [-50, 0]]);
  turnX(chassis, -22, 11.9, [[-50, 0], [-50, 1.3], [-17, 1.3], [-17, 0]]);
  {
    const worm = G.piece();
    G.helix(worm, {x0: -49, x1: -18, radius: 1.31, pitch: 1.4});
    G.transform(worm, {origin: [0, -22, 11.9]});
    G.merge(chassis, worm);
  }
  block(chassis, rect(-19, -24, -15, -19), 9.4, 4.2);

  // Optical pickup on its sled.
  const sled = add('sled', 'Optical pickup', [0, 0, 12]);
  slab(sled, rr(16, 28, 2, [-38, 0]), 9.6, 3.2);
  block(sled, rr(11, 11, 2, [-38, 0]), 12.8, .6);
  turnZ(sled, -38, 0, [[13.3, 0], [13.3, 2.9], [13.7, 2.9], [13.7, 1.9], [14.05, 1.5], [14.25, .8], [14.3, 0]], {creaseAngle: 25});
  block(sled, rect(-40, -20.6, -34, -14), 10.9, 1.2, {foot: false});
  G.polyline(sled, flat(rect(-45, 7, -31, 12), 12.83), {closed: true, role: 'detail'});

  // Turntable hub on the spindle.
  const hub = add('hub', 'Turntable hub', [0, 0, 16]);
  turnZ(hub, 0, 0, [[13.6, 0], [13.6, 14], [14.7, 14], [14.7, 7.3], [16.4, 7.3], [17, 6.5], [17, 0]], {creaseAngle: 20});
  for (let k = 0; k < 3; k++) {
    const a = k * K.TAU / 3 + .5;
    G.circle(hub, [7.32 * Math.cos(a), 7.32 * Math.sin(a), 15.6], .8, [Math.cos(a), Math.sin(a), 0], {segments: 24, role: 'detail'});
  }

  // Fixing screws.
  const screws = add('screws', 'Fixing screws', [0, 0, 22]);
  for (const [x, y] of corners) {
    const s = G.piece();
    G.screw(s, {length: 4.6, radius: 1, headRadius: 2.2, headHeight: 1.1, pitch: .6});
    G.transform(s, {origin: [x, y, 9.4 - 4.6], ...G.along('z')});
    G.merge(screws, s);
  }

  // The disc, label side up.
  const cd = add('disc', 'Compact disc', [0, 0, 42]);
  turnZ(cd, 0, 0, [[14.7, 7.5], [14.7, 60], [15.9, 60], [15.9, 7.5]]);
  for (const [r, role] of [[11, 'detail'], [16.5, 'detail'], [23, 'detail'], [25, 'texture'], [58, 'texture']]) {
    G.circle(cd, [0, 0, 15.92], r, [0, 0, 1], {role, segments: 144});
  }

  // Lid: walls, inset top panel with window and button openings, bezel around the window.
  const btnX = [-33, -11, 11, 33];
  const lid = add('lid', 'Top lid', [0, 0, 104]);
  slab(lid, rr(W, W, R), 17, 8.3, [inner()]);
  slab(lid, inner(.4), 23, 1.6, [disc(0, 0, 36, 144), ...btnX.map(x => rr(14.6, 7.6, 2.3, [x, -52]))]);
  G.polyline(lid, flat(inner(-.1), 24.65), {closed: true});
  turnZ(lid, 0, 0, [[24.5, 36], [24.5, 41], [25.3, 41], [25.6, 40.2], [25.6, 36]], {creaseAngle: 20});
  G.circle(lid, [0, 0, 24.65], 41.05, [0, 0, 1]);
  G.polyline(lid, rr(118, 2, 1, [0, 58]).map(([x, y]) => [x, y, 24.66]), {closed: true, role: 'texture'});

  // Window, transparent.
  const glass = add('window', 'Disc window', [0, 0, 128]);
  turnZ(glass, 0, 0, [[24.5, 0], [24.5, 35.95], [25.4, 35.95], [25.4, 0]]);
  glass.transparent = true;

  // Control buttons with their symbols.
  const buttons = add('buttons', 'Control buttons', [0, 0, 116]);
  for (const x of btnX) slab(buttons, rr(14, 7, 2.2, [x, -52]), 24.5, 1.3);
  const z = 25.83, sym = (pts, closed = true) => G.polyline(buttons, pts.map(([x, y]) => [x, y, z]), {closed, role: 'detail'});
  sym([[-36, -54], [-36, -50], [-38.6, -52]]); sym([[-33, -54], [-33, -50], [-35.6, -52]]); sym([[-29.6, -54], [-29.6, -50]], false);
  sym(rect(-13, -54, -9, -50));
  sym([[9, -54], [9, -50], [12.4, -52]]); sym([[13.4, -54], [13.4, -50]], false);
  sym([[30, -54], [30, -50], [32.6, -52]]); sym([[33, -54], [33, -50], [35.6, -52]]); sym([[36.4, -54], [36.4, -50]], false);

  const trails = [
    {a: [0, 0, 25.4], b: [0, 0, 1.8], from: 'window', to: 'shell'},
    ...corners.map(([x, y]) => ({a: [x, y, 9.4], b: [x, y, 9.4], from: 'screws', to: 'chassis'}))
  ];
  return {
    parts, trails, camera,
    skirts: [{of: 'shell', piece: frontWalls(rr(W, W, R), inner(), 0, 17, camera)}],
    anchors: {
      window: ['window', [0, -36, 25.4]], buttons: ['buttons', [11, -52, 25.8]], lid: ['lid', [-68, 30, 21]],
      disc: ['disc', [-53.4, 26, 15.9]], hub: ['hub', [0, -14, 14.7]], sled: ['sled', [-38, 0, 14.3]],
      screws: ['screws', [-54, -54, 10.4]], chassis: ['chassis', [44, -56, 9.4]], pcb: ['pcb', [28, -32, 5.4]],
      shell: ['shell', [-68, -24, 8.5]]
    },
    overlays: [{part: 'disc', kind: 'arcs', centre: [0, 0, 15.92]}],
    sequence: ['window', 'buttons', 'lid', 'disc', 'hub', 'screws', 'sled', 'shell', 'pcb']
  };
};
