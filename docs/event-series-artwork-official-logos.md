# Event series covers — official logo revision

Updated on 2026-10-29 with the built-in `image_gen` editing tool, using the existing series covers as edit targets and downloaded official artwork as visual references. Final exports only resize and encode the generated edits. The logo renditions are generated from references, not byte-for-byte pasted originals.

- Reitaisai official poster: https://reitaisai.com/rts23/wp-content/uploads/sites/47/2026/03/a60addd0861b0933f9dafa82daecf126.png (linked from https://reitaisai.com/rts23/).
- VOC@LOiD M@STER official generic banner: https://ketto.com/tvm/tvm_bana.gif (linked from https://ketto.com/tvm/).
- Higher resolution official lettering reference: https://ketto.com/tvm/tvm64logo.webp. The edition number is omitted from the series cover.

No dedicated permanent event mascots were verified in the consulted official sources. Existing Reimu and Hatsune Miku remain thematic characters; they are not described as event-specific mascots. Logo and character designs belong to their respective owners. Only series fallback artwork changes; individual editions are untouched.

This revision exported `public/images/events/reitaisai-v2.webp` and `public/images/events/vocamas-v2.webp`, 1280 × 720 WebP. VOC@LOiD M@STER version 2 remains current. Reitaisai version 2 and the earlier unused exports were removed on 2026-10-29 after confirming they had no runtime references; Reitaisai now uses [version 3](reitaisai-artwork-v3.md). Temporary reference downloads and superseded generation outputs were also removed; official source URLs and prompts remain recorded here.

## Reitaisai edit prompt

```text
Use case: precise-object-edit.
Edit IMAGE 1, the existing 16:9 Reitaisai series cover. IMAGE 2 is the OFFICIAL Reitaisai poster from reitaisai.com and is a logo design reference only.
The user wants the REAL event logo instead of the current invented brush-letter title. Replace the lettering in the LEFT area of IMAGE 1 with a faithful rendition of the distinctive official logo visible at the TOP CENTER of IMAGE 2: large custom block-shaped Japanese 例 / 大 / 祭 stacked vertically, the torii-like 大 with semicircular radiating sun motif above, the yin-yang motif inside 祭, and the narrower accompanying vertical 博麗 / yin-yang / 神社 column to the right. Preserve the official logo's distinctive glyph shapes, strong white outline and purple-to-magenta/pink coloring. IMPORTANT: omit the small 第23回 edition-number plaque entirely, and do not include any date, venue, edition number or other poster information. Only the timeless 博麗神社例大祭 wordmark and its decorative symbols should be transferred. Do NOT use ordinary Japanese type, brush calligraphy or an invented replacement logo.
Recompose ONLY the left title/goods area enough to give the actual logo comfortable space and full readability: the logo occupies the upper-left, the same books and CDs can be a little smaller along the bottom-left with comfortable margins. Keep the Reimu character on the right EXACTLY as in IMAGE 1: identity, pose, face, costume, gohei, colors, scale. Preserve the shrine/torii scene, cream paper texture, hand-drawn gouache/risograph style, original warm colors, full 16:9 framing. Do not copy any characters or scenery from the official poster. No new characters, no watermark, no schedule. This remains an unofficial editorial series cover.
```

## VOC@LOiD M@STER edit prompt

```text
Use case: precise-object-edit.
Edit IMAGE 1, the existing 16:9 THE VOC@LOiD M@STER series cover. IMAGE 2 is the official generic website banner; IMAGE 3 is the high-resolution current official website logo, for the same underlying letter shapes ONLY.
Replace ONLY the invented navy lettering in the upper-left of IMAGE 1 with a faithful rendition of the ACTUAL official THE VOC@LOiD M@STER logo from IMAGE 2, using IMAGE 3 for sharper letterform details. The real logo has broad futuristic geometric white/silver hollow lettering with black/dark outlines, bright red @ symbols, pink centers in the round O letters, and a small hot-pink ボーカロイドonly event descriptor above. Its core two-line arrangement is THE VOC@LOiD on the first line and M@STER on the second. Keep the real logo's distinctive shapes, colors and proportions; don't use ordinary navy typography. The banner spelling and custom shapes are authoritative. Fit it crisply and naturally within the upper-left cream area, preserving the surrounding illustration. Omit the large 64 entirely: this is a TIMELESS SERIES COVER, not an edition poster. Do not include any number, date or schedule. Do not add a banner rectangle or a colored checkerboard background.
Invariants: preserve Hatsune Miku exactly as in IMAGE 1 including face, expression, hair, clothes, pose and held CD; preserve all foreground headphones, CD cases, compact disc, books, tabletop, cream paper, notes, colored accents and hand-drawn gouache/risograph texture. Preserve the full 16:9 composition and original color balance. Change the title/logo area only. No watermark, no extra text other than the official logo and its official descriptor.
```
