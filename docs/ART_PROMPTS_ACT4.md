# UNDERTOW — Act IV art prompts: The Dreaming Dark

Prompts for the Act IV enemy set, the act backdrop, and the boss arena. Same workflow as `ART_PROMPTS.md`: drop masters into `public/art/{enemies,backgrounds}/<id>.png`, run `./scripts/optimize-art.sh`, commit the webps.

## How to use

**1. Prepend the shared style block to every prompt** (same one as the main doc):

> Painterly digital fantasy illustration for a collectible card game, dramatic cinematic lighting, rich saturated color against deep abyssal blues, crisp focal subject with loose painterly edges, epic underwater deep-sea setting, bioluminescent accents of glowing cyan, hot magenta, and treasure gold, volumetric light rays and drifting particulate, no text, no borders, no card frame, no watermark.

**2. Then add the act mood line.** Act IV is *inside the Drowned God's dream* — deeper than the Hadal dark, but not merely darker: the water behaves like sleep. Append this to every Act IV prompt, right after the style block:

> Dreamlike wrongness: violet-black water that ripples like disturbed sleep, faint drifting after-images and double exposures, geometry softly melting at the edges of vision, distant shapes that might be memories; palette anchored in deep violet `#8E5AFF` and abyss-black, with ghost-cyan and one sickly thread of magenta.

**3. Append the negative prompt** (SDXL/Flux etc.):

> text, watermark, signature, card frame, border, UI, logo, blurry, low detail, flat colors, cartoon, cel shading, photograph, 3d render

**4. Sizes.** Enemy portraits **1:1 square** (creature centered on dark water, vignette edges); boss **4:5 portrait** at 2× resolution; backgrounds **16:9 landscape** at ≥1920px wide (the optimizer caps backgrounds at 1920).

**5. The act's visual grammar** — the throughline that keeps ten images reading as one place: every Act IV creature is a *dream-echo* of something from the descent. Where its Act I–III counterpart was flesh, the echo is half-remembered — translucent in patches, trailing after-images, lit from inside by violet dream-light. If a prompt says "echo of X," pull up X's prompt from `ART_PROMPTS.md` and keep one unmistakable visual quote from it (the moray's cadence, the King's crown) while making everything else wrong.

---

## Enemies — portraits (1:1)

### Normals

**Drowned Memory — `drownedMemory`**
A small humanoid wisp of violet-black water in the half-formed shape of a drowning sailor — face smeared like a thumbprint on wet glass, edges dissolving into short-lived after-images of itself, one hand forever reaching upward for a surface that isn't there. Behind it, two or three more identical wisps mass in the murk. Sad, quiet, and wrong; grief given a school.

**False Lantern — `falseLantern`**
An anglerfish-shaped absence: no fish at all, only a warm golden lure-light bobbing in violet darkness — and around where the fish should be, the water itself creases into the faint suggestion of jaws, visible only where the light bends. A scatter of old bones drifts below the glow. The light is real; nothing else is. (Negative prompt: visible anglerfish body, detailed fish, scales.)

**Sleepwalker — `sleepwalker`**
A drowned sailor in a rotted oilskin coat walking calmly along the seabed as if on deck — eyes open and moon-white, lungs full, boots stirring slow silt clouds, one hand raised to a lantern that burns impossible violet underwater. He is mid-stride on his eternal watch rounds, utterly serene; faint after-images trail one pace behind him. Peace that will kill you.

**Dream Leech — `dreamLeech`**
A sleek lamprey-like worm of translucent violet jelly, its ring-mouth of concentric teeth glowing soft gold — and visible inside its glassy body, a swallowed skein of warm golden light: the stolen memory of being awake. It drifts hungrily toward the viewer, trailing thin threads of toxin-green. Beautiful, parasitic, faintly obscene.

**The Unremembered — `unremembered`**
A shambling drowned corpse the dream has half given up on rendering — patches of it missing outright, replaced by static-like violet blur; barnacled ribs, one arm ending in smeared un-detail, head a rough sketch of a skull. It gnaws forward anyway. Around it, faint outlines of the same figure rising again and again. Forgotten, and furious about it. (Negative prompt: intact zombie, detailed face.)

**Sleep-Tide — `sleepTide`**
A slow crescent wave of violet-black water rolling through open dark like a closing eyelid, its face marbled with moonlit foam that forms and unforms the phases of the tide dial — low, rising, high; within the crest, the sleeping suggestion of a face. Hypnotic, vast, patient. The tide, dreaming.

### Elites

**Nightmare of the Sunken King — `nightmareKing`**
The Sunken King's coral-crusted crown floating in violet darkness — and beneath it, the dream sketching him a new body from memory: a translucent, wrong-jointed rush of skeleton, claw, and rotten purple silk, painted in loose smeared strokes that don't quite connect, several arms in the places arms nearly go. The crown is rendered perfectly; nothing else is. Regal, furious, incomplete. (Negative prompt: solid body, complete skeleton, symmetrical.)

**The Chorus — `chorus`**
A drowned choir fused into one being — a column of overlapping translucent torsos and upturned singing faces, mouths all open on the same held note, rising from a shared robe of black water; violet light pulses up through them like breath through an organ. Around the column, small torn-off wisps of song spiral upward. Beautiful the way a funeral is.

**Chorus Echo — `chorusEcho`**
A single voice torn loose from the Chorus — one translucent upturned face and throat trailing off into ragged violet water, mouth open on a note it can't stop singing, barely more substantial than a reflection. Small, brief, and sharp. (Battle-only minion: generate at 1:1 like the others; it reuses the Chorus's palette so the family resemblance is automatic. The compendium falls back to the Chorus art by alias, but battle needs this file.)

**The Pressure — `thePressure`**
Not a creature: a place in the water where the dream leans down. A vast column of visibly compressed dark — water wrinkling inward in concentric rings toward a humanoid density at the center, seafloor stone cracking in a slow ring beneath it, spines of fractured basalt levitating in its grip-field. At its heart, two small pale points like eyes at crush depth. The sea, deciding. (Negative prompt: solid monster body, muscular figure.)

### Boss

**What Dreams Beneath — `dreamsBeneath` (4:5, 2× resolution)**
The dream's owner, seen from inside the dream: a god-scale presence filling the frame from below like weather — a vast third-eyed face suggested across the entire dark, its features made of everything the run has descended past (reef shadow, trench stone, kraken curve) layered like double exposures; the single central eye is just beginning to focus on the viewer, iris glowing violet-white, and everywhere it looks the water renders sharper. Below, a thread of golden lure-light and a spiral of drowned memories orbit it like moths. Generate two variants if possible: **eye half-lidded and soft** (Dreaming) and **eye fully open, water crisp with terrible clarity** (IT IS LUCID). (Negative prompt: full creature body, sea monster with limbs, dragon.)

---

## Backgrounds (16:9, ≥1920px — full-bleed battle backdrops, subjects must stay out of the center where enemies render)

**Act IV depth backdrop — `act4`**
The Dreaming Dark itself: an impossible open water-scape below the seafloor — above, the cracked underside of the Hadal trench floor glowing faintly where the waking world leaks through; below and beyond, violet-black dream-water where enormous soft silhouettes of remembered creatures (a crab, an eel, a kraken arm) drift half-formed and dissolve like thoughts. Ruins from every earlier act float unanchored — a shard of sunlit reef, a piece of shipwreck, a cultist shrine — each lit by its own wrong little memory of light. Composition: darkest and emptiest in the center-band where enemies stand; detail and glow pushed to the edges and upper third. Vast, silent, asleep.

**Boss arena — `dreamsBeneath` (backgrounds folder)**
The floor of the dream: a bowl of perfectly still violet-black water under a sky that is one enormous, barely-open eye — its iris a ring of soft violet light taking up the upper third of the frame, lid of dark water above it. Below, a plain of drowned memories standing like a field of statues (sailors, fish, a crowned figure), all facing the viewer, all slightly translucent; a single thread of golden light falls from the eye's center to the middle distance. Composition: the eye and light-thread high and centered, the lower half calm and dark where the boss and player UI sit. Reverent, final, utterly still. *(Same id as the boss portrait but saved under `public/art/backgrounds/` — the game keys boss backdrops by enemy id.)*

---

### Batch tips for this set

- Generate **Drowned Memory first** and use it as the style anchor (`--sref` / IP-Adapter) for the other nine — it carries the whole act's translucent-echo language.
- The set's discipline: **violet is the act's color, gold is memory, magenta appears only on the boss.** If a normal enemy comes out magenta-heavy, reroll it.
- Echo enemies work best when the *quoted* element (crown, lantern, wave) is rendered crisply and everything else is loose — if the whole image goes soft, the enemy loses its silhouette at 90px.
- Check every portrait as a ~90px circle thumbnail before committing: strong central silhouette, no critical detail in the corners.
