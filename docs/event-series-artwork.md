# Event series artwork

Generated with the built-in image_gen tool on 2026-10-19. These are unofficial thematic illustrations, not official event posters or photographs of a specific edition. Final web assets are in `public/images/events/` and are used only when a series has no configured banner URL. The current covers are `m3-v2.webp` and `comic-market-v3.webp` (1280 × 720). See [the version 3 edit prompt](comic-market-artwork-v3.md) for the richer Comic Market colors and reduced foreground goods. Version 2 uses official mascot and logo reference images at the user's request; those character and logo designs belong to their respective owners. Version 1 assets are retained for comparison and rollback.

The Reitaisai and VOC@LOiD M@STER covers were added on 2026-10-29. Their current assets are `reitaisai-v3.webp` and `vocamas-v2.webp`, with generated renditions of the actual official logos, omitting edition numbers. Reitaisai version 3 changes to an airy watercolor panorama with seven smaller Touhou characters; see [its prompt and artwork notes](reitaisai-artwork-v3.md). Logo sources and earlier edit prompts are recorded in [the official logo revision](event-series-artwork-official-logos.md); original prompts are in [their first artwork notes](event-series-artwork-reitaisai-vocamas.md).

## Research

- M3: https://www.m3net.jp/other/kigyo.php — independent audio/media works, CD listening, Tokyo Ryutsu Center.
- Comic Market: https://www.comiket.co.jp/info-a/WhatIsEng080225.pdf — self-published doujinshi marketplace at Tokyo Big Sight.
- Architectural visual reference: https://architecture-tokyo.com/2017/05/24/1996-tokyo-big-sight-axs-satow/

For version 1, web research informed the prompts without incorporating third-party artwork. Version 2 reference inputs and prompts are recorded below.

## M3 — version 1 prompt

```text
Use case: illustration-story
Asset type: 16:9 website event-series cover, landscape 1536x864.
Primary request: Create an original polished Japanese editorial illustration representing M3, the independent music and media-mix doujin marketplace in Tokyo. This is a timeless unofficial series illustration, not an official event poster or documentary photograph.
Scene: an inviting independent music circle's tabletop at a bright indoor Japanese exhibition hall, inspired by the Tokyo Ryutsu Center. Foreground has a beautifully arranged selection of jewel-case CDs with original abstract colorful album artwork, a visible iridescent compact disc and a pair of over-ear listening headphones. Behind the table, soft simplified silhouettes of visitors browsing rows of small circle booths, subtle industrial ceiling structure.
Style: contemporary anime background illustration with clean precise linework, gentle painted shading and fine paper grain, refined editorial art, readable at a small card size, no heavy outlines. Warm cream, amber, muted coral with cool teal accents; natural daylight. Main focal objects in the middle and right, uncluttered upper left.
Text (verbatim): "M3" in large clean dark navy sans-serif lettering at upper left, integrated as editorial typography. No other text.
Composition: full-bleed wide landscape, safe 8 percent margins, large clear shapes, visually cohesive and welcoming. No borders, no dates, no edition numbers, no extra logos, no watermark, no stage or concert crowd, no real copyrighted album covers, no identifiable people. Output a single finished image.
```

## Comic Market — version 1 prompt

```text
Use case: illustration-story
Asset type: 16:9 website event-series cover, landscape 1536x864.
Primary request: Create an original polished Japanese editorial illustration representing Comic Market (Comiket), the doujinshi marketplace at Tokyo Big Sight. This is a timeless unofficial series illustration, not an official event poster or documentary photograph.
Scene: Tokyo Big Sight's recognizable conference tower in the middle-right background under a luminous pale blue sky: four large inverted truncated pyramidal volumes, broad flat tops and narrowing lower tips, elevated on huge supports above the concourse. Small simplified visitors with tote bags walk toward the venue. In the lower right foreground, a curated still life of colorful self-published manga booklets and an open black-and-white comic with original abstract panel art, symbolizing the indoor doujinshi market; keep this an editorial montage, not outdoor retail stalls.
Style: contemporary anime background illustration with clean precise linework, gentle painted shading and fine paper grain, refined editorial art, readable at a small card size, no heavy outlines. Cool sky blue and muted teal, warm cream, subtle coral and amber accents, natural daylight. Main focal objects middle and right, uncluttered upper left.
Text (verbatim): "COMIC" on first line, "MARKET" on second line, large clean dark navy sans-serif lettering at upper left, integrated as editorial typography. No other text.
Composition: full-bleed wide landscape, safe 8 percent margins, large clear shapes, visually cohesive and welcoming. No borders, no dates, no edition numbers, no extra logos, no watermark, no identifiable people, no existing manga characters or real copyrighted book covers. Output a single finished image.
```


## Version 2 — official visual references

- M3 mascot: https://x.com/m3doujin/status/2058687566527049959 (user-selected official announcement).
- Mascot image: https://pbs.twimg.com/media/HJHta6gbkAEq48m.jpg?name=orig
- M3 official logo: https://www.m3net.jp/img/logoHeader.png
- Comic Market official header, left-hand emblem only: https://www.comiket.co.jp/top/img/logo.gif

The built-in image_gen tool received the downloaded reference images directly. It generated the artwork and reference-based logos together; these are generated renditions, not byte-for-byte pasted logo assets. WebP exports only resize and encode the final images. No edition-specific dates were added.

### M3 — version 2 prompt

```text
Use case: illustration-story
Create a new 16:9 landscape event-series cover, 1536x864, for the music doujin event M3.
REFERENCE IMAGE 1: the actual official mascot artwork from the user's linked @m3doujin announcement. Preserve the recognizable character design precisely: turquoise bob with straight bangs and bright yellow highlight, oversized silver/yellow headphones, M-shaped silver/yellow head ornament, simple navy vertical eyes and playful small mouth, white/gray hoodie with dark navy trim, dark shorts, yellow/navy sneakers. Include the small pink bunny companion from the same reference. These are the SAME mascots, not new generic anime characters.
REFERENCE IMAGE 2: the ACTUAL official M3 logo from the event website. Use this exact distinctive heavy black/brown custom M3 design with rounded M and blocky 3 and the small Japanese descriptor underneath. Faithfully reproduce the logo proportions and letterform shapes, never replace it with ordinary typeset M3.
Composition: large logo on clean warm ivory space in the left third; mascots are the focal point in the right half, with a small charming display of 3 or 4 CD jewel cases and one simple disc along the lower edge. Friendly hand-drawn musical notes and a few small geometric marks. Plenty of breathing room, 7 percent safe margins. No date or edition number.
Art direction: clearly hand-drawn Japanese doujin flyer illustration; flat opaque colors, confident slightly irregular dark ink outlines, very sparse two-tone cel shadows, subtly imperfect gouache/risograph ink texture on cream paper. Restrained turquoise, butter yellow, navy and pink taken directly from the mascot reference. Playful graphic composition with large readable silhouettes. Resemble a carefully composed small press illustration, not a glossy AI anime scene. No photographic hall, no realistic lighting, no lens blur, no 3D, no bloom, no painterly glossy gradients, no sparkles, no elaborate scenery or repeated clutter. Preserve the simplicity and charm of the supplied cartoon. Keep mascot anatomy and accessories consistent. The logo and mascots must be fully in frame. Only lettering is the official logo. This is an unofficial editorial illustration about the real M3 event.
```

### M3 — final text correction

```text
Use case: text-localization. Edit image 1 only. Image 2 is the official logo reference.
Correct ONLY the Japanese descriptor below the large M3 logo. It must read EXACTLY:
音系・メディアミックス同人即売会
The second character is 系, not 楽. The last five characters are 同 人 即 売 会, not 同 人 即 市 会. Ensure each glyph is correct, crisp Japanese typography. Retain the official M3 logo design directly above.
Keep everything else unchanged: composition, mascot identity and pose, pink bunny, CDs, musical notes, cream paper texture, flat illustration style, colors and 16:9 aspect ratio. Do not redraw or alter other elements. No new text or decorations.
```

### Comic Market — version 2 prompt

```text
Use case: illustration-story
Create a new 16:9 landscape event-series cover, 1536x864, for Comic Market.
REFERENCE IMAGE 1 is the official website header. Extract ONLY the actual dark blue COMIKET emblem from the LEFT end: tall narrow custom white/blue COMIKET letters integrated with the sweeping elliptical comet/orbit swoosh and the small star to the right, with tiny Japanese text above. Faithfully preserve that actual emblem's shapes, proportions and recognizable typography. DO NOT reproduce the surrounding website welcome text or rectangular header strip. DO NOT replace the emblem with generic COMIC MARKET typography.
Composition: a large faithful COMIKET emblem on uncluttered warm ivory space in the upper-left third. A charming simplified hand-drawn Tokyo Big Sight conference tower on the right, with its four inverted truncated pyramid volumes and glass supports. In the foreground a modest stack of three self-published manga booklets, one open comic with simple black and white panel art, and a tote bag; a few tiny stylized visitors suggest the event. The books form an editorial still life, not outdoor vendor stalls. Plenty of breathing room and 7 percent safe margins.
Art direction: hand-drawn Japanese small press editorial illustration, confident slightly irregular navy ink contours, flat opaque gouache color shapes, sparse two-tone shadows, light risograph/paper texture. Limited palette: warm ivory paper, dusty sky blue, muted teal, butter yellow and tiny coral accents. Larger simple shapes that read at card size. Match the charm of a screen-printed doujin flyer, not a glossy AI anime scene. No cinematic lighting, no bloom, no 3D, no depth-of-field, no photorealism, no gradients, no intricate crowds, no sparkles, no excessive details. No large anime characters. Only text is the actual supplied COMIKET emblem; no English title, website welcome, date, edition number, extra slogans or watermark. This is an unofficial editorial illustration about the real Comic Market event.
```
