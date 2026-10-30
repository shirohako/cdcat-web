// Belt-drive turntable, illustrative concept (~440 x 350 mm plinth). The plinth with its feet stays put; the record,
// platter, drive and the tonearm with its headshell, cartridge and counterweight come off it. The arm is parked on
// its rest, so the record lifts straight off past it.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, slab, block, turnZ, post, sheetRing} = K;
  const camera = {azimuth: -62, elevation: 20, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const PX = -46, PY = 0;       // platter centre
  const AX = 160, AY = 96;      // tonearm pivot
  const TOP = 60;               // plinth top
  const ZA = TOP + 54;          // arm tube axis
  const LIFT = 70;              // the arm's travel off its pillar

  // The parked arm points to the front, turned a hair outwards; the headshell is offset in, towards the platter.
  const turn = (v, deg) => {
    const a = deg * Math.PI / 180;
    return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), 0];
  };
  const D = turn([0, -1, 0], 2), H = turn(D, -22);
  const at = (k, z = ZA) => [AX + D[0] * k, AY + D[1] * k, z];
  // A frame whose x runs along v (horizontal) and z up, at origin.
  const along = (v, origin) => ({origin, xAxis: v, yAxis: [-v[1], v[0], 0], zAxis: [0, 0, 1]});

  // Plinth on four feet, with the speed buttons, the motor pulley, the bearing boss, the arm's base and pillar, the rest.
  const plinth = add('plinth', 'Plinth');
  slab(plinth, rr(440, 350, 12), 14, TOP - 14);
  for (const [x, y] of [[-188, -143], [188, -143], [-188, 143], [188, 143]]) {
    turnZ(plinth, x, y, [[0, 0], [0, 19], [4, 21], [14.2, 21], [14.2, 0]], {creaseAngle: 30});
  }
  turnZ(plinth, PX, PY, [[TOP - .1, 0], [TOP - .1, 28], [TOP + 2, 28], [TOP + 2, 0]]);
  post(plinth, -186, -140, TOP, 11, 5);
  G.circle(plinth, [-186, -140, TOP + 5.02], 6.5, [0, 0, 1], {role: 'detail', segments: 72});
  for (const x of [-158, -132]) block(plinth, rr(20, 9, 3, [x, -142]), TOP, 2.6);
  turnZ(plinth, -176, 116, [[TOP - .1, 0], [TOP - .1, 15], [TOP + 3, 15], [TOP + 3, 0]]);
  turnZ(plinth, -176, 116, [[TOP + 3, 0], [TOP + 3, 6.4], [TOP + 15, 6.4], [TOP + 15, 0]]);
  turnZ(plinth, AX, AY, [[TOP - .1, 0], [TOP - .1, 30], [TOP + 5, 30], [TOP + 7, 28], [TOP + 7, 0]], {creaseAngle: 30});
  turnZ(plinth, AX, AY, [[TOP + 7, 0], [TOP + 7, 9], [ZA - 10, 9], [ZA - 10, 0]]);
  {
    const [rx, ry] = at(118);
    turnZ(plinth, rx, ry, [[TOP - .1, 0], [TOP - .1, 6], [TOP + 2, 6], [TOP + 2, 3.4], [ZA - 7, 3.4], [ZA - 7, 0]]);
    const cradle = G.piece();
    G.extrude(cradle, [[-6, 0], [6, 0], [6, 5.5], [2.5, 5.5], [2.5, 2], [-2.5, 2], [-2.5, 5.5], [-6, 5.5]], {depth: 5});
    G.transform(cradle, {origin: [rx - D[0] * 2.5, ry - D[1] * 2.5, ZA - 7.5], xAxis: [-D[1], D[0], 0], yAxis: [0, 0, 1], zAxis: [D[0], D[1], 0]});
    G.merge(plinth, cradle);
  }

  // Drive belt, round the sub-platter's rim and the motor pulley.
  const belt = add('belt', 'Drive belt', [0, 0, 18]);
  {
    const path = [], r1 = 72.6, r2 = 7, c1 = [PX, PY], c2 = [-176, 116];
    const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]), base = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
    const phi = Math.acos((r1 - r2) / d);
    for (let i = 0; i <= 48; i++) {
      const t = base + phi + (2 * Math.PI - 2 * phi) * i / 48;
      path.push([c1[0] + r1 * Math.cos(t), c1[1] + r1 * Math.sin(t), TOP + 9]);
    }
    for (let i = 0; i <= 16; i++) {
      const t = base - phi + 2 * phi * i / 16;
      path.push([c2[0] + r2 * Math.cos(t), c2[1] + r2 * Math.sin(t), TOP + 9]);
    }
    const pts = path.filter((p, i) => i === 0 || Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) > 1e-6);
    G.sweep(belt, pts, [[-.7, -2.6], [.7, -2.6], [.7, 2.6], [-.7, 2.6]], {closed: true});
  }

  // Sub-platter with the spindle, on the main bearing.
  const sub = add('sub', 'Sub-platter', [0, 0, 62]);
  turnZ(sub, PX, PY, [[TOP + 2, 0], [TOP + 2, 72], [TOP + 18, 72], [TOP + 18, 0]]);
  turnZ(sub, PX, PY, [[TOP + 18, 0], [TOP + 18, 3.6], [TOP + 50, 3.6], [TOP + 51.5, 2.6], [TOP + 51.5, 0]], {creaseAngle: 30});

  // Platter, with the record's resting ring on top.
  const platter = add('platter', 'Platter', [0, 0, 140]);
  turnZ(platter, PX, PY, [[TOP + 19, 3.8], [TOP + 19, 145], [TOP + 21, 150], [TOP + 34, 150], [TOP + 35, 149], [TOP + 35, 3.8]], {creaseAngle: 30});
  G.circle(platter, [PX, PY, TOP + 35.02], 138, [0, 0, 1], {role: 'texture', segments: 192});

  // The record, one sheet: its grooves and label are the sign-in page's record art laid on it (the `vinyl` overlay).
  const lp = add('record', 'Vinyl record', [0, 0, 262]);
  sheetRing(lp, PX, PY, TOP + 36.8, 3.7, 151, 192);

  // Tonearm: bearing housing, tube and the counterweight stub; it lifts off the pillar.
  const arm = add('arm', 'Tonearm', [0, 0, LIFT]);
  turnZ(arm, AX, AY, [[ZA - 10, 0], [ZA - 10, 11], [ZA + 8, 11], [ZA + 9, 10], [ZA + 9, 0]], {creaseAngle: 30});
  G.merge(arm, G.transform(G.lathe(G.piece(), [[-64, 0], [-64, 2.8], [-8, 2.8], [-8, 3.6], [190, 3.6], [190, 4.8], [198, 4.8], [198, 0]]), along(D, [AX, AY, ZA])));

  // Headshell, offset towards the platter, with its finger lift; it slides off the tube's end.
  const headshell = add('headshell', 'Headshell', [D[0] * 44, D[1] * 44, LIFT]);
  {
    const shell = G.piece();
    G.extrude(shell, [[0, -6], [36, -9], [44, -7], [44, 7], [36, 9], [0, 6]], {depth: 2.6});
    G.transform(shell, along(H, [...at(196).slice(0, 2), ZA - 1.3]));
    G.merge(headshell, shell);
    G.merge(headshell, G.transform(G.lathe(G.piece(), [[0, 0], [0, 3.4], [10, 3.4], [10, 0]]), along(D, at(194))));
    const lift = G.piece(), s = [H[1], -H[0]];
    const o = at(196), from = [o[0] + H[0] * 30 + s[0] * 8, o[1] + H[1] * 30 + s[1] * 8], to = [from[0] + s[0] * 12, from[1] + s[1] * 12];
    G.sweep(lift, [[...from, ZA], [...to, ZA + 5]], disc(0, 0, 1.4, 16));
    G.merge(headshell, lift);
  }

  // Cartridge with its stylus, screwed under the headshell.
  const cart = add('cartridge', 'Cartridge', [D[0] * 44, D[1] * 44, LIFT - 30]);
  {
    const body = G.piece();
    G.extrude(body, [[14, -7.5], [33, -7.5], [36, -5], [36, 5], [33, 7.5], [14, 7.5]], {depth: 15});
    G.transform(body, along(H, [...at(196).slice(0, 2), ZA - 16.4]));
    G.merge(cart, body);
    const o = at(196), tip = k => [o[0] + H[0] * k, o[1] + H[1] * k];
    G.sweep(cart, [[...tip(33), ZA - 14], [...tip(39), ZA - 18.5]], disc(0, 0, .7, 12));
  }

  // Counterweight on the stub behind the pivot.
  const cw = add('counterweight', 'Counterweight', [-D[0] * 50, -D[1] * 50, LIFT]);
  G.merge(cw, G.transform(G.lathe(G.piece(), [[0, 2.8], [0, 13], [2, 15], [26, 15], [28, 13], [28, 2.8]], {creaseAngle: 30}), along([-D[0], -D[1], 0], at(-26))));
  G.merge(cw, G.transform(G.lathe(G.piece(), [[0, 0], [0, 15.05], [.01, 15.05]], {role: 'detail'}), along([-D[0], -D[1], 0], at(-40))));

  const trails = [
    {a: [PX, PY, TOP + 36.8], b: [PX, PY, TOP + 2], from: 'record', to: 'plinth'},
    {a: at(196), b: at(196), from: 'headshell', to: 'arm'},
    {a: at(-26), b: at(-26), from: 'counterweight', to: 'arm'},
    {a: [AX, AY, ZA - 10], b: [AX, AY, ZA - 10], from: 'arm', to: 'plinth'}
  ];
  return {
    parts, trails, camera,
    skirts: [],
    anchors: {
      record: ['record', [PX + 140, PY - 56.6, TOP + 36.8]], platter: ['platter', [PX - 139, PY + 56, TOP + 27]],
      sub: ['sub', [PX - 72, PY, TOP + 10]], belt: ['belt', [-182.6, 116, TOP + 9]], arm: ['arm', at(100)],
      headshell: ['headshell', at(230)], cartridge: ['cartridge', at(222, ZA - 16)], counterweight: ['counterweight', at(-52)],
      plinth: ['plinth', [-186, -140, TOP + 5]]
    },
    overlays: [{part: 'record', kind: 'vinyl', centre: [PX, PY, TOP + 36.8], radius: 151}],
    sequence: ['record', 'counterweight', 'headshell', 'cartridge', 'arm', 'platter', 'sub', 'belt']
  };
};
