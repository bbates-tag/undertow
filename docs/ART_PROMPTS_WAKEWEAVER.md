# UNDERTOW — The Wakeweaver art prompts (Nano Banana 2.0)

Prompts for the fourth character's portrait, reference sheet, card identity block, and all 28 cards. Same painted MtG/Hearthstone energy as the rest of the set — see `ART_PROMPTS.md` for the original style notes and `ART_PROMPTS_DROWNED.md` for the workflow this mirrors. Card *effects* are still being tuned in implementation, but names, ids, and scenes below are stable — safe to generate against.

**Design intent:** she's the set's siren — deliberately alluring, glamour-forward, the character art players linger on. The prompts aim for *sultry-elegant*: wet-look skin, a clinging sea-silk two-piece, long bare lines of midriff, shoulder, and back, knowing eyes. Nano Banana renders that register beautifully and consistently; it refuses nudity and explicit content, and prompts that flirt with the refusal line reroll into inconsistent junk — so don't push past glamour. Alluring, never explicit, is both the platform's ceiling and the right read for the set's painterly tone.

## How to use with Nano Banana

Nano Banana works best with flowing natural-language paragraphs, not keyword soup, and it does **not** take a separate negative prompt — fold exclusions into the sentence. Every prompt below is written to be pasted as-is after the style block.

**1. Prepend this style block to every prompt:**

> Painterly digital fantasy illustration for a collectible card game, dramatic cinematic lighting, rich saturated color against deep abyssal blues, crisp focal subject with loose painterly edges, epic underwater deep-sea setting, bioluminescent accents of pale silver-blue and moonlit pearl, volumetric light rays and drifting particulate. Wide 4:3 landscape composition with the subject centered. No text, no lettering, no logos, no borders, no card frame, no watermark.

(For the portrait, swap the last line for "Tall 4:5 portrait composition." For the reference sheet, swap it for "Wide 16:9 composition.")

**2. The identity block.** Whenever the Wakeweaver appears, include this paragraph **word-for-word** — paraphrasing it is how design drift happens:

> The Wakeweaver: a tall, lithe siren of the open water — smooth pale skin with a wet pearl sheen, subtly pointed ears, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes with the calm of someone watching a moment that hasn't happened yet. She wears a two-piece outfit of midnight sea-silk laced together from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff, shoulders, arms, and the long line of her upper back, with sheer net-lace along the arms; fine glowing silver-blue thread runs between her fingers in a cat's-cradle, and delicate net-pattern markings across her right shoulder and collarbone glow the same silver-blue. Graceful, poised, quietly dangerous — she always looks like she has already read your next move. Elegant and alluring, tastefully covered, no nudity.

**3. Palette anchors:** abyss navy `#071120`, weaver silver-blue `#9FD8FF`, moonlit pearl white, bone `#E8E0C8`. Her light is *cold* — where the Drowned glows seafoam green from within, the Wakeweaver is lit like moonlight on wet silk. Threads and wakes render as thin luminous silver-blue lines through dark water.

**4. File naming:** portrait → `public/art/characters/weaver.png`, then run `./scripts/optimize-art.sh`. The reference sheet doesn't ship — keep it in `art-originals/references/wakeweaverCharacterReference.png` and attach it to generations instead.

## Keeping the Wakeweaver consistent — tips

1. **Generate the portrait first, then the reference sheet from it, and attach the sheet to every card generation.** Open follow-ups with *"Using the attached image as the exact character reference, show the same character…"* — identity from a reference image beats any text description.
2. **Still paste the identity block verbatim** even when attaching the reference — the text tells it *what to preserve* (thread, markings, eyes) when the pose or crop changes.
3. **Rule of three:** glowing thread laced through her fingers, glowing net-lace markings on the right shoulder/collarbone, prescient pale silver-blue eyes. If a generation nails fewer than two of the three, reroll instead of settling — those are what players will recognize at card size.
4. **Hold the glamour register steady.** If a generation comes back too demure, add "elegant and alluring, confident pose" rather than escalating the outfit description; if it comes back risqué enough that you'd hesitate to ship it, reroll — don't crop. Consistency of tone across 28 cards matters more than any single image.
5. **Work in one chat session** so style context carries, but don't rely on chat memory for the character — re-attach the reference every time.
6. **When the character should NOT appear** (object/scene cards, marked *no figure* when the card list lands), say "no human figures" explicitly — with a character reference attached, Nano Banana loves sneaking them in.
7. Nano Banana renders text very eagerly. The "no text, no lettering" clause in the style block matters more here than on other generators — keep it even when trimming.
8. **Two-figure scenes need explicit staging.** With her reference attached, the model defaults her to a camera-facing hero pose — so for any card where she interacts with an enemy, state each figure's screen position, facing, and which limbs are where ("the cultist faces the viewer; only her arms reach around it from behind"). Avoid implying spatial relationships through a single word ("garrote", "behind"). And never describe a state by its absence — "guttering out" reads as *lit*; say "burned down to a last dying ember trailing smoke."

---

## Character portrait — `weaver.png` (4:5, characters folder)

The Wakeweaver suspended mid-water in open black ocean, turned in a graceful over-the-shoulder pose so the long bare line of her back and shoulder catches the moonlight, face turned to meet the viewer with a small knowing smile: a tall, lithe siren with smooth pale skin carrying a wet pearl sheen, subtly pointed ears, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes. She wears a two-piece outfit of midnight sea-silk laced from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff and back, sheer net-lace along her arms, delicate glowing net-pattern markings across her right shoulder and collarbone. Between her raised hands she weaves a cat's-cradle of fine glowing silver-blue thread, and the threads run out past the frame's edges into the dark like the strings of the whole ocean. Around her, a school of small silver fish bends in a perfect parting arc — nothing in the water touches her — and faint luminous ripple-lines cross the darkness behind her like wakes only she can see. Far above, moonlight falls through the surface in pale columns. Elegant and alluring, tastefully covered, no nudity; confident, unhurried, certain of every next move.

---

## Character reference sheet — `wakeweaverCharacterReference.png` (16:9, art-originals only)

Character reference turnaround sheet of the same single character shown three times full-body against a plain deep navy backdrop with flat, even lighting: front view, three-quarter view, and back view, identical costume and proportions in each — a tall, lithe siren with smooth pale skin with a wet pearl sheen, subtly pointed ears, long silver hair drifting weightless, luminous pale silver-blue eyes, a two-piece outfit of midnight sea-silk laced from dark netting — fitted halter top and low-slung wrap skirt — baring the midriff, shoulders, arms, and upper back, sheer net-lace along the arms, glowing net-pattern markings across the right shoulder and collarbone (visible in front and three-quarter views), fine glowing silver-blue thread laced between the fingers of both hands. Beside the turnaround, two inset studies: a close-up of her face with the knowing half-smile, and a close-up of her hands mid-weave with the luminous thread in a cat's-cradle. Neutral standing poses, arms relaxed except where weaving, elegant and alluring, tastefully covered, no nudity. Clean character-sheet presentation, no text, no lettering, no labels, no arrows.

---

## Card identity block (paste with every card that features her)

Attach the reference sheet image, open with *"Using the attached image as the exact character reference, show the same character…"*, then include this word-for-word:

> The Wakeweaver: a tall, lithe siren of the open water — smooth pale skin with a wet pearl sheen, subtly pointed ears, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes with the calm of someone watching a moment that hasn't happened yet. She wears a two-piece outfit of midnight sea-silk laced together from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff, shoulders, arms, and the long line of her upper back, with sheer net-lace along the arms; fine glowing silver-blue thread runs between her fingers in a cat's-cradle, and delicate net-pattern markings across her right shoulder and collarbone glow the same silver-blue. Graceful, poised, quietly dangerous — she always looks like she has already read your next move. Elegant and alluring, tastefully covered, no nudity.

Then describe the card's scene in one or two sentences (pose, action, what she's reading or dodging), ending with the lighting. The 28 card prompts below already follow this recipe — paste style block + identity block + the card's scene line, with the reference sheet attached.

---

## Card art (4:3)

### Starters

**Needle Jab — `needleJab` (attack)** · *character featured*
The Wakeweaver mid-lunge, slipping inside the strike of a lunging barracuda and driving a slim silver weaving-needle blade past its gill line — her body one clean arched line, the fish's momentum spent on the empty water where she just was. Moonlight tracing her silhouette, silver thread trailing from the needle's eye.

**Slip Aside — `slipAside` (skill)** · *character featured*
The Wakeweaver leaning back like a dancer beneath the sweep of a huge crab claw, water combing past her bared midriff, one raised hand casually paying out the glowing thread that pulls her clear. The claw's wake breaks around her in silver ripple-lines.

**Read the Water — `readTheWater` (skill)** · *character featured*
Close-up: the Wakeweaver's face in profile, eyes half-lidded and lit pale silver-blue, one finger raised to her lips, as luminous ripple-lines cross the darkness in front of her like lines of text only she can read.

**Undertow Feint — `undertowFeint` (attack)** · *character featured*
Center-left: a hooded kraken-cultist lunging with clawed hand and cold ritual flame at a translucent, dissolving afterimage of the Wakeweaver — a ghost of her woven from faint silver-blue thread-lines, already unraveling where the claws pass straight through it. The real Wakeweaver is at the right edge of the frame in profile, one step past the cultist, needle-blade trailing a line of silver light behind her, smiling slightly without looking back. Cold moonlight from above, the afterimage the brightest thing in the frame as it comes apart into drifting threads.
*(v1 was a garrote-from-behind scene; the model stages it fine but softens the taut wire into slack thread every time — interpersonal-violence smoothing. The feint reads better and renders reliably.)*

### Commons

**Riposte — `riposte` (attack)** · *character featured*
A moray's bite meeting the Wakeweaver's crossed needle-blade and taut thread — the parry frozen at the instant of a silver spark — her hips already turned into the counterstrike that hasn't landed yet.

**Sidestep — `sidestep` (skill)** · *character featured*
A single step traced in glowing afterimages: three ghost-outlines of the Wakeweaver's body stepping gracefully out of the path of a spear-thrust of black water, only the final outline solid, smiling.

**Shark's Shadow — `sharksShadow` (attack)** · *character featured*
The Wakeweaver swimming relaxed and unhurried inside the vast passing shadow of a great shark overhead, one hand trailing familiarly along its flank — escorted, untouched, entirely at home among teeth.

**Wake Reader — `wakeReader` (skill)** · *character featured*
The Wakeweaver kneeling on a moonlit sandbank, fingers spread above crossing ripple-lines like a fortune-teller over spread cards, each wake glowing faint silver-blue where her hand passes.

**Chart the Strike — `chartTheStrike` (skill)** · *character featured*
The Wakeweaver's outstretched finger tracing a dotted line of glowing thread through dark water to a hatchetfish's flank, the line ending in a small bright X over its heart.

**Escort Instinct — `escortInstinct` (skill)** · *character featured*
The Wakeweaver at the center of a bait-ball of ten thousand silver fish spiraling around her like a living gown, arms raised, the school hardening into a shimmering wall wherever teeth press in from the dark.

**Jawline — `jawline` (attack)** · *character featured*
The Wakeweaver's palm laid almost tenderly along the jaw of a lunging eel, redirecting the whole animal past her bare shoulder while her needle-blade slides in beneath its chin. Intimate, calm, decisive.

**Flickerfin — `flickerfin` (attack)** · *character featured*
The Wakeweaver as a streak of pearl light crossing the frame, a sardine school scattering like struck sparks around the blur — only her knowing pale eyes rendered in crisp focus at its head.

**Current Sense — `currentSense` (skill)** · *no figure*
A fisherman's glass float suspended in dark water, silver thread wound around its neck, and inside it a miniature glowing tide turning one phase ahead of the black ocean outside. No human figures.

### Uncommons

**Interrupt — `interrupt` (attack)** · *character featured*
The Wakeweaver's hand closing around a kraken-cultist's raised ritual lantern at the peak of its invocation, snuffing the light between her fingers — her small smile the only bright thing left in the frame.

**Slip the Jaws — `slipTheJaws` (skill)** · *character featured*
The Wakeweaver arched impossibly backward beneath the closing teeth of an anglerfish's mouth, a bridge of taut glowing thread strung between the jaws holding them one hand's width apart as she slides through the gap.

**Dead Reckoning — `deadReckoning` (skill)** · *character featured*
The Wakeweaver reclining at ease along the deck-rail of a sunken wreck, ankles crossed, plotting a course with thread stretched between her fingers and constellations of bioluminescence for a chart. Nothing is hunting her tonight.

**Countercurrent — `countercurrent` (attack)** · *character featured*
The Wakeweaver spinning in a tight spiral, wrap skirt and silver hair wrapping the turn, three needle-strikes traced as three clean arcs of silver light around a reeling armored crab.

**Weather Eye — `weatherEye` (power)** · *no figure*
A ship's storm-glass lashed in dark netting, the liquid inside curling into a perfect miniature storm while calm black water sleeps around it, silver-blue light leaking at the seams. No human figures.

**Bait the Lunge — `baitTheLunge` (skill)** · *character featured*
The Wakeweaver standing deliberately exposed in open water, arms spread in invitation, one toe resting on the trigger-line of an enormous net of glowing thread fanned out invisibly in the dark behind her.

**Future Swell — `futureSwell` (skill)** · *no figure*
A moonlit swell rising in the shape of a wave that has not broken yet, its face threaded with silver lines like a loom half-strung, the water beneath already leaning toward what it is about to become. No human figures.

**Pinpoint — `pinpoint` (attack)** · *character featured*
Extreme close-up: the tip of the Wakeweaver's needle-blade touching the single unarmored chink between an armored warden's shield plates, a bead of silver light gathering at the point of contact, her eyes reflected in the metal.

**Weaver's Grace — `weaversGrace` (power)** · *character featured*
A sea-beast's first blow landing not on the Wakeweaver but on a woven veil of thread she has drawn across the water like a curtain — the impact blooming into harmless light as she watches, unmoved, through the weave.

### Rares

**Called Shot — `calledShot` (skill)** · *character featured*
The Wakeweaver seated on a coral outcrop above the fight, legs crossed, pointing one finger like a duelist's pistol at a distant vampire squid — a single thread of light already connecting her fingertip to its heart.

**Perfect Read — `perfectRead` (power)** · *character featured*
Her eyes filling the frame: twin pale silver-blue irises in which tiny glowing figures of every enemy act out their next moves like marionettes on visible strings.

**Never Bitten — `neverBitten` (attack)** · *character featured*
The set's signature image: the Wakeweaver standing perfectly still inside the open bite of a leviathan, rows of teeth like cathedral pillars around her, idly examining her nails — one thread rising from her wrist to the roof of its mouth. It cannot close. It knows it cannot close.

**Eye of the Storm — `eyeOfTheStorm` (skill)** · *character featured*
The Wakeweaver seated cross-legged in a sphere of glassy calm water at the still center of a ring-shaped storm of thrashing eels and wreck debris, weaving unhurried while the chaos wheels around the bubble's edge.

**Second Sight — `secondSight` (skill)** · *character featured*
Close-up of the Wakeweaver's face with a second pair of eyes woven from glowing thread hovering in the water just above her own — both pairs open, the woven pair looking one moment further into the dark.

**Apex Escort — `apexEscort` (power)** · *character featured*
The Wakeweaver walking the seafloor flanked by the ghost of an enormous shark stitched in outlines of silver thread-light, her needle still trailing the final line of its tail — every small horror at the frame's edges pressing back into the dark.
