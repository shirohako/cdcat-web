// Music box with an 18-note movement, illustrative concept (~130 x 96 mm box). The box stays put; the lid, the
// movement's pieces and the winding key come out.
exports.build = G => {
  const K = require('./kit.cjs')(G);
  const {rr, slab, block, rect, turnZ, turnX, flat, fold, frontWalls} = K;
  const camera = {azimuth: -62, elevation: 28, roll: 0};
  const parts = [];
  const add = (id, name, explosion = [0, 0, 0]) => {
    const p = G.part(id, name);
    p.explosion = explosion;
    parts.push(p);
    return p;
  };
  const H = 56;                         // the box's rim
  const outer = rr(130, 96, 8), inner = rr(118, 84, 4);
  const CY = -6, CZ = 34, CR = 9;       // the pinned cylinder's axis and radius

  // Box: walls and floor.
  const box = add('case', 'Box');
  slab(box, outer, 0, H, [inner]);
  slab(box, rr(118.4, 84.4, 4.2), 0, 6);
  G.polyline(box, flat(rr(117.9, 83.9, 3.95), 6.05), {closed: true});

  // Lid, open past upright on its hinge along the back edge, a mirror set into its inside.
  const OPEN = -100 * Math.PI / 180;
  const lid = add('lid', 'Lid', [0, 40, 26]);
  {
    const shell = G.piece();
    G.extrude(shell, rr(130, 96, 8, [0, -48]), {depth: 14});
    G.polyline(shell, flat(rr(104, 70, 5, [0, -48]), -.02), {closed: true, role: 'detail'});
    G.transform(shell, {origin: [0, 48, H], xAxis: [1, 0, 0], yAxis: [0, Math.cos(OPEN), Math.sin(OPEN)], zAxis: [0, -Math.sin(OPEN), Math.cos(OPEN)]});
    G.merge(lid, shell);
  }

  // Bed plate on its two mounting blocks, with the cylinder's brackets.
  const bed = add('bed', 'Bed plate', [0, 0, 62]);
  for (const x of [-36, 36]) block(bed, rect(x - 5, -25, x + 5, 25), 6, 14);
  slab(bed, rr(86, 58, 3), 20, 3);
  for (const x of [-37, 17]) block(bed, rect(x, CY - 5, x + 3, CY + 5), 23, CZ + 3 - 23);

  // Pinned cylinder with its drive gear.
  const cyl = add('cylinder', 'Pinned cylinder', [0, -24, 104]);
  turnX(cyl, CY, CZ, [[-34, 0], [-34, 1.4], [-31, 1.4], [-31, CR], [12, CR], [12, 1.4], [17, 1.4], [17, 0]]);
  turnX(cyl, CY, CZ, [[12.6, 1.4], [12.6, 12.5], [15, 12.5], [15, 1.4]]);
  for (let k = 0; k < 40; k++) G.line(cyl, [15.02, CY + 12.5 * Math.cos(k * Math.PI / 20), CZ + 12.5 * Math.sin(k * Math.PI / 20)], [15.02, CY + 11.4 * Math.cos(k * Math.PI / 20), CZ + 11.4 * Math.sin(k * Math.PI / 20)], 'texture');
  {
    // The tune: pins at each tooth's place, scattered round the drum.
    let seed = 7;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 46; i++) {
      const x = -29.5 + Math.floor(rand() * 18) * 2.33, a = rand() * Math.PI * 2;
      G.line(cyl, [x, CY + CR * Math.cos(a), CZ + CR * Math.sin(a)], [x, CY + (CR + 1.8) * Math.cos(a), CZ + (CR + 1.8) * Math.sin(a)], 'detail');
    }
  }

  // Comb: 18 tuned teeth reaching over the cylinder, on its screwed block.
  const comb = add('comb', 'Comb', [0, -24, 146]);
  {
    const pitch = 42 / 18, w = 1.6, x0 = 11 - w - 17 * pitch, outline = [[x0, 28], [x0, -2]];
    for (let i = 0; i < 18; i++) {
      const x = x0 + i * pitch;
      if (i) outline.push([x, 14], [x, -2 + (i % 3) * .6]);
      outline.push([x + w, -2 + (i % 3) * .6]);
      if (i < 17) outline.push([x + w, 14]);
    }
    outline.push([11, 28]);
    slab(comb, outline, 39, 1.4);
    block(comb, rect(x0, 18, 11, 28), 23, 16, {foot: false});
    for (const x of [-24, -10, 4]) G.circle(comb, [x, 23, 40.42], 1.6, [0, 0, 1], {role: 'detail', segments: 24});
  }

  // Spring barrel: the mainspring's drum, its teeth round the top.
  const barrel = add('spring', 'Spring barrel', [30, 4, 100]);
  turnZ(barrel, 30, 6, [[23, 0], [23, 11], [37, 11], [37, 0]]);
  turnZ(barrel, 30, 6, [[37, 0], [37, 2.2], [41, 2.2], [41, 0]]);
  for (let k = 0; k < 36; k++) {
    const a = k * Math.PI / 18;
    G.line(barrel, [30 + 11.02 * Math.cos(a), 6 + 11.02 * Math.sin(a), 33.5], [30 + 11.02 * Math.cos(a), 6 + 11.02 * Math.sin(a), 37], 'texture');
  }

  // Governor: the fan that keeps the tempo, on its worm shaft.
  const gov = add('governor', 'Governor', [46, -34, 90]);
  turnZ(gov, 34, -18, [[23, 0], [23, 1], [50, 1], [50, 0]]);
  {
    const worm = G.piece();
    G.helix(worm, {x0: 27, x1: 37, radius: 1.6, pitch: 1.4});
    G.transform(worm, {origin: [34, -18, 0], ...G.along('z')});
    G.merge(gov, worm);
    turnZ(gov, 34, -18, [[27, 0], [27, 1.55], [37, 1.55], [37, 0]]);
    const blade = G.piece();
    fold(blade, [[0, 43], [0, 50]], -9, 9);
    G.merge(gov, G.transform(blade, {origin: [34, -18, 0]}));
    const across = G.piece();
    fold(across, [[0, 43], [0, 50]], -9, 9);
    G.merge(gov, G.transform(across, {origin: [34, -18, 0], xAxis: [0, 1, 0], yAxis: [-1, 0, 0], zAxis: [0, 0, 1]}));
  }

  // Winding key on the right-hand side.
  const key = add('key', 'Winding key', [44, 0, 0]);
  turnX(key, 0, 24, [[65, 0], [65, 2.2], [73, 2.2], [73, 0]]);
  {
    const wings = G.piece();
    G.extrude(wings, [[-13, -3], [-6, -6], [6, -6], [13, -3], [13, 3], [6, 6], [-6, 6], [-13, 3]], {depth: 2.4});
    G.merge(key, G.transform(wings, {origin: [73, 0, 24], xAxis: [0, 1, 0], yAxis: [0, 0, 1], zAxis: [1, 0, 0]}));
    G.circle(key, [75.42, 0, 24], 2.2, [1, 0, 0], {role: 'detail', segments: 24});
  }

  return {
    parts, camera, trails: [{a: [17, CY, CZ], b: [17, CY, CZ], from: 'cylinder', to: 'bed'}],
    skirts: [{of: 'case', piece: frontWalls(outer, inner, 0, H, camera)}],
    anchors: {
      lid: ['lid', [-40, 48 - 70 * Math.cos(OPEN), H - 70 * Math.sin(OPEN)]],
      comb: ['comb', [-20, -2, 40.4]], cylinder: ['cylinder', [-31, CY - CR, CZ]], spring: ['spring', [41, 6, 30]],
      governor: ['governor', [43, -18, 47]], key: ['key', [74, 12, 24]], bed: ['bed', [43, -29, 21.5]], case: ['case', [-65, -20, 30]]
    },
    overlays: [],
    sequence: ['lid', 'comb', 'cylinder', 'spring', 'governor', 'key', 'bed']
  };
};
