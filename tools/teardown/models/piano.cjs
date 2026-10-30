// Baby grand piano, illustrative concept (~1480 mm wide, ~1560 mm long). The case with its soundboard, the legs and the
// pedals stay put; the lid, its prop, the plate with its strings, the music desk, the keys and the action come out.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, slab, block, turnZ, grow, flat, frontWalls} = K;
  const camera = {azimuth: -30, elevation: 20, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const RIM0 = 640, RIM1 = 960;   // the case's underside and top
  const KEY = 700;                // top of the keybed

  // The case seen from above, counter-clockwise: square front, straight bass side on the left, the bentside's S-curve
  // and the rounded tail.
  const bezier = (a, b, c, d, n) => Array.from({length: n}, (_, i) => {
    const t = (i + 1) / n, u = 1 - t;
    return [0, 1].map(k => u ** 3 * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t ** 3 * d[k]);
  });
  const outline = [
    [740, 0], [740, 300],
    ...bezier([740, 300], [740, 640], [260, 680], [200, 1100], 22),
    ...bezier([200, 1100], [160, 1420], [20, 1560], [-240, 1560], 18),
    ...bezier([-240, 1560], [-560, 1560], [-740, 1480], [-740, 1300], 14),
    [-740, 0]
  ];
  const inner = grow(outline, -45);
  // The span of a closed outline along the line y = const, for strings and the soundboard's front edge.
  const across = (poly, y) => {
    const xs = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      if ((a[1] - y) * (b[1] - y) < 0) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    });
    return [Math.min(...xs), Math.max(...xs)];
  };
  const back = (poly, x) => {
    let top = -Infinity;
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      if ((a[0] - x) * (b[0] - x) < 0) top = Math.max(top, a[1] + (x - a[0]) * (b[1] - a[1]) / (b[0] - a[0]));
    });
    return top;
  };

  // Case: the rim with its floor, the keybed, the nameboard and the bass cheek in front. The treble cheek is a part of
  // its own: it hides the keys' right-hand end, which in turn hide the keybed, and one layer cannot do both.
  const rim = add('rim', 'Case');
  slab(rim, outline, RIM0, RIM1 - RIM0, [inner]);
  slab(rim, inner, RIM0, 30);
  G.polyline(rim, flat(grow(inner, .1), RIM0 + 30.05), {closed: true});
  slab(rim, K.rect(-740, -190, -640, 0), RIM0, 170);
  slab(rim, K.rect(-640, -190, 640, 0), RIM0, KEY - RIM0);
  slab(rim, K.rect(-640, -26, 640, 0), KEY, 96);
  const cheek = add('cheek', 'Key cheek');
  slab(cheek, K.rect(640, -190, 740, 0), RIM0, 170);

  // Legs on casters, and the pedal lyre with its three pedals.
  const legs = add('legs', 'Legs and pedals');
  for (const [x, y] of [[-660, 90], [660, 90], [-430, 1380]]) {
    turnZ(legs, x, y, [[0, 0], [0, 26], [22, 30], [60, 34], [560, 46], [600, 56], [RIM0 + .1, 56], [RIM0 + .1, 0]], {creaseAngle: 20});
  }
  for (const s of [-1, 1]) block(legs, rr(36, 30, 10, [s * 62, 250]), 110, RIM0 - 110, {foot: false});
  slab(legs, rr(250, 90, 20, [0, 250]), 40, 70);
  for (const x of [-56, 0, 56]) slab(legs, rr(26, 70, 9, [x, 180]), 64, 12);

  // Keys: 52 naturals as one bed with its divisions, up to the nameboard, and the 36 sharps just clear of them.
  const keys = add('keys', 'Keys', [0, -440, 40]);
  const KX = 615, KW = 2 * KX / 52;
  slab(keys, K.rect(-KX, -170, KX, -27), KEY, 22);
  for (let i = 1; i < 52; i++) G.line(keys, [-KX + i * KW, -170, KEY + 22.03], [-KX + i * KW, -27, KEY + 22.03], 'texture');
  const sharps = add('sharps', 'Sharps', [0, -440, 40]);
  for (let i = 0; i < 51; i++) {
    if ('BE'.includes('ABCDEFG'[i % 7])) continue;
    const x = -KX + (i + 1) * KW;
    slab(sharps, rr(13.5, 84, 2.5, [x, -70]), KEY + 22.4, 12.6);
  }

  // Action: the hammers in a row on their rail, behind the keys.
  const action = add('action', 'Action', [0, -250, 190]);
  slab(action, rr(1200, 70, 10, [0, 70]), KEY + 22, 50);
  slab(action, rr(1180, 26, 12, [0, 92]), KEY + 72, 50);
  for (let i = 0; i <= 44; i++) G.line(action, [-580 + i * 1160 / 44, 79, KEY + 122.03], [-580 + i * 1160 / 44, 105, KEY + 122.03], 'texture');

  // Soundboard with its bridge, inside the rim behind the pin block; it stays in the case.
  const board = add('soundboard', 'Soundboard');
  {
    const front = 260, edge = grow(inner, -4);
    const [l, r] = across(edge, front);
    // The outline runs counter-clockwise from the front right; keep only the part behind the front edge, in order.
    const start = edge.findIndex(p => p[1] > front);
    const behind = [];
    for (let k = 0; k < edge.length; k++) {
      const p = edge[(start + k) % edge.length];
      if (p[1] > front) behind.push(p);
    }
    slab(board, [[r, front], ...behind, [l, front]], RIM0 + 60, 9);
    const bridge = bezier([520, 330], [300, 760], [-120, 1000], [-560, 1360], 30);
    G.sweep(board, [[520, 330, RIM0 + 69], ...bridge.map(([x, y]) => [x, y, RIM0 + 69])], [[-14, -.1], [14, -.1], [14, 16], [-14, 16]]);
  }

  // Plate: the iron frame with its openings, and the strings across it from the tuning pins to the hitch pins.
  const plate = add('plate', 'Plate and strings', [0, 120, 520]);
  {
    const shape = grow(inner, -14);
    const holes = [rr(300, 500, 120, [-430, 700]), rr(240, 360, 110, [-90, 930]), rr(220, 260, 100, [250, 520]), rr(230, 200, 90, [-330, 1290])];
    slab(plate, shape, RIM0 + 90, 26, holes);
    const z = RIM0 + 116.2;
    for (let x = -650; x <= 600; x += 30) {
      const end = back(shape, x) - 40;
      if (end > 240) G.line(plate, [x, 120, z], [x, end, z], 'texture');
    }
    G.line(plate, [-650, 112, z], [600, 112, z], 'detail');
  }

  // Music desk on its ledge.
  const desk = add('desk', 'Music desk', [0, -300, 220]);
  {
    const panel = G.piece();
    G.extrude(panel, rr(820, 260, 14), {depth: 14});
    const tilt = 14 * Math.PI / 180;
    G.transform(panel, {origin: [0, 70, RIM1 + 140], xAxis: [1, 0, 0], yAxis: [0, Math.sin(tilt), Math.cos(tilt)], zAxis: [0, -Math.cos(tilt), Math.sin(tilt)]});
    G.merge(desk, panel);
    slab(desk, rr(840, 40, 8, [0, 40]), RIM1, 18);
  }

  // Lid, open on its hinges along the bass side, and the stick that props it; they lift off together.
  const OPEN = 40 * Math.PI / 180;
  const lid = add('lid', 'Lid', [0, 120, 880]);
  {
    const shape = G.piece();
    G.extrude(shape, outline.map(([x, y]) => [x + 740, y]), {depth: 18});
    G.transform(shape, {origin: [-740, 0, RIM1 + 4], xAxis: [Math.cos(OPEN), 0, Math.sin(OPEN)], yAxis: [0, 1, 0], zAxis: [-Math.sin(OPEN), 0, Math.cos(OPEN)]});
    G.merge(lid, shape);
  }
  const prop = add('prop', 'Lid prop', [0, 120, 880]);
  {
    const foot = [560, 520, RIM1], head = [-740 + Math.cos(OPEN) * 1300, 520, RIM1 + 4 + Math.sin(OPEN) * 1300];
    G.sweep(prop, [foot, head], K.disc(0, 0, 9, 24));
  }

  return {
    parts, camera, trails: [],
    skirts: [{of: 'rim', piece: frontWalls(outline, inner, RIM0, RIM1, camera)}],
    anchors: {
      lid: ['lid', [-740 + Math.cos(OPEN) * 900, 1200, RIM1 + 22 + Math.sin(OPEN) * 900]], plate: ['plate', [560, 420, RIM0 + 116]],
      soundboard: ['soundboard', [-690, 900, RIM0 + 69]], keys: ['keys', [-600, -170, KEY + 22]], action: ['action', [600, 60, KEY + 72]],
      desk: ['desk', [400, 40, RIM1 + 200]], rim: ['rim', [740, 200, RIM1 - 100]], legs: ['legs', [660, 90, 300]],
      // One key past the last: where key 404 would be, for the error page's joke.
      missing: ['keys', [KX + 14, -98, KEY + 22]]
    },
    overlays: [],
    sequence: [['lid', 'prop'], 'desk', 'plate', ['keys', 'sharps'], 'action']
  };
};
