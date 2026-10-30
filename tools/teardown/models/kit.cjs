// Small helpers shared by the device models (mm, z up).
module.exports = G => {
  const TAU = Math.PI * 2;
  const rr = (w, h, r, c = [0, 0]) => G.roundedRectangle(w, h, r, {center: c});
  const disc = (cx, cy, r, n = 72) => Array.from({length: n}, (_, i) => [cx + r * Math.cos(i * TAU / n), cy + r * Math.sin(i * TAU / n)]);
  const grow = (profile, d) => {
    // Offset a convex-ish closed profile outward by d (vertex normals).
    const n = profile.length;
    return profile.map((p, i) => {
      const a = profile[(i + n - 1) % n], b = profile[(i + 1) % n];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1;
      tx /= l; ty /= l;
      // outward normal for counter-clockwise profiles
      return [p[0] + ty * d, p[1] - tx * d];
    });
  };
  const area = profile => profile.reduce((s, p, i) => {
    const q = profile[(i + 1) % profile.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;
  const ccw = profile => (area(profile) < 0 ? [...profile].reverse() : profile);

  // Extruded plate between z0 and z0 + depth.
  const slab = (p, profile, z0, depth, holes = [], opts = {}) =>
    G.merge(p, G.transform(G.extrude(G.piece(), profile, {depth, holes, ...opts}), {origin: [0, 0, z0]}));

  // A block standing on a surface at z0: embedded 0.1 below it, with its foot drawn as a junction line.
  const block = (p, profile, z0, height, {role = 'edge', foot = true} = {}) => {
    slab(p, profile, z0 - .1, height + .1, [], {role});
    if (foot) G.polyline(p, grow(ccw(profile), .05).map(([x, y]) => [x, y, z0 + .05]), {closed: true, role});
    return p;
  };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // Turned part along world z through (x, y): profile is [[z, r], ...].
  const turnZ = (p, x, y, profile, opts = {}) => G.lathe(p, profile, {axis: 'z', at: [x, y, 0], ...opts});
  const turnX = (p, y, z, profile, opts = {}) => G.lathe(p, profile, {axis: 'x', at: [0, y, z], ...opts});
  const turnY = (p, x, z, profile, opts = {}) => G.lathe(p, profile, {axis: 'y', at: [x, 0, z], ...opts});

  // Cylinder standing on a surface at z0, with its foot circle.
  const post = (p, x, y, z0, r, h, opts = {}) => {
    turnZ(p, x, y, [[z0 - .1, 0], [z0 - .1, r], [z0 + h, r], [z0 + h, 0]], opts);
    G.circle(p, [x, y, z0 + .05], r + .05, [0, 0, 1], {segments: 72});
    return p;
  };

  const flat = (points, z) => points.map(([x, y]) => [x, y, z]);

  // A flat ring at height z as one sheet with no thickness. Its free edges are its outline, so a thin part such as a
  // disc draws one rim rather than two lines that run together at the landing's size.
  const sheetRing = (p, x, y, z, r0, r1, n = 144) => {
    const ring = r => Array.from({length: n}, (_, i) => [x + r * Math.cos(i * TAU / n), y + r * Math.sin(i * TAU / n), z]);
    return G.loft(p, [ring(r1), ring(r0)], {caps: false, lines: 'none'});
  };

  // A folded sheet with no thickness, such as a paper strip wrapped round a spine: the polyline profile [[x, z], ...]
  // runs along y from y0 to y1. Its free edges are its outline; the folds are drawn as edges.
  const fold = (p, profile, y0, y1, {role = 'edge'} = {}) => {
    const base = p.vertices.length, m = profile.length;
    for (const [x, z] of profile) p.vertices.push([x, y0, z], [x, y1, z]);
    for (let i = 0; i < m - 1; i++) {
      const a = base + 2 * i;
      p.triangles.push([a, a + 2, a + 3], [a, a + 3, a + 1]);
    }
    for (let i = 1; i < m - 1; i++) G.line(p, [profile[i][0], y0, profile[i][1]], [profile[i][0], y1, profile[i][1]], role);
    return p;
  };

  // The walls of an upright container that face the camera, as one solid between z0 and z1. The landing draws it
  // over the parts that are still inside the container, which the walls would hide.
  const frontWalls = (outer, inner, z0, z1, camera) => {
    const a = camera.azimuth * Math.PI / 180, d = [Math.cos(a), Math.sin(a)];
    const run = profile => {
      const n = profile.length, faces = profile.map((p, i) => {
        const q = profile[(i + 1) % n], o = profile[(i + n - 1) % n];
        return (q[1] - o[1]) * d[0] - (q[0] - o[0]) * d[1] > 0;
      });
      const start = faces.findIndex((f, i) => f && !faces[(i + n - 1) % n]);
      const points = [];
      for (let k = -1; k < n; k++) {
        const i = (start + k + n) % n;
        points.push(profile[i]);
        if (k >= 0 && !faces[i]) break;
      }
      return points;
    };
    return slab(G.piece(), [...run(ccw(outer)), ...run(ccw(inner)).reverse()], z0, z1 - z0);
  };
  // The half of a tube around the x axis that faces the camera.
  const frontTube = (x0, x1, r0, r1, camera) => {
    const a = camera.azimuth * Math.PI / 180, e = camera.elevation * Math.PI / 180;
    const phi = Math.atan2(Math.sin(e), Math.cos(e) * Math.sin(a));
    return G.lathe(G.piece(), [[x0, r0], [x0, r1], [x1, r1], [x1, r0]], {start: phi - Math.PI / 2 - .05, end: phi + Math.PI / 2 + .05});
  };

  return {TAU, rr, disc, grow, ccw, slab, block, rect, turnZ, turnX, turnY, post, flat, sheetRing, fold, frontWalls, frontTube};
};
