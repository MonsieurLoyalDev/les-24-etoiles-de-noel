# D.3.1 — Ressources créées

Outil intégré `image_gen`. Les neiges et architectures sont opaques ; les objets isolés sont demandés avec une véritable transparence. Les originaux retenus sont conservés. Trois premiers essais de bibliothèque, atelier et auberge ont été rejetés avant intégration pour perspective inadéquate ou façade extérieure ; les variantes retenues reprennent la structure RPG de la maison. Aucun asset extérieur validé n'est remplacé.

## snow-powder

```text
Use case: stylized-concept. Production game terrain texture, not a scene. Create ONE seamless square texture of soft thick winter snow for a detailed modern pixel-art romantic Christmas RPG. Straight top-down orthographic ground. Almost white snow with extremely restrained ivory, pale glacier blue and barely lavender micro-shadows, broad shallow soft undulations and fine powder compact pixel clusters. Low contrast, calm and readable, no noise, no dots, no visible repeated motif, no stones, no vegetation, no tracks, no objects, no horizon, no text. Natural softly raised snow, never large blue/purple patches. All four edges must tile seamlessly. Crisp small pixel clusters, no blurred photographic shading. Opaque full square terrain texture. Intended final native size 256x256 game pixels.
```

## snow-soft

```text
Use case: stylized-concept. ONE seamless square opaque game terrain tile, straight top-down snow only. Detailed modern cozy pixel art for a romantic winter RPG. Broad quiet areas of fresh ivory-white powder with shallow rounded compression hollows, barely pale blue grey contact shadows and very restrained lavender cold reflections. A different asymmetrical relief from long parallel waves: soft small rounded mounds with quiet flat spaces. Extremely low contrast, white remains dominant. Crisp controlled pixel clusters, clean calm ground, no noisy dots, no footprints, no rocks, no objects, no text, no horizon, no border. All four edges must tile naturally without seams. Intended display at native 256x256 game pixels.
```

## house-shell

```text
Use case: stylized-concept. Production EMPTY ROOM ARCHITECTURE layer for a playable cozy detailed pixel-art 2D RPG, NOT a furnished illustration. Match warm carved wood and copper, restrained winter palette of the reference house. Camera strictly orthographic RPG three-quarter overhead with HORIZONTAL back wall and VERTICAL side walls, no isometric diamond, no vanishing point. Output a full rectangular 960x704 composition to display at 480x352. Entire interior floor from x64 to896 and y64 to672 must be EMPTY and walkable, no furniture, no rug, no raised objects, no people, no text. Narrow perimeter only: back wall within top64 pixels, side-wall cross sections within left/right64 pixels, bottom timber threshold within bottom32 pixels and a central open exit at x440..520. Thin wainscot, baseboards, carved cornice and winter windows wholly within the top64px strip. Perspective must NOT make floor shrink towards back. Sharp clean pixel clusters intended final 480x352, no blur, no thick black outlines, no photographic realism. No asset sheet, no UI. Loyal's HOME: honey oak narrow parquet with subtle worn grain, warm ivory plaster and dark chestnut timber trim, two small snowy window panes in the northern wall, muted copper fittings, intimate loved family home. Very restrained natural light. Keep floor clear.
```

## library-shell

```text
Edit target: supplied EMPTY RPG ROOM architecture. Preserve EXACTLY its overhead orthographic projection, rectangular shape, clear empty floor, narrow perimeter, horizontal north wall, vertical side walls and CENTRAL OPEN EXIT. No new building, no outside facade, no perspective room illustration, no furniture, no people, no text. This is a flat playable floor layer at 480x352 with a shallow back-wall strip; do not enlarge the wall or add ceiling. Keep crisp detailed modern pixel art, no blur. Change the honey wood floor to muted walnut parquet and the cream plaster to deep dusty petrol teal. Keep snow in the windows. Make carved cornice leaf/book motifs, not fox motifs.
```

## workshop-shell

```text
Edit target: supplied EMPTY RPG ROOM architecture. Preserve EXACTLY its overhead orthographic projection, rectangular shape, clear empty floor, narrow perimeter, horizontal north wall, vertical side walls and CENTRAL OPEN EXIT. No new building, no outside facade, no perspective room illustration, no furniture, no people, no text. This is a flat playable floor layer at 480x352 with a shallow back-wall strip; do not enlarge the wall or add ceiling. Keep crisp detailed modern pixel art, no blur. Change floor to broad worn warm chestnut planks with restrained craft wear, wall plaster to muted clay taupe. Simpler sturdy beams and wooden joinery, no fox emblem. Snowy workshop windows.
```

## inn-shell

```text
Edit target: supplied EMPTY RPG ROOM architecture. Preserve EXACTLY its overhead orthographic projection, rectangular shape, clear empty floor, narrow perimeter, horizontal north wall, vertical side walls and CENTRAL OPEN EXIT. No new building, no outside facade, no perspective room illustration, no furniture, no people, no text. This is a flat playable floor layer at 480x352 with a shallow back-wall strip; do not enlarge the wall or add ceiling. Keep crisp detailed modern pixel art, no blur. Change floor to amber chestnut herringbone, wall plaster to soft warm cream with burgundy fabric under the cornice, no fox emblem. Tiny copper hardware. Snowy windows.
```
