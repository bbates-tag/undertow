# UNDERTOW — The Wakeweaver art prompts (Nano Banana 2.0)

Prompts for the fourth character's portrait, reference sheet, and the identity block for her card art. Same painted MtG/Hearthstone energy as the rest of the set — see `ART_PROMPTS.md` for the original style notes and `ART_PROMPTS_DROWNED.md` for the workflow this mirrors. Card-by-card prompts come later, once the pool in `WAKEWEAVER.md` is locked.

**Design intent:** she's the set's siren — deliberately alluring, glamour-forward, the character art players linger on. The prompts aim for *sultry-elegant*: wet-look skin, a clinging sea-silk two-piece, long bare lines of midriff, shoulder, and back, knowing eyes. Nano Banana renders that register beautifully and consistently; it refuses nudity and explicit content, and prompts that flirt with the refusal line reroll into inconsistent junk — so don't push past glamour. Alluring, never explicit, is both the platform's ceiling and the right read for the set's painterly tone.

## How to use with Nano Banana

Nano Banana works best with flowing natural-language paragraphs, not keyword soup, and it does **not** take a separate negative prompt — fold exclusions into the sentence. Every prompt below is written to be pasted as-is after the style block.

**1. Prepend this style block to every prompt:**

> Painterly digital fantasy illustration for a collectible card game, dramatic cinematic lighting, rich saturated color against deep abyssal blues, crisp focal subject with loose painterly edges, epic underwater deep-sea setting, bioluminescent accents of pale silver-blue and moonlit pearl, volumetric light rays and drifting particulate. Wide 4:3 landscape composition with the subject centered. No text, no lettering, no logos, no borders, no card frame, no watermark.

(For the portrait, swap the last line for "Tall 4:5 portrait composition." For the reference sheet, swap it for "Wide 16:9 composition.")

**2. The identity block.** Whenever the Wakeweaver appears, include this paragraph **word-for-word** — paraphrasing it is how design drift happens:

> The Wakeweaver: a tall, lithe siren of the open water — smooth pale skin with a wet pearl sheen, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes with the calm of someone watching a moment that hasn't happened yet. She wears a two-piece outfit of midnight sea-silk laced together from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff, shoulders, arms, and the long line of her upper back, with sheer net-lace along the arms; fine glowing silver-blue thread runs between her fingers in a cat's-cradle, and delicate net-pattern markings across her right shoulder and collarbone glow the same silver-blue. Graceful, poised, quietly dangerous — she always looks like she has already read your next move. Elegant and alluring, tastefully covered, no nudity.

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

---

## Character portrait — `weaver.png` (4:5, characters folder)

The Wakeweaver suspended mid-water in open black ocean, turned in a graceful over-the-shoulder pose so the long bare line of her back and shoulder catches the moonlight, face turned to meet the viewer with a small knowing smile: a tall, lithe siren with smooth pale skin carrying a wet pearl sheen, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes. She wears a two-piece outfit of midnight sea-silk laced from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff and back, sheer net-lace along her arms, delicate glowing net-pattern markings across her right shoulder and collarbone. Between her raised hands she weaves a cat's-cradle of fine glowing silver-blue thread, and the threads run out past the frame's edges into the dark like the strings of the whole ocean. Around her, a school of small silver fish bends in a perfect parting arc — nothing in the water touches her — and faint luminous ripple-lines cross the darkness behind her like wakes only she can see. Far above, moonlight falls through the surface in pale columns. Elegant and alluring, tastefully covered, no nudity; confident, unhurried, certain of every next move.

---

## Character reference sheet — `wakeweaverCharacterReference.png` (16:9, art-originals only)

Character reference turnaround sheet of the same single character shown three times full-body against a plain deep navy backdrop with flat, even lighting: front view, three-quarter view, and back view, identical costume and proportions in each — a tall, lithe siren with smooth pale skin with a wet pearl sheen, long silver hair drifting weightless, luminous pale silver-blue eyes, a two-piece outfit of midnight sea-silk laced from dark netting — fitted halter top and low-slung wrap skirt — baring the midriff, shoulders, arms, and upper back, sheer net-lace along the arms, glowing net-pattern markings across the right shoulder and collarbone (visible in front and three-quarter views), fine glowing silver-blue thread laced between the fingers of both hands. Beside the turnaround, two inset studies: a close-up of her face with the knowing half-smile, and a close-up of her hands mid-weave with the luminous thread in a cat's-cradle. Neutral standing poses, arms relaxed except where weaving, elegant and alluring, tastefully covered, no nudity. Clean character-sheet presentation, no text, no lettering, no labels, no arrows.

---

## Card identity block (paste with every card that features her)

Attach the reference sheet image, open with *"Using the attached image as the exact character reference, show the same character…"*, then include this word-for-word:

> The Wakeweaver: a tall, lithe siren of the open water — smooth pale skin with a wet pearl sheen, long silver hair streaming and coiling like slow current, luminous pale silver-blue eyes with the calm of someone watching a moment that hasn't happened yet. She wears a two-piece outfit of midnight sea-silk laced together from her own dark netting — a fitted halter top and a low-slung wrap skirt slit for movement — baring her midriff, shoulders, arms, and the long line of her upper back, with sheer net-lace along the arms; fine glowing silver-blue thread runs between her fingers in a cat's-cradle, and delicate net-pattern markings across her right shoulder and collarbone glow the same silver-blue. Graceful, poised, quietly dangerous — she always looks like she has already read your next move. Elegant and alluring, tastefully covered, no nudity.

Then describe the card's scene in one or two sentences (pose, action, what she's reading or dodging), ending with the lighting. Card-by-card prompts will be added below once the 28-card pool in `WAKEWEAVER.md` is final.
