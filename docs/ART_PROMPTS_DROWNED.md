# UNDERTOW — The Drowned art prompts (Nano Banana 2.0)

Prompts for the third character's portrait and all 28 cards, written for Gemini's Nano Banana 2.0. Same painted MtG/Hearthstone energy as the rest of the set — see `ART_PROMPTS.md` for the original style notes.

## How to use with Nano Banana

Nano Banana works best with flowing natural-language paragraphs, not keyword soup, and it does **not** take a separate negative prompt — fold exclusions into the sentence. Every prompt below is written to be pasted as-is after the style block.

**1. Prepend this style block to every prompt:**

> Painterly digital fantasy illustration for a collectible card game, dramatic cinematic lighting, rich saturated color against deep abyssal blues, crisp focal subject with loose painterly edges, epic underwater deep-sea setting, bioluminescent accents of pale seafoam green and bone white, volumetric light rays and drifting particulate. Wide 4:3 landscape composition with the subject centered. No text, no lettering, no logos, no borders, no card frame, no watermark.

(For the portrait, swap the last line for "Tall 4:5 portrait composition.")

**2. The identity block.** Whenever the Drowned appears, include this paragraph **word-for-word** — paraphrasing it is how design drift happens:

> The Drowned: a gaunt sailor the sea gave back — waterlogged grey-green skin, long black hair drifting weightless like kelp, pupil-less milky-white eyes, a crust of pale barnacles across the left jaw and left shoulder, wearing a brine-darkened oilskin greatcoat cinched with rope. A faint seafoam-green glow pulses through the skin of the chest where the heart should be.

**3. Palette anchors:** abyss navy `#071120`, drowned seafoam `#9BE0A8`, bone `#E8E0C8`, cold moon silver. Blood in this set reads as near-black red ribbons in water, never gore.

**4. File naming:** save each image as the id in its heading (`drownedGrip.png` → `public/art/cards/`, portrait → `public/art/characters/drowned.png`), then run `./scripts/optimize-art.sh`.

## Keeping the Drowned consistent — tips

1. **Generate the portrait first and make it your reference image.** This is Nano Banana's strongest feature: attach the finished portrait to every card generation and open the prompt with *"Using the attached image as the exact character reference, show the same character…"*. Identity from a reference image beats any text description.
2. **Still paste the identity block verbatim** even when attaching the reference — the text tells it *what to preserve* (eyes, barnacles, chest glow) when the pose or crop changes.
3. **Rule of three:** milky eyes, barnacled left side, green chest glow. If a generation nails fewer than two of the three, reroll instead of settling — those are the features players will recognize at card size.
4. **Work in one chat session** so style context carries, but don't rely on chat memory for the character — re-attach the reference image every time.
5. **Lock the rendering too:** add "matching the painterly rendering and lighting of the attached reference" so the style doesn't wander between generations.
6. **When the character should NOT appear** (object/scene cards below are marked *no figure*), say "no human figures" explicitly — with a character reference attached, Nano Banana loves sneaking them in.
7. Nano Banana renders text very eagerly. The "no text, no lettering" clause in the style block matters more here than on other generators — keep it even when trimming.

---

## Character portrait — `drowned.png` (4:5, characters folder)

The Drowned standing waist-deep in a midnight sea inside a sunken ship's ribcage, facing the viewer: a gaunt sailor the sea gave back — waterlogged grey-green skin, long black hair drifting weightless like kelp, pupil-less milky-white eyes catching moonlight, a crust of pale barnacles across the left jaw and left shoulder, wearing a brine-darkened oilskin greatcoat cinched with rope. A faint seafoam-green glow pulses through the skin of the chest where the heart should be, lighting the coat from inside. One barnacled hand rests on a rusted boat-gaff planted like a staff; frayed rope and a strand of kelp trail from the other. Far above, the full moon is a wavering silver coin seen through fathoms of dark water. Regal, patient, quietly wrong — a figure that has already died once and is no longer afraid of anything down here.

---

## Card art (4:3)

### Starters

**Dead Man's Grip — `drownedGrip` (attack)** · *character featured*
The Drowned's barnacled grey-green hand and forearm thrust across the frame, clamped shut around the tail of a fleeing lanternfish-creature — the grip absolute, rope and kelp trailing from the sleeve, panic in the creature's glow. Cold moonlight from above, seafoam-green light from the wrist.

**Sodden Guard — `soddenGuard` (skill)** · *character featured*
The Drowned braced side-on behind a raised forearm wrapped in soaked rope and tangled fishing net, water sheeting off the oilskin coat as something heavy strikes; the impact bursts into white spray against the guard while the figure stands unmoved.

**Open Vein — `openVein` (attack)** · *character featured*
A thin cut on the Drowned's outstretched pale forearm releasing a single ribbon of near-black blood that unfurls through the water and sharpens into a striking lance aimed at a shadowed enemy; the ribbon backlit seafoam green where it thins.

**Sunken Fury — `sunkenFury` (attack)** · *character featured*
The Drowned in full fury, coat billowing like a storm cloud, hauling a rusted anchor upward in a two-handed arc — milky eyes blazing white, the green chest-light flaring through the ribs of the coat, sand and bones lifting off the seafloor around them.

### Commons

**Dead Thrash — `deadThrash` (attack)** · *character featured*
The Drowned swinging a cutlass carved from a great fish's spine, the blow mid-connect against an armored crab-beast, bone teeth of the blade raking sparks of pale light off its shell.

**Bleed Out — `bleedOut` (skill)** · *character featured*
Ribbons of near-black blood spiraling from the Drowned's open palm and hardening mid-water into a curved wall of deep red glass; the figure calm behind the forming shield, chest-light reflected in its surface.

**Cold Grasp — `coldGrasp` (attack)** · *no figure*
At dead low tide, a pale waterlogged hand erupts from exposed black sand and seizes a scuttling crab-thing mid-stride — frost-blue rim light, a thin sliver of moon above the tideline, everything else silent and dark. No human figures beyond the single emerging hand.

**Sinking Feeling — `sinkingFeeling` (skill)** · *character featured*
The Drowned sinking backward into darkness, arms spread, face serene and upturned toward the tiny bright coin of the surface far above; a stream of exhaled bubbles rises past, each bubble holding a bead of moonlight.

**Salt in the Wound — `saltInTheWound` (attack)** · *no figure*
Close-up of a long scar across grey-green skin, jagged crystals of white salt blooming from its edges like hoarfrost, each crystal catching a spark of seafoam-green light. Painterly and strange rather than gory. No full figures.

**Grave Weight — `graveWeight` (skill)** · *character featured*
The Drowned shouldering a massive barnacle-crusted stone grave-slab like a tower shield, sand streaming off its face as it settles, the seafloor cracking faintly beneath their boots.

**Numb Flesh — `numbFlesh` (skill)** · *character featured*
The Drowned pressing one palm flat to their own chest; from under the hand a ring of skin turns pale stone-grey and spreads, the green heartlight seeping between the fingers, the face utterly untroubled.

**Hollow Lung — `hollowLung` (attack)** · *character featured*
The Drowned driving a barbed harpoon forward with both hands while exhaling their entire breath as one huge silver bubble — the strike and the emptied lungs in the same violent instant, bubbles streaming back along the coat like contrails.

**Ebbtide Fangs — `ebbtideFangs` (attack)** · *no figure*
A gaunt moray eel, flesh worn to ghostly translucence over its skeleton, lunging out of an exposed reef pool at low tide with needle teeth bared; wet black rocks, stranded starfish, a thin cold moon. No human figures.

### Uncommons

**Weeping Hull — `weepingHull` (power)** · *no figure*
The tilted hull of a sunken ship, its planks seeping slow dark ribbons into the water like tears; where the ribbons run, a crust of pale barnacle armor grows thick over the wood, and a faint green lantern-glow breathes inside the wreck. No human figures.

**Marrow Bloom — `marrowBloom` (power)** · *no figure*
Bone-white coral flowers blossoming out of the cracked ribs of an enormous whale skeleton on the seafloor, each blossom with a seafoam-green glowing heart; tiny silver fish shelter between the petals. Beautiful and quietly macabre. No human figures.

**Last Breath — `lastBreath` (skill)** · *character featured*
Extreme close-up of the Drowned's face in profile, lips parted, holding a single glowing seafoam-green bubble between thumb and forefinger like a jewel — the last one. Pitch-dark backdrop, the bubble the brightest thing in the frame.

**Anglerfish Pact — `anglerfishPact` (attack)** · *character featured*
In total darkness, the Drowned reaches palm-out toward the dangling lure-light of a colossal anglerfish; their green chest-glow answers the lure's cold white like two lanterns meeting, and behind the light a cathedral of teeth is only just suggested. A bargain, not a battle.

**Brine Pulse — `brinePulse` (attack)** · *character featured*
The Drowned clapping both palms together at the center of the frame, releasing a perfect expanding sphere of white brine and green light; small deep-sea horrors tumble head over tail at its rim.

**Wake of the Dead — `wakeOfTheDead` (skill)** · *character featured*
A ring of tall pale lights like standing drowned sailors circling the Drowned on the seafloor, their glow thickening the water above into a domed ceiling of green-white light. Solemn, funerary, protective.

**Coffin Nail — `coffinNail` (attack)** · *no figure*
A huge black iron ship's spike driving downward through dark water, trailing rust and bubbles, an instant from pinning a shadowy crab-beast against a coral-crusted coffin lid. Straight vertical force. No human figures.

**Still Heart — `stillHeart` (skill)** · *character featured*
The Drowned's two barnacled hands cradling their own faintly glowing heart wrapped in bandages of woven seagrass, seafoam light pulsing softly between the fingers against the dark. Tender, reverent, unsettling. (If the generator balks: a heart-shaped pale coral cradled the same way.)

**Tideworn Shroud — `tidewornShroud` (skill)** · *character featured*
The Drowned drawing a ragged sailcloth shroud around their shoulders; where the cloth settles, the churning water goes still as glass, and small glowing green anchors of light pin its hem to the seafloor.

### Rares

**Break the Surface — `breakSurface` (skill)** · *character featured*
The Drowned bursting head-and-shoulders through the night ocean's surface in a crown of white spray, moonlight flooding their upturned face, milky eyes wide, mouth open in a first breath — streams of green light pouring off them like steam into the cold air. The set's signature image: one stolen second of being alive.

**Abyssal Communion — `abyssalCommunion` (power)** · *character featured*
The Drowned kneeling small on the open seafloor before a wall of absolute darkness in which an immense tentacled silhouette almost resolves; they offer up a cupped double-handful of their own green heartlight, and one vast limb reaches to accept it.

**Crushing Fathoms — `crushingFathoms` (attack)** · *character featured*
The entire ocean descending as a single black piston — a column of compressed water flattening a sea-beast against the floor, concentric pressure rings racing outward through the sand; the Drowned stands calm at the crater's edge, coat whipping upward in the outrush.

**Second Drowning — `secondDrowning` (skill)** · *character featured*
The Drowned being pulled under by a second pair of their own pale hands reaching up out of black water, gripping the coat's lapels — the face serene, even relieved, air spilling upward in silver sheets. Doubled self, one descent.

**Grave Tide — `graveTide` (attack)** · *no figure*
A low black tide rolling across a drowned graveyard in successive breakers, each wave-crest carrying tumbling bone-white debris and small green grave-lights, hammering the same reef wall again and again. Relentless rhythm. No human figures.

**Echo of Pain — `echoOfPain` (power)** · *character featured*
Split composition: a wound tearing open across the Drowned's chest on the left, and the identical wound ripping open in a monstrous eel on the right — a single taut thread of seafoam-green light connecting the two injuries across dark water.
