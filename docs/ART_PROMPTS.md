# UNDERTOW — AI art generation prompts

Prompts for generating painted card-game art (Magic: The Gathering / Hearthstone energy) for every card and enemy. Written so a full set generated in one sitting stays cohesive.

## How to use

**1. Prepend the style block to every prompt.** Consistency comes from the shared prefix, not luck:

> Painterly digital fantasy illustration for a collectible card game, dramatic cinematic lighting, rich saturated color against deep abyssal blues, crisp focal subject with loose painterly edges, epic underwater deep-sea setting, bioluminescent accents of glowing cyan, hot magenta, and treasure gold, volumetric light rays and drifting particulate, no text, no borders, no card frame, no watermark.

**2. Append the negative prompt** (for generators that support one — SDXL, Flux, etc.):

> text, watermark, signature, card frame, border, UI, logo, blurry, low detail, flat colors, cartoon, cel shading, photograph, 3d render

For Midjourney use `--ar` flags and `--style raw`; for DALL·E/gpt-image just fold "landscape 4:3" etc. into the sentence.

**3. Sizes / aspect ratios**

| Asset | Ratio | Notes |
| --- | --- | --- |
| Card art | **4:3 landscape** | Fills the card's art band; keep the subject centered — edges may crop |
| Enemy portraits | **1:1 square** | Creature centered on dark water, vignette edges |
| Bosses & characters | **4:5 portrait** | Room for drama; generate 2× resolution |

**4. File naming.** Save as the content id shown in each heading (`tideStrike.png`, `sunkenKing.png`) — a future integration can then wire images in by id with the current icons as fallback. In-game hookup is one edit to `CardView`'s art zone / `EnemyView`, keeping art inside the existing token-styled frames.

**5. Palette anchors** (from the game's design tokens): abyss navy `#071120`, glow cyan `#38E1D3`, lure magenta `#FF5DA2`, gold `#FFCE5C`, toxin green `#7EF29A`, volt yellow `#FFE45C`. Toxin cards lean green, Voltaic cards lean yellow-white lightning, boss imagery leans magenta.

---

## The Tidecaller — card art (4:3)

Recurring figure: **the Tidecaller** — a tall priestess in barnacle-crusted robes the color of deep water, silver tide-marks tattooed up her arms, hair drifting like kelp, eyes reflecting moonlight that shouldn't reach this deep. Keep her consistent wherever she appears.

### Starters

**Tide Strike — `tideStrike` (attack)**
The Tidecaller mid-turn, sweeping a crescent blade of solid seawater edged in glowing cyan foam; startled silverfish scatter from the arc. Sunlit shallows, god rays from above. Kinetic and heroic — the set's signature strike.

**Kelp Guard — `kelpGuard` (skill)**
Ribbons of living kelp whip upward and weave themselves into a dense braided shield in front of the Tidecaller's raised palm. Green-gold translucence with cyan backlight, bubbles caught in the weave.

**Riptide — `riptide` (attack)**
A horizontal channel of violently accelerating water seizes a shark by the tail and hauls it backward into darkness, its eyes wide. Streaking motion blur, white water against deep blue.

**Undertow — `undertow` (skill)**
A slow, beautiful, terrible spiral of water beneath a swimmer's silhouette, moonlight caught in its coils, pulling everything gently down. Hypnotic, ominous calm.

### Commons — attacks

**Harpoon Shot — `harpoonShot`**
A carved bone harpoon streaks through open water trailing a rope of bubbles, moments from impact; shallow sun-dappled backdrop. Clean, fast, deadly.

**Twin Fins — `twinFins`**
Two razor-edged fins slice past the viewer in crossing arcs, twin wakes of white water forming an X; a ribbon of blood drifts where they've already been.

**Venom Spit — `venomSpit`**
A glob of luminous green venom arcs through dark water, sizzling and shedding toxic droplets that glow like embers; the spitting creature only a suggestion of jaws below.

**Shell Crack — `shellCrack`**
A great armored shell splitting under a blow — the crack blazes with escaping light, fragments spinning free, the soft creature inside horribly exposed. Impact frozen at the perfect moment.

**Tidal Slam — `tidalSlam`**
A fist made of an entire cresting wave crashes down on a reef outcrop, coral shattering, spray in every direction. At its crest, the faint silver disc of a high moon. Maximum impact.

**Rip Current — `ripCurrent`**
A sideways river inside the sea — a visible current dragging sand, driftwood, and one very unlucky fish across the frame in streaks. Directional energy, everything bending one way.

**Feeding Frenzy — `feedingFrenzy`**
A tightening spiral of piranha-like fish converging on a single point, water churned pink and white, scales flashing like thrown coins. Chaos with a center.

**Barbed Volley — `barbedVolley`**
A fan of black urchin spines mid-flight like a volley of arrows, each trailing a thread of bubbles; several already studding a wooden hull in the background.

**Gnash — `gnash`**
Extreme close-up of mismatched needle teeth snapping shut on empty water, so near they blur; a single scale drifts where prey just was. Cheap, quick, savage.

**Depth Charge — `depthCharge`**
A rust-scabbed antique naval mine sinking in silence, one hair of glowing fuse-light crawling along its shell; fish flee the frame ahead of what's coming.

### Commons — skills

**Shell Up — `shellUp`**
The Tidecaller kneeling behind an enormous ribbed scallop shell that has slammed shut before her like a tower shield, claw marks screeching sparks of light across its face.

**Ink Cloud — `inkCloud`**
A rolling bloom of blue-black ink swallowing the frame; within it, the Tidecaller's silhouette dissolving to nothing while a confused predator noses the dark. Weakness in the water.

**Current Reading — `currentReading`**
The Tidecaller's fingertips resting on braided lines of glowing current that thread through the water like a luminous chart; her eyes closed, reading the sea's intentions. Brass sextant and compass drifting beside her.

**Bioluminesce — `bioluminesce`**
The Tidecaller igniting from within — hundreds of pinpoint cyan lights waking across her skin and robes, pushing back a wall of darkness. Soft glow, defiant mood.

**Toxic Slick — `toxicSlick`**
An oily, iridescent green slick spreading across a coral shelf, everything beneath it wilting; the sheen catches light in sickly rainbows.

**Ebbguard — `ebbguard`**
The tide visibly withdrawing — a waterline sliding down a barnacled stone bulwark, and in the exposed shallows the Tidecaller braced and unbothered, low water lapping her boots. Defense that loves the ebb.

**Air Pocket — `airPocket`**
A silver mirror-ceiling of trapped air inside a basalt cave; the Tidecaller breaks its surface mid-gasp, face lit from below by cyan water-light. One breath of the old world.

**Tidepool — `tidepool`**
A small rock pool glowing like a lantern at dusk, crowded with tiny luminous creatures; one small hand-sized wave rolls in. Quiet, generous, alive.

### Uncommons — attacks

**Lurker's Ambush — `lurkersAmbush`**
A monstrous eel exploding from a black reef crevice with jaws wide, striking exactly as the rising tide floods the gap — white water and teeth. The wave carries the ambush.

**Corrode — `corrode`**
Green-gold acid chewing through a knight's-armor-thick shell in real time, metal and chitin sloughing like wax; toxic vapor bubbles upward.

**Hull Ram — `hullRam`**
The barnacle-armored prow of a sunken galleon driven forward like a battering ram by a wall of water, moments from impact; the Tidecaller stands on its deck. Lead with the wreck of yourself.

**Gaff Hook — `gaffHook`**
A great iron gaff hook yanking a huge wounded fish up through the frame, scales flying; brutal fisherman's finisher, executioner's energy.

**Chum the Water — `chumTheWater`**
A cloud of blood and scraps blooming across open blue; below it, a dozen fin silhouettes turning inward at once. Dread with geometry.

**Piercing Spine — `piercingSpine`**
A single narwhal-like spiral spine punching clean through a raised shield of shell and coral, its tip emerging the other side; fracture lines glowing. Nothing blocks it.

**Whirlpool — `whirlpool`**
Top-down view of a churning whirlpool dragging flotsam and small fish into its throat, spiral banded in white foam and deep shadow; the moon's reflection smeared around its rim.

**Frenzied Bites — `frenziedBites`**
Three crescent bite-wounds stamped in a rising diagonal across a great fish's armored flank, each glowing brighter than the last, blood and foam churning around them; the attacker is only a blurred streak of fins in the middle distance. High-tide moonlight through storm-surge water. (Negative prompt: multiple sharks, three creatures, monster heads.)

**Leech Fangs — `leechFangs`**
A lamprey-mouthed serpent latched onto a larger creature, a visible ribbon of glowing life-light flowing up its throat toward the Tidecaller's outstretched hand. Stolen vitality.

### Uncommons — skills

**Hardened Shell — `hardenedShell`**
Plates of thick nacre layering themselves over the Tidecaller's shoulders and raised forearm like time-lapse geology, seams glowing faint gold; an anchor chain wraps her waist. Immovable.

**Spine Burst — `spineBurst`**
Hundreds of obsidian spines erupting outward from the Tidecaller's silhouette in a perfect radial burst, each backlit cyan; a lunging predator recoiling mid-strike.

**Tide Chart — `tideChart`**
An ancient sea-chart unrolled across a stone table underwater — moon phases, spiral tide-lines, and brass instruments — with one path traced in living glowing water. Knowledge as power.

**Patient Hunter — `patientHunter`**
The Tidecaller seated motionless on a trench ledge with a long bone fishing pole, line vanishing into blackness; coral has begun to grow on her shoulder. Stillness with intent.

**Angler's Lure — `anglersLureCard`**
A single beautiful mote of warm light bobbing in absolute darkness — and just barely, behind it, the suggestion of a vast patient smile. The prettiest trap in the sea.

**Polyp Graft — `polypGraft`**
Living coral polyps knitting themselves across a wound on the Tidecaller's arm, flesh and reef becoming one lattice, tiny feather-tendrils drinking light. Beautiful and slightly unsettling healing.

**Mirror Scales — `mirrorScales`**
The Tidecaller wrapped in a cloak of mirror-bright fish scales; a striking eel meets its own reflection and its own teeth. Attacker punished by its image.

**Sea Legs — `seaLegs`**
The Tidecaller riding a current standing, arms loose, robes streaming — surfing without a board through a canyon of coral, utterly at home. Effortless grace.

**Ink Jet — `inkJet`**
A squid-fast escape: the Tidecaller vanishing in a jet-streak of ink and bubbles, leaving a perfect afterimage of herself hanging in the water where the strike lands.

### Powers

**Miasma — `miasma`**
A slow green spore-fog rolling over a reef like weather, every creature it touches wilting mid-motion; the Tidecaller walks untouched at its heart. The deep exhales.

**Coral Carapace — `coralCarapace`**
Armor growing in time-lapse: branching coral colonizing the Tidecaller's robes into a living breastplate, adding a new layer even as you watch. Patience made solid.

**Lunar Pull — `lunarPull`**
An impossibly huge low moon dragging the ocean visibly upward toward it — a hill of sea rising in the middle distance, the Tidecaller's arms raised in conduction. The tide on a leash.

**Predator's Eye — `predatorsEye`**
One enormous slit-pupiled eye opening in the dark water behind the Tidecaller's shoulder, seeing everything; card-fan of glowing possibilities reflected in its iris.

**Blood in the Water — `bloodInWater`**
A single drop of blood blooming into a red flower in clear water; beneath it, rising from the deep blue gradient, one unhurried fin. Every strike calls something.

### Rares

**Maelstrom — `maelstrom`**
An apocalyptic whirlpool swallowing a three-masted shipwreck whole, lightning of foam around its rim, the sea bent into a screaming spiral a mile wide. The trench opens one eye.

**Abyssal Fang — `abyssalFang`**
A single tooth the size of a cathedral door, held reverently in the Tidecaller's both hands, its edge catching high-tide moonlight; whatever lost it is not shown. Implication as horror.

**Blightwave — `blightwave`**
A wave made of festering luminous rot doubling over itself as it breaks — green fire in water, every droplet a plague seed; corals blackening beneath its shadow. What festers, blooms.

**King Tide — `kingTide`**
The sea locked at eternal flood: a drowned throne room under a black-and-cyan eclipse, water pressing at the cracked ceiling, a tide-mark burned permanently at its highest line. No more waiting on the moon.

**Leviathan's Blood — `leviathansBlood`**
A rough-hewn chalice of glowing crimson-gold ichor, thick as honey, lifted to the Tidecaller's lips — the drink of something ancient, veins already lighting up her throat. Power with a price implied.

**Nacre Bastion — `nacreBastion`**
A fortress wall of mother-of-pearl rising from the seafloor in overlapping opalescent plates, moon-fired pinks and cyans rippling across it; the Tidecaller small and safe in its lee.

**Perpetual Current — `perpetualCurrent`**
A closed loop of glowing water — an ouroboros current — circling the Tidecaller endlessly, carrying cards, fish, moonlight, and time around and around. Serene engine.

**Depthless Hunger — `depthlessHunger`**
Vast underwater establishing shot: the entire seafloor is one colossal open mouth — a canyon rim of mountain-sized pale teeth stretching from the far left edge to the far right edge of the image, pure black abyss between them, faint magenta glow rising from the throat. High above, a single tiny whale skeleton drifts down toward the darkness like a falling leaf, dwarfed to insignificance, lit by one beam of moonlight. No other creatures, no people. Extreme scale contrast. Feed it and it remembers you.
*(Alt, reads great at card size: looking straight down into a perfectly circular maw — concentric rings of curved teeth spiraling into absolute darkness like a whirlpool made of jaws, a tiny glowing whale skeleton spiraling down at its center; symmetrical, cyan rim-light, magenta throat-glow. Negative prompt for this card: fishing rod, boat, human, face, two mouths.)*

---

## The Voltaic — card art (4:3)

Recurring figure: **the Voltaic** — a lean duelist with eel-black skin traced in living yellow-white current lines, dorsal fin ridging their spine, fingertips that spark when they flex. Palette: volt yellow `#FFE45C` and white arc-light against storm-dark teal.

### Starters

**Jolt Strike — `joltStrike`**
The Voltaic's fist connecting with an armored jaw, a starburst of yellow-white arc lightning at the point of impact, current crawling up their forearm afterward — some kept, banked.

**Eel Guard — `eelGuard`**
Three electric eels coiling in formation into a lattice shield before the Voltaic's chest, arcs jumping between their bodies like chain-links of light.

**Static Field — `staticField`**
A dome of fine crackling static enclosing the Voltaic, every particle in the water inside it standing still and glowing; a predator's nose bumps the boundary and recoils sparking.

**Arc Lash — `arcLash`**
The Voltaic swinging a whip of pure lightning overhead, its arc frozen as a bright calligraphic stroke across the dark; everything banked in their body flowing out through it. Spend the storm.

### Commons

**Spark Fin — `sparkFin`**
A small darting fish with a fin like a struck match, trailing a thread of sparks the Voltaic catches in an open palm. Small fast income.

**Voltage Spike — `voltageSpike`**
One clean colossal bolt descending through the water column like a divine exclamation mark, illuminating the sea floor for a mile. Simple, huge.

**Capacitor — `capacitor`**
A translucent organ like a glass heart in the Voltaic's chest visibly filling with churning yellow light, gauge-lines of bioluminescence climbing their ribs.

**Chain Nip — `chainNip`**
The Voltaic caught mid-lunge past a large armored fish — two crescent-shaped bite marks glow white-hot on the fish's flank, and a single jagged arc of yellow lightning bridges the two wounds like a spark gap completing a circuit. One attacker, one target, one frozen moment; motion-streak and bubbles trailing the Voltaic.
*(Alt, reads great at card size: extreme close-up of a barnacled shell with two glowing crescent bite-marks, a bright arc of current jumping between them like a closed circuit; volt-yellow on near-black. Negative prompt: shark, two creatures, explosion, fireworks.)*

**Insulate — `insulate`**
The Voltaic wrapping into a coat of thick rubbery blubber-armor; an incoming bolt slides around its surface in rivulets and grounds out harmlessly behind them.

**Live Wire — `liveWire`**
A frayed living tendril spitting fat unpredictable sparks, held casually in the Voltaic's hand like a weapon barely on a leash; brighter, meaner arcs when the charge behind it is deep.

**Current Surge — `currentSurge`**
A pulse of current racing through a school of fish, lighting each one from within in sequence like bulbs on a wire — knowledge and power arriving at once.

**Ground Out — `groundOut`**
The Voltaic slamming both palms to the seafloor, their whole banked storm discharging downward — sand fusing to branching glass, a bubble-wall of force rising around them as shield.

### Uncommons

**Thunderbite — `thunderbite`**
Jaws closing with a thunderclap you can see — a shockwave ring and lightning between every tooth; the bite banks as much as it breaks.

**Fork Lightning — `forkLightning`**
One bolt splitting into five crooked fingers, each finding its own fish in the dark; the Voltaic conducting the split with spread hands like an orchestra of ruin.

**Overclock — `overclock`**
The Voltaic's chest-light beating triple-time, arcs desynchronizing off their skin, eyes wide with dangerous clarity; clock-like rings of current spinning too fast around their wrists.

**Storm Shell — `stormShell`**
A single giant spiked nautilus shell centered against dark storm-teal water, small jagged bolts of yellow lightning striking inward from all directions and grounding into its spikes; the shell's spiral glows volt-yellow from within like a charging coil, brightest at the center of the coil. No people, no creatures, radial composition, near-black background.
*(Alt with the character: the Voltaic braced behind the shell held like a tower shield, arcs striking the spikes and being drawn inward along the glowing spiral. Negative prompt: storm clouds, sky, rain, knight, suit of armor, snail.)*

**Amplify — `amplify`**
The Voltaic between two coral conductor-pillars, their banked light splitting, mirroring, and doubling — two of every arc, twice the glow, the water itself humming.

**Eel Coil — `eelCoil`**
An eel coiled into a perfect ring spinning slowly around the Voltaic's raised arm — a living dynamo, one steady spark shed with every rotation.

**Tesla Scales — `teslaScales`**
Close-up of the Voltaic's flank: every scale risen on end, each pair a spark-gap firing in ripples; the surrounding water full of tiny stunned prey. Every scale a storm cloud.

**Static Burst — `staticBurst`**
An omnidirectional nova of static erupting from the Voltaic's body, illuminating a full circle of surprised enemies at once; afterimage rings expanding.

**Battery — `battery`**
Rows of bio-electric cells along the Voltaic's forearms glowing at full — the last one clicking to bright with an almost audible chime, surplus arcing off their knuckles as bonus vigor.

**Voltmeter Slash — `voltmeterSlash`**
A blade-swing whose light-trail is a literal voltage waveform — jagged graph-line of current hanging in the water where the cut passed, brighter with every stored volt.

### Rares

**Gigavolt — `gigavolt`**
The Voltaic's whole storm spent in one place: a column of lightning thick as a lighthouse connecting seafloor to surface, the silhouette of one enemy at its heart, night turned to noon. Name your thunder.

**Storm of the Century — `stormOfCentury`**
An underwater hurricane of lightning — dozens of simultaneous bolts in a rotating wall, every creature in the circle lit, bent, and cowed; the Voltaic at the still eye, arms wide.

**Dynamo — `dynamo`**
A great slow turbine of bone, shell, and living current turning behind the Voltaic like a mill wheel, shedding fat steady sparks into their open hand each revolution. Industry of the deep.

**Lightning Rod — `lightningRod`**
The Voltaic planting a barbed trident into the seabed as their own discharge detonates — and the rod already drinking the aftermath back up its haft, returning the storm to its keeper.

**Supercell — `supercell`**
A rotating storm cell parked above the battlefield like an underwater thundercloud, discharging automatically on everything below at each turn of its spiral; the Voltaic reading a book beneath it. Keep the storm. Let it keep you.

**Defibrillate — `defibrillate`**
Twin paddles of pure light pressed to the Voltaic's own chest, the banked storm flooding inward instead of out — heart re-lit like a lantern, arcs of vitality snapping down every limb.

---

## Neutral cards (4:3)

**Flotsam Blade — `flotsamBlade`**
A sword lashed together from shipwreck debris — snapped cutlass blade, oar-handle grip, rope binding — held by an unseen diver's hand. Humble, functional, storied.

**Driftwood Shield — `driftwoodShield`**
A cracked plank shield, ship's-hull curve still in it, barnacles for bosses and a faded painted eye; a bite-mark taken clean out of one edge.

**Message in a Bottle — `messageInABottle`**
A barnacled glass bottle glowing faintly from the letter curled inside, wax seal of a drowned kingdom; it lights the reaching fingertips about to close on it. Someone, somewhere, is still writing.

**Pearl Dive — `pearlDive`**
A freediver silhouetted against surface-light, arm buried to the shoulder in a giant oyster, pearl-glow leaking between their fingers; a hint of the oyster beginning to close. Payday with risk in it.

**Sea Salt — `seaSalt`**
A handful of coarse salt crystals dissolving in a slow spiral, and where the brine touches, black curse-threads unravel from a diver's arm like burnt string. Clean and bright.

**Panic Thrash — `panicThrash`**
A hooked fish thrashing in a storm of its own bubbles, all instinct and no aim — wild power, poor form; even the predator looks briefly impressed.

---

## Curses (4:3 — drab, desaturated, wrong)

**Barnacle — `barnacle`**
Barnacles colonizing the back of a diver's hand and climbing the wrist like slow armor no one asked for; the skin around them pale and waterlogged. It grows on you.

**Dread of the Deep — `dreadOfTheDeep`**
A tiny swimmer suspended over a blue-black void; below, so large it reads first as landscape, the suggestion of an eye opening. Nothing attacks. That's the horror.

**Waterlogged — `waterlogged`**
A once-fine spellbook swollen to twice its size with seawater, pages fused to pulp, dragging its carrier's satchel down at an exhausted angle. Heavy. Useless. Yours.

**Siren's Debt — `sirensDebt`**
A beautiful silhouette on a rock ledge holding an open ledger of kelp-paper, one elegant finger tapping an entry that glows softly magenta; bubbles rising from the signature. She sang. You listened.

---

## Enemies — portraits (1:1, creature centered on dark water)

### Act I — The Sunlit Shallows (turquoise light, god rays, reef color)

**Snapper Crab — `snapperCrab`**
A boulder-sized crab in chipped terracotta armor plating, one grotesquely oversized polished claw raised; reef sunlight banding its shell. Pugnacious, dumb, dangerous.

**Jelly Drifter — `jellyDrifter`**
A serene lavender-and-cyan jellyfish the size of an umbrella, bell glowing softly, tendrils hanging in elegant toxic curtains; beauty that stings.

**Barb Urchin — `barbUrchin`**
A black urchin big as a beach ball, spines needle-sharp and faintly violet at the tips, wedged smugly in a coral crack; several broken spine-tips glitter in the sand around it — souvenirs from the last fool who hit it.

**Sardine — `sardine`**
A single wide-eyed silver sardine, comically fierce, mid-dart with a tiny wake — but its schoolmates' silhouettes mass in the background. Alone: nothing. Together: arithmetic.

**Moray Lurker — `morayLurker`**
A thick green-bronze moray coiled in a reef hole, only head and cold eye in the light, jaw slightly open showing a second set of teeth waiting behind the first. Coiled patience.

**Tide Sprite — `tideSprite`**
A small elemental of living seawater in the shape of a leaping child, moonlight caught in its chest like a heart, edges constantly re-forming from foam; mischief and a rising tide behind its grin.

**Anglerfish (elite) — `anglerfish`**
A nightmare anglerfish half again a diver's size caught at the shadow-line where shallows drop off — hypnotic golden lure bobbing over a cavernous fanged underbite, tiny cruel eyes. The first real fear of the run.

**Riptide Elemental (elite) — `riptideElemental`**
A towering churn of water given intent — a wave that refuses to finish breaking, foam-fists and a hollow roaring mouth, dragging sand and wreckage up into itself; glows brighter as the tide rises.

**The Sunken King (boss) — `sunkenKing` (4:5)**
A drowned monarch's skeleton fused into a giant crab-armored body — coral-crusted crown sunk to the brow of a barnacled skull, sceptre in one human hand and one great claw, robes of rotten purple silk drifting. Throne of a capsized ship's prow behind him; the shallows' light dimming down to him. Regal, wrong, magnificent.

### Act II — The Twilight Trench (indigo dark, thin cold beams, magenta accents)

**Ghost Eel — `ghostEel`**
A pale translucent eel you can half see through — spine and dinner both faintly visible — phasing between visible and gone; cold white eyes. Elegant menace.

**Vampire Squid — `vampireSquid`**
A plum-black squid with a cape of webbed arms lined in red, eyes huge and lambent, drifting like an aristocrat; a faint red glow pulsing brighter as it feeds.

**Hatchetfish — `hatchetfish`**
A silver hatchetfish with a face like an axe-blade and permanently affronted eyes, catching a stray beam so it flashes like a mirror — signalling its twin to strike.

**Drifting Mine — `deepMine`**
An ancient horned naval mine, rust-scabbed and barnacled, drifting with terrible calm; one horn glows a soft warning red, and the number "3" is scratched into its face by some previous, luckier diver.

**Pressure Wraith — `pressureWraith`**
A humanoid absence in the water — a wraith of compressed dark with a diver's-helmet-shaped head, the sea visibly bending inward around its grip. Where it points, things crack.

**Kelp Horror — `kelpHorror`**
A forest of kelp that is also one creature — dozens of frond-arms with too many joints, a suggestion of eyes deep in the canopy, one arm already coiled around a snapped harpoon. The forest is hungry.

**Kraken Cultist (elite) — `krakenCultist`**
A robed humanoid figure whose hood collapses into tentacles instead of a face, holding a votive lantern of green abyss-light; sucker-scarred hands raised mid-summons, small tentacles already breaching the seafloor around the hem of its robe.

**Tentacle — `tentacleSpawn`**
A single summoned tentacle punched up through the seabed like a question mark of muscle, suckers flexing, tip curling toward the viewer. Part of something worse.

**Abyssal Warden (elite) — `abyssalWarden`**
A hulking armored sentinel in diving-suit-meets-gothic-plate, visor a slit of cyan light, tower shield of riveted hull-iron studded with spikes; kelp banners hang from its pauldrons. It does not chase. It waits.

**The Kraken (boss) — `krakenHead` (4:5)**
The classic terror done painterly: a kraken's head and mantle rising out of frame, one eye like a dinner-plate moon regarding the viewer with unhurried appetite, beak just parting; ink smoking off its skin into the indigo dark. Two arms frame the composition from below.

**Kraken Arm — `krakenArm`**
One arm of the boss in close-up — thick as a mast, banded in bruise-purple, suckers each with their own faint ring of light, coiling around a snapped ship's wheel.

### Act III — The Hadal Deep (near-black, magenta and ghost-cyan bioluminescence only)

**Void Angler — `voidAngler`**
An anglerfish grown wrong at depth — lure burning violet-white like a dying star, body mostly invisible except where its own light betrays the teeth. The light is the trap; the dark is the fish.

**Bone Shoal — `boneShoal`**
A school of fish skeletons swimming in perfect formation, held together by pale ghost-light in the joints; where the school turns, it briefly forms one great skeletal fish. Death didn't stop the schooling instinct.

**Hadal Horror — `hadalHorror`**
A deep-trench leviathan-larva — pale, eyeless, growing visibly wrong, muscle mass lopsided as if it's being inflated by the pressure itself; each frame of it feels larger than the last. A race you can lose by waiting.

**Abyss Idol — `abyssIdol`**
A stone idol on the trench floor — a single vast carved eye, weeping slow threads of black that curl upward against physics; small dead fish orbit it like moths. It does not move. It doesn't need to.

**Trench Stalker — `trenchStalker`**
A hadal shark the color of scar tissue, circling just past the edge of visibility — one pass of its flank catching ghost-light, jaws relaxed, eyes rolled white. The pause before the ambush.

**Trench Colossus (elite) — `trenchColossus`**
A walking cliff — a colossus of black basalt and pressure-fused wreckage in vaguely humanoid form, whale bones for ribs, an anchor dragged as a club; each footfall raises a slow silt mushroom-cloud.

**Herald of the Deep (elite) — `heraldOfDeep`**
A gaunt priest-thing of brain-coral and tentacle, crowned in dead sailors' lanterns, arms spread in benediction over a congregation of bone shoals; magenta light leaks from its seams. The warm-up act for a god.

**The Drowned God (boss) — `drownedGod` (4:5)**
A god-scale sea-dragon asleep at the bottom of everything, coiled around the roots of the trench itself — scales like drowned cathedrals, moss of centuries, one eye JUST beginning to open with tide-glow leaking out. Above it, the entire ocean bends toward that eye. Do it in two variants if possible: eye closed (Dreaming) and eye open with risen crest (IT WAKES).

*(`boneShoalMinion` reuses `boneShoal` art.)*

---

## Bonus — character portraits (4:5)

**The Tidecaller — `tidecaller`**
Full portrait: a tall priestess of the drowned moon in barnacle-crusted deep-blue robes, silver tide-tattoos up both arms, kelp-drift hair, holding a coral-tined trident like a shepherd's crook; behind her the tide stands impossibly at High, moon centered in it. Serene, weathered, faintly amused.

**The Voltaic — `voltaic`**
Full portrait: a lean eel-blooded duelist mid-stance, black skin traced in live yellow current-lines, dorsal ridge from crown to spine, one hand open with a coil of banked lightning orbiting the fingers; storm-dark water behind, every fish keeping its distance. Cocky, bright-eyed, humming with held charge.

---

### Batch-generation tips

- Generate one **style anchor** per section first (e.g., Tide Strike, Jolt Strike, Sunken King). If your generator supports image/style reference (Midjourney `--sref`, Flux redux, SDXL IP-Adapter), feed the anchor to the rest of that section.
- Keep the recurring characters consistent by reusing their exact description sentence verbatim in every prompt that features them.
- Cards read at ~120px in-game: favor **one bold focal subject + strong silhouette** over busy scenes; check thumbnails before batch-committing.
- Bosses and character portraits deserve 2× resolution and a few rerolls — they're on screen the longest.
