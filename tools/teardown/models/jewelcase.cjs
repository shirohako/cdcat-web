// Japanese CD release in a jewel case: obi, booklet, disc, tray, inlay, case. Illustrative.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, disc, slab, rect, turnZ, flat, frontWalls} = K;
  const camera = {azimuth: -122, elevation: 30, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const xz = y => ({origin: [0, y, 0], ...G.plane('xz')});
  const DX = 4; // disc centre sits right of the hinge spine

  // Case base: floor and four walls.
  const base = add('base', 'Case base');
  slab(base, rect(-71, -62.5, 71, 62.5), 0, 6.4, [rect(-69.6, -61.1, 69.6, 61.1)]);
  slab(base, rect(-69.8, -61.3, 69.8, 61.3), 0, .9);
  G.polyline(base, flat(rect(-69.55, -61.05, 69.55, 61.05), .95), {closed: true});
  for (const y of [-40, 40]) G.lathe(base, [[-3, 0], [-3, 1.6], [3, 1.6], [3, 0]], {axis: 'y', at: [-70.2, y, 6.4]});

  // Inlay card, folded up at both spines.
  const inlay = add('inlay', 'Back inlay', [0, 0, 22]);
  G.merge(inlay, G.transform(G.extrude(G.piece(), [[-69.2, 1], [69.2, 1], [69.2, 6], [68.6, 6], [68.6, 1.6], [-68.6, 1.6], [-68.6, 6], [-69.2, 6]], {depth: 117}), xz(58.5)));
  for (let i = 0; i < 9; i++) G.line(inlay, [-50, 40 - i * 7, 1.62], [i % 3 === 2 ? 10 : 30, 40 - i * 7, 1.62], 'texture');
  G.polyline(inlay, flat(rect(32, -52, 60, -40), 1.62), {closed: true, role: 'detail'});
  for (let i = 0; i < 14; i++) G.line(inlay, [33.5 + i * 1.9, -50.5, 1.63], [33.5 + i * 1.9, -43, 1.63], 'texture');

  // Tray with disc well, hub rosette and finger notches.
  const tray = add('tray', 'Disc tray', [0, 0, 46]);
  slab(tray, rect(-66, -60.9, 69, 60.9), 1.7, 1.3);
  slab(tray, rect(-66, -60.9, 69, 60.9), 3, 2.6, [disc(DX, 0, 60.4, 144)]);
  turnZ(tray, DX, 0, [[2.9, 0], [2.9, 11.5], [4.1, 11.5], [5.4, 9.6], [5.4, 8], [6.6, 7.5], [6.8, 0]], {creaseAngle: 25});
  for (let k = 0; k < 12; k++) {
    const t = k * Math.PI / 6;
    G.line(tray, [DX + 7.6 * Math.cos(t), 7.6 * Math.sin(t), 5.45], [DX + 11 * Math.cos(t), 11 * Math.sin(t), 4.2], 'detail');
  }
  G.circle(tray, [DX, 0, 3.02], 30, [0, 0, 1], {role: 'texture'});

  // Disc.
  const cd = add('disc', 'Disc', [26, 0, 76]);
  turnZ(cd, DX, 0, [[4.4, 7.5], [4.4, 60], [5.6, 60], [5.6, 7.5]]);
  for (const [r, role] of [[16.5, 'detail'], [22.5, 'detail'], [24.5, 'texture'], [40, 'texture'], [57.5, 'texture']]) G.circle(cd, [DX, 0, 5.62], r, [0, 0, 1], {role});

  // Booklet: stacked pages, staple fold on the left, cover framing.
  const booklet = add('booklet', 'Booklet', [-74, 34, 112]);
  slab(booklet, rect(-60, -60, 60, 60), 6.2, 1.6);
  for (let i = 1; i < 4; i++) G.line(booklet, [60.02, -60, 6.2 + i * .4], [60.02, 60, 6.2 + i * .4], 'texture');
  for (let i = 1; i < 4; i++) G.line(booklet, [-60, -60.02, 6.2 + i * .4], [60, -60.02, 6.2 + i * .4], 'texture');
  G.polyline(booklet, flat(rect(-50, -38, 50, 50), 7.82), {closed: true, role: 'detail'});
  G.line(booklet, [-50, -45, 7.82], [10, -45, 7.82], 'detail');
  G.line(booklet, [-50, -50, 7.82], [-10, -50, 7.82], 'texture');

  // Front cover, clear.
  const lid = add('lid', 'Front cover', [0, 0, 150]);
  slab(lid, rect(-71, -62.5, 71, 62.5), 8.8, 1.6);
  for (const [y0, y1] of [[-62.5, -61.1], [61.1, 62.5]]) slab(lid, rect(-64, y0, 71, y1), 6.5, 2.4);
  for (const [x, y] of [[48, 56], [48, -56], [62, 46], [62, -46]]) slab(lid, rr(8, 3, 1.2, [x, y]), 7.6, 1.3);
  lid.transparent = true;

  // Obi, wrapped around the spine.
  const obi = add('obi', 'Obi strip', [-58, 0, 24]);
  G.merge(obi, G.transform(G.extrude(G.piece(), [[-40, 10.5], [-71.3, 10.5], [-71.3, -.1], [-40, -.1], [-40, -.7], [-71.9, -.7], [-71.9, 11.1], [-40, 11.1]], {depth: 125}), xz(62.5)));
  for (const y of [40, 20, 0, -20]) G.line(obi, [-68, y, 11.12], [-44, y, 11.12], 'texture');
  G.polyline(obi, flat(rect(-66, -52, -46, -36), 11.12), {closed: true, role: 'detail'});

  const trails = [{a: [DX, 0, 5.6], b: [DX, 0, .9], from: 'disc', to: 'base'}];
  return {
    parts, trails, camera, assembledFrame: true,
    skirts: [{of: 'base', exclude: ['obi'], piece: frontWalls(rect(-71, -62.5, 71, 62.5), rect(-69.6, -61.1, 69.6, 61.1), 0, 6.4, camera)}],
    anchors: {
      lid: ['lid', [62, 58, 10.4]], booklet: ['booklet', [-60, 30, 7]], disc: ['disc', [54.9, -31.8, 5.6]],
      tray: ['tray', [55, -60.9, 4.3]], inlay: ['inlay', [46, -46, 1.62]], obi: ['obi', [-56, -20, 11.1]], base: ['base', [30, -62.5, 3.2]]
    },
    overlays: [{part: 'disc', kind: 'arcs', centre: [DX, 0, 5.62]}],
    sequence: ['lid', 'booklet', 'obi', 'disc', 'tray', 'inlay']
  };
};
