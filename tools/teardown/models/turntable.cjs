// Belt-drive turntable, illustrative concept (~440 x 350 mm plinth).
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, slab, block, turnZ, flat, post} = K;
  const camera = {azimuth: -112, elevation: 19, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const PX = -42, PY = 0;       // platter centre
  const AX = 162, AY = 96;      // tonearm pivot
  const TOP = 60;               // plinth top

  // Plinth with control details on the top plate.
  const plinth = add('plinth', 'Plinth');
  slab(plinth, rr(440, 350, 10), 14, TOP - 14);
  G.polyline(plinth, flat(rr(428, 338, 6), TOP + .02), {closed: true, role: 'detail'});
  turnZ(plinth, PX, PY, [[TOP - .1, 0], [TOP - .1, 26], [TOP + 2, 26], [TOP + 2, 0]]);
  post(plinth, -176, -136, TOP, 13, 4);
  G.circle(plinth, [-176, -136, TOP + 4.02], 8, [0, 0, 1], {role: 'detail', segments: 72});
  for (const [x, y] of [[-140, -140], [-112, -140]]) block(plinth, rr(20, 9, 2.5, [x, y]), TOP, 2.6);
  G.polyline(plinth, flat(rr(10, 120, 5, [190, -60]), TOP + .02), {closed: true});
  block(plinth, rr(18, 10, 2, [190, -50]), TOP, 4.5);
  for (let i = 0; i < 9; i++) G.line(plinth, [200, -116 + i * 14, TOP + .03], [206, -116 + i * 14, TOP + .03], 'texture');
  // motor pulley (fixed in the plinth)
  turnZ(plinth, -170, 120, [[TOP - .1, 0], [TOP - .1, 14], [TOP + 3, 14], [TOP + 3, 0]]);
  turnZ(plinth, -170, 120, [[TOP + 3, 0], [TOP + 3, 6], [TOP + 12, 6], [TOP + 12, 0]]);
  // arm rest
  turnZ(plinth, 150, -20, [[TOP - .1, 0], [TOP - .1, 4], [TOP + 44, 4], [TOP + 44, 0]]);
  block(plinth, [[142, -24], [158, -24], [158, -16], [142, -16]], TOP + 44, 3);

  const feet = add('feet', 'Isolation feet', [0, 0, -40]);
  for (const [x, y] of [[-190, -145], [190, -145], [-190, 145], [190, 145]]) {
    turnZ(feet, x, y, [[0, 0], [0, 21], [6, 22], [14.1, 22], [14.1, 0]], {creaseAngle: 30});
  }

  // Sub-platter, spindle and drive belt.
  const sub = add('sub', 'Sub-platter & belt', [0, 0, 44]);
  turnZ(sub, PX, PY, [[TOP + 2, 0], [TOP + 2, 72], [TOP + 18, 72], [TOP + 18, 0]]);
  turnZ(sub, PX, PY, [[TOP + 18, 0], [TOP + 18, 3.6], [TOP + 50, 3.6], [TOP + 51.5, 2.6], [TOP + 51.5, 0]], {creaseAngle: 30});
  {
    const belt = [], r1 = 72.6, r2 = 8.6, c1 = [PX, PY], c2 = [-170, 120];
    const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]), base = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
    const phi = Math.acos((r1 - r2) / d);
    for (let i = 0; i <= 48; i++) {
      const t = base + phi + (2 * Math.PI - 2 * phi) * i / 48;
      belt.push([c1[0] + r1 * Math.cos(t), c1[1] + r1 * Math.sin(t), TOP + 9]);
    }
    for (let i = 0; i <= 16; i++) {
      const t = base - phi + 2 * phi * i / 16;
      belt.push([c2[0] + r2 * Math.cos(t), c2[1] + r2 * Math.sin(t), TOP + 9]);
    }
    const pts = belt.filter((p, i) => i === 0 || Math.hypot(p[0] - belt[i - 1][0], p[1] - belt[i - 1][1]) > 1e-6);
    G.sweep(sub, pts, [[-.6, -2.5], [.6, -2.5], [.6, 2.5], [-.6, 2.5]], {closed: true});
  }

  // Platter with strobe rim.
  const platter = add('platter', 'Platter', [0, 0, 104]);
  turnZ(platter, PX, PY, [[TOP + 19, 3.8], [TOP + 19, 145], [TOP + 21, 150], [TOP + 34, 150], [TOP + 35, 149], [TOP + 35, 3.8]], {creaseAngle: 30});
  for (let k = 0; k < 90; k++) {
    const t = k * Math.PI * 2 / 90, c = Math.cos(t), s = Math.sin(t);
    G.line(platter, [PX + 150.03 * c, PY + 150.03 * s, TOP + 24], [PX + 150.03 * c, PY + 150.03 * s, TOP + 30], 'texture');
  }

  const mat = add('mat', 'Slipmat', [0, 0, 150]);
  turnZ(mat, PX, PY, [[TOP + 35, 3.8], [TOP + 35, 147], [TOP + 38, 147], [TOP + 38, 3.8]]);

  // The record: grooves, run-out, label.
  const lp = add('record', 'Vinyl record', [0, 0, 204]);
  turnZ(lp, PX, PY, [[TOP + 38, 3.7], [TOP + 38, 151], [TOP + 39.8, 151], [TOP + 39.8, 3.7]]);
  for (let r = 62; r <= 146; r += 5) G.circle(lp, [PX, PY, TOP + 39.82], r, [0, 0, 1], {role: 'texture'});
  G.circle(lp, [PX, PY, TOP + 39.82], 50, [0, 0, 1], {role: 'detail'});
  G.circle(lp, [PX, PY, TOP + 39.82], 57, [0, 0, 1], {role: 'detail'});

  // Tonearm: base, pillar, arm tube, headshell with cartridge, counterweight.
  const arm = add('arm', 'Tonearm', [40, -30, 96]);
  turnZ(arm, AX, AY, [[TOP - .1, 0], [TOP - .1, 30], [TOP + 6, 30], [TOP + 8, 27], [TOP + 8, 0]], {creaseAngle: 30});
  turnZ(arm, AX, AY, [[TOP + 8, 0], [TOP + 8, 9], [TOP + 44, 9], [TOP + 44, 0]]);
  block(arm, rr(22, 22, 4, [AX, AY]), TOP + 44, 10);
  const tip = [PX + 120 * Math.cos(-.55), PY + 120 * Math.sin(-.55)];
  const path = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, x = AX + (tip[0] - AX) * t, y = AY + (tip[1] - AY) * t, bend = Math.sin(t * Math.PI) * 18;
    const nx = -(tip[1] - AY), ny = tip[0] - AX, nl = Math.hypot(nx, ny);
    path.push([x + nx / nl * bend * (t > .6 ? 1 : .6), y + ny / nl * bend * (t > .6 ? 1 : .6), TOP + 50]);
  }
  G.sweep(arm, [[AX - 40 * (tip[0] - AX) / 200, AY - 40 * (tip[1] - AY) / 200, TOP + 50], ...path], disc(0, 0, 3.6, 24));
  {
    const dir = G.unit([tip[0] - path[18][0], tip[1] - path[18][1], 0]);
    const head = G.piece();
    G.extrude(head, [[0, -9], [26, -11], [30, -8], [30, 8], [26, 11], [0, 9]], {depth: 3.4});
    G.transform(head, {origin: [tip[0] - dir[0] * 4, tip[1] - dir[1] * 4, TOP + 48.4], xAxis: dir, yAxis: [-dir[1], dir[0], 0], zAxis: [0, 0, 1]});
    G.merge(arm, head);
    const cart = G.piece();
    G.extrude(cart, [[10, -7], [24, -7], [24, 7], [10, 7]], {depth: 8.1});
    G.transform(cart, {origin: [tip[0] - dir[0] * 4, tip[1] - dir[1] * 4, TOP + 40.4], xAxis: dir, yAxis: [-dir[1], dir[0], 0], zAxis: [0, 0, 1]});
    G.merge(arm, cart);
    const back = G.unit([AX - tip[0], AY - tip[1], 0]);
    const cw = G.piece();
    G.lathe(cw, [[0, 0], [0, 15], [22, 15], [24, 13], [24, 0]], {creaseAngle: 30});
    G.transform(cw, {origin: [AX + back[0] * 22, AY + back[1] * 22, TOP + 50], xAxis: back, yAxis: [-back[1], back[0], 0], zAxis: [0, 0, 1]});
    G.merge(arm, cw);
  }

  const trails = [{a: [PX, PY, TOP + 39.8], b: [PX, PY, TOP + 18], from: 'record', to: 'sub'}];
  return {
    parts, trails, camera,
    skirts: [],
    anchors: {
      // The record's right-hand rim, the mat's and platter's left-hand ones, the belt round the motor pulley.
      record: ['record', [PX + 140, PY - 56.6, TOP + 39.8]], mat: ['mat', [PX - 136.3, PY + 55.1, TOP + 38]],
      platter: ['platter', [PX - 139.1, PY + 56.2, TOP + 27]], sub: ['sub', [-178.6, 120, TOP + 9]],
      arm: ['arm', [tip[0], tip[1], TOP + 50]], plinth: ['plinth', [-176, -136, TOP + 4]], feet: ['feet', [-190, -167, 7]]
    },
    overlays: [{part: 'record', kind: 'label', centre: [PX, PY, TOP + 39.84], radius: 50, hole: 3.7}],
    sequence: ['record', 'mat', 'arm', 'platter', 'sub', 'feet']
  };
};
