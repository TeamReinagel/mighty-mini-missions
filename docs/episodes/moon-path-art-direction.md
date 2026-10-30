# The Moon Path · Raster asset production

Method: built-in image generation. All final player assets are included in `dist/assets/`.

The existing Lark and Nib portraits were identity references. The ferry concept still from the screenplay was the lighting and material reference. The background plates were generated without characters; all interactive props and character sprites are separate transparent layers.

## Shared background prompt

Use case: illustration-story. Finished cinematic stylized CG-painted environment background plate for an original preschool cartoon. Landscape 16:9, rich tactile wood, foliage and stone, layered depth, soft warm/cool film lighting consistent with the reference. Child's eye-level camera. Open foreground stage for separately animated characters. Main details within the central 70 percent. Static environment only: no characters, animals, props, text, letters, numbers, logos, emojis or UI. The supplied image is a style reference, not an edit target.

## Background-specific directions

- **camp.png:** Inviting forest explorer camp in late afternoon. Modest wooden treehouse in a thick tree at upper left, warm window light, dirt path slopes left to right across a wide clearing, distant valley, leafy canopy, low stump at right. Empty foreground for cart and explorers.
- **lagoon.png:** Shallow teal lagoon in lush forest, broad stone-and-earth bank with empty foreground stage, stepping platforms across the water, reeds, path beyond, warm afternoon sun. Space for a separate control machine and the explorers.
- **woods.png:** Woodland path forks around a broad low boulder. Right branch has soft moss; left branch has bare rocks and a muddy puddle. Warm shafts of light, high canopy, spacious foreground. Small interactive mushroom, flower, and rock props remain separate.
- **river.png:** Woodland river landing at blue hour, pink-gold reflections, empty weathered dock from left foreground toward center, mossy island across the river, reeds and willow branches. Empty water on the right for a separate ferry. Cozy and safe.

## Shared character atlas prompt

Use case: stylized-concept. Production square transparent PNG atlas, exactly four equal columns by four equal rows, sixteen full-body animation frames read left-to-right then top-to-bottom. Actual transparent alpha; no floor, shadows, checkerboard texture, grid lines, labels, text, or backdrop. Each character stays at the same scale, camera angle, horizontal center, lighting, and foot baseline, with safe transparent margins and no clipping or overlap. Preserve the supplied character's recognizable soft textured CG identity.

### Talking sheets

One seamless talking-and-listening loop: frame 1 neutral closed-mouth smile; frames 2-6 small/open/round speech mouth shapes with a gentle hand gesture; frames 7-8 natural blink; frames 9-14 speaking as the gesture returns; frames 15-16 connect back to frame 1. Body mostly still, friendly expressive face, slight three-quarter view toward the other character.

- **lark-talk.png:** Teal songbird, cream cheeks and chest, yellow beak and bird feet, brown scout vest and rolled-map tube. Small wing-hand gesture; faces slightly right.
- **nib-talk.png:** Round golden mouse, large round ears, cream muzzle, pink nose, red scarf and small mouse feet. Small paw gesture; faces slightly left.

### Walking sheets

One complete sixteen-frame walk cycle in place, facing three-quarter right. Natural stepping legs, gentle counter-swing of hands/wings, subtle body rise and fall, scarf and feathers following movement. Same position and baseline throughout. First and final frame connect smoothly.

- **lark-walk.png:** The same teal bird, cream cheeks and chest, yellow feet and beak, brown vest and map tube; small energetic steps.
- **nib-walk.png:** The same round golden mouse, red scarf, large ears, cream muzzle, small feet, subtle tail; purposeful happy steps.

## Exact prop atlas prompt

Use case: stylized-concept. Production game prop atlas for original preschool cartoon, one SQUARE transparent PNG with strict 4 columns by 4 rows, exactly sixteen separate isolated props, one centered object per equal cell, row-major order below. Actual transparent alpha, no floor shadows, no checkerboard texture, no borders/gridlines, NO TEXT LETTERS NUMBERS EMOJIS. Match warm textured high-budget stylized CG reference. Full objects entirely inside cells, 12% safe transparent padding, same soft neutral lighting and 3/4 camera angle for compositing into supplied woodland world. IMPORTANT each object clearly readable at 250 pixels, crafted wood/fabric/metal/material detail. Row1: (1) cute homemade little four-wheeled wooden adventure wagon with big empty seat, cloth pennant and picnic basket, no character; (2) closed battered wooden explorer case with big brass latch; (3) same explorer case open, empty inside; (4) unfolded warm parchment torn treasure map with pictorial river lagoon tree and dotted winding trail, no letters. Row2: (5) old open explorer book with plain ivory pages, no marks; (6) crescent-shaped brass lantern holding a glowing white-blue moonstone; (7) small EMPTY wooden ferry boat with low side, bow at right, no characters or lantern; (8) comically inside-out dark blue umbrella. Row3: (9) one cute red-capped woodland mushroom; (10) soft cushion of vivid green moss on dirt; (11) one yellow woodland flower with leaves; (12) one smooth round grey rock. Row4: (13) small weathered wooden trail-control machine with a large BLANK square brass key slot and a little lever; (14) wooden bell post with TWO brass bells side by side and two large BLANK hanging wooden tags directly beneath bells; (15) open little treasure collection case lined with midnight blue velvet and one round empty compartment; (16) one glossy red apple with green leaf. Keep every cell separate, no duplicate props, no characters.

## Runtime treatment

The player extracts the sixteen cells of each generated atlas, crops transparent margins, and aligns the frames to a consistent baseline for compositing. Runtime speech uses only small, softly blended mouth crops from the talking sheet over the neutral pose, so generated differences in the eyes, hands, scale, or posture never animate during dialogue. Walking keeps the first frame's head fixed while blending in the moving body below the neck. Idle poses remain static. The 16-frame cycles and all character and prop art use the generated pixels.

All available choice objects receive an equal steady gold halo around their visible shape. Hover and keyboard focus strengthen the halo. Completed map landmarks return to their normal shadow.

Instructional letters and tracing grooves are rendered separately so their shapes are correct and their touch targets remain exact. The map and chapter compositions reuse the same art to keep the episode's world coherent.
