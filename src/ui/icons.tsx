// Icon registry — every icon the content layer references by string key.
// All card/relic/enemy art comes from game-icons.net (CC-BY 3.0, see Credits)
// via react-icons, rendered inline so it inherits currentColor and animates.

import type { ComponentType } from 'react';
import {
  GiAcid, GiAcidBlob, GiAlgae, GiAmmonite, GiAnchor, GiAnglerFish, GiAnvil, GiArmorVest,
  GiArmouredShell, GiBarbedSpear, GiBatteries, GiBatteryPack, GiBatteryPlus, GiBeastEye,
  GiBeetleShell, GiBellShield, GiBestialFangs, GiBigWave, GiBoltShield, GiBoneKnife,
  GiBrainTentacle, GiBrandyBottle, GiBubbles, GiBurstBlob, GiCandlebright, GiCarnivoreMouth,
  GiCauldron, GiCaveEntrance, GiCeilingBarnacle, GiChainLightning, GiChaliceDrops, GiChart,
  GiChemicalDrop, GiCirclingFish, GiCircleSparks, GiClockwork, GiCoins, GiCoinsPile, GiCompass,
  GiCoral, GiCrab, GiCrackedShield, GiCrossedSwords, GiCrown, GiCrownedSkull, GiCrystalShine,
  GiCurledTentacle, GiCycle, GiDaemonSkull, GiDivingHelmet, GiDolmen, GiDorsalScales,
  GiDoubleFish, GiDreadSkull, GiDroplets, GiDrowning, GiDustCloud, GiEclipse, GiEclipseFlare,
  GiEel, GiElectric, GiElectricWhip, GiElectricalSocket, GiEnergyTank, GiEyeShield, GiFangs,
  GiFangsCircle, GiFeather, GiFirstAidKit, GiFishCorpse, GiFishEscape, GiFishMonster, GiFishScales,
  GiFishbone, GiFishingHook, GiFishingLure, GiFishingPole, GiFist, GiFlatfish, GiFlintSpark,
  GiFloatingCrystal, GiFloatingGhost, GiFocusedLightning, GiGears, GiGhost, GiGiantSquid,
  GiHarp, GiHarpoonTrident, GiHeartPlus, GiHook, GiInkSwirl, GiJellyfish, GiLantern,
  GiLayeredArmor, GiLightningArc, GiLightningBranches, GiLightningDissipation,
  GiLightningHelix, GiLightningSlashes, GiLightningStorm, GiLightningTree, GiLightningTrio,
  GiLockedChest, GiMineExplosion, GiMineralHeart, GiMirrorMirror, GiMoon, GiMoonOrbit,
  GiMusicalNotes, GiOpenTreasureChest, GiOyster, GiPearlNecklace, GiPiranha, GiPoison,
  GiPoisonBottle, GiPoisonCloud, GiPowerLightning, GiScrollQuill, GiSeaDragon, GiSeaSerpent,
  GiSextant, GiSharkBite, GiSharkFin, GiSharkJaws, GiShieldReflect, GiShipBow, GiShipWheel,
  GiShipWreck, GiShrimp, GiSnakeBite, GiSolarTime, GiSparkles, GiSpellBook, GiSpermWhale,
  GiSpikedArmor, GiSpikedShell, GiSpikes, GiSpineArrow, GiSpiralShell, GiStoneTablet,
  GiSuckeredTentacle, GiSunkenEye, GiSwamp, GiSwordBreak, GiTentacleHeart, GiTentaclesSkull,
  GiTentacurl, GiThornyVine, GiThunderStruck, GiThunderball, GiTreasureMap, GiTrident,
  GiUnlitBomb, GiVikingHelmet, GiVortex, GiWaterSplash, GiWaveCrest, GiWaveStrike, GiWaveSurfer,
  GiWaves, GiWhirlpoolShuriken, GiWhirlwind, GiCampfire, GiOctopus,
  // The Drowned
  GiSkeletalHand, GiRibcage, GiOpenWound, GiBleedingWound, GiFalling, GiSaltShaker, GiWeight,
  GiInnerSelf, GiLungs, GiBoneGnawer, GiSeaStar, GiCandleSkull, GiOldLantern, GiGraveyard,
  GiCoffin, GiHeartOrgan, GiSpectre, GiKrakenTentacle, GiHeavyFall, GiSinkingShip, GiHighTide,
  GiBrokenHeart, GiChainedHeart, GiHeartDrop,
} from 'react-icons/gi';

const REGISTRY: Record<string, ComponentType<{ className?: string; size?: number | string }>> = {
  GiAcid, GiAcidBlob, GiAlgae, GiAmmonite, GiAnchor, GiAnglerFish, GiAnvil, GiArmorVest,
  GiArmouredShell, GiBarbedSpear, GiBatteries, GiBatteryPack, GiBatteryPlus, GiBeastEye,
  GiBeetleShell, GiBellShield, GiBestialFangs, GiBigWave, GiBoltShield, GiBoneKnife,
  GiBrainTentacle, GiBrandyBottle, GiBubbles, GiBurstBlob, GiCandlebright, GiCarnivoreMouth,
  GiCauldron, GiCaveEntrance, GiCeilingBarnacle, GiChainLightning, GiChaliceDrops, GiChart,
  GiChemicalDrop, GiCirclingFish, GiCircleSparks, GiClockwork, GiCoins, GiCoinsPile, GiCompass,
  GiCoral, GiCrab, GiCrackedShield, GiCrossedSwords, GiCrown, GiCrownedSkull, GiCrystalShine,
  GiCurledTentacle, GiCycle, GiDaemonSkull, GiDivingHelmet, GiDolmen, GiDorsalScales,
  GiDoubleFish, GiDreadSkull, GiDroplets, GiDrowning, GiDustCloud, GiEclipse, GiEclipseFlare,
  GiEel, GiElectric, GiElectricWhip, GiElectricalSocket, GiEnergyTank, GiEyeShield, GiFangs,
  GiFangsCircle, GiFeather, GiFirstAidKit, GiFishCorpse, GiFishEscape, GiFishMonster, GiFishScales,
  GiFishbone, GiFishingHook, GiFishingLure, GiFishingPole, GiFist, GiFlatfish, GiFlintSpark,
  GiFloatingCrystal, GiFloatingGhost, GiFocusedLightning, GiGears, GiGhost, GiGiantSquid,
  GiHarp, GiHarpoonTrident, GiHeartPlus, GiHook, GiInkSwirl, GiJellyfish, GiLantern,
  GiLayeredArmor, GiLightningArc, GiLightningBranches, GiLightningDissipation,
  GiLightningHelix, GiLightningSlashes, GiLightningStorm, GiLightningTree, GiLightningTrio,
  GiLockedChest, GiMineExplosion, GiMineralHeart, GiMirrorMirror, GiMoon, GiMoonOrbit,
  GiMusicalNotes, GiOpenTreasureChest, GiOyster, GiPearlNecklace, GiPiranha, GiPoison,
  GiPoisonBottle, GiPoisonCloud, GiPowerLightning, GiScrollQuill, GiSeaDragon, GiSeaSerpent,
  GiSextant, GiSharkBite, GiSharkFin, GiSharkJaws, GiShieldReflect, GiShipBow, GiShipWheel,
  GiShipWreck, GiShrimp, GiSnakeBite, GiSolarTime, GiSparkles, GiSpellBook, GiSpermWhale,
  GiSpikedArmor, GiSpikedShell, GiSpikes, GiSpineArrow, GiSpiralShell, GiStoneTablet,
  GiSuckeredTentacle, GiSunkenEye, GiSwamp, GiSwordBreak, GiTentacleHeart, GiTentaclesSkull,
  GiTentacurl, GiThornyVine, GiThunderStruck, GiThunderball, GiTreasureMap, GiTrident,
  GiUnlitBomb, GiVikingHelmet, GiVortex, GiWaterSplash, GiWaveCrest, GiWaveStrike, GiWaveSurfer,
  GiWaves, GiWhirlpoolShuriken, GiWhirlwind, GiCampfire, GiOctopus,
  GiSkeletalHand, GiRibcage, GiOpenWound, GiBleedingWound, GiFalling, GiSaltShaker, GiWeight,
  GiInnerSelf, GiLungs, GiBoneGnawer, GiSeaStar, GiCandleSkull, GiOldLantern, GiGraveyard,
  GiCoffin, GiHeartOrgan, GiSpectre, GiKrakenTentacle, GiHeavyFall, GiSinkingShip, GiHighTide,
  GiBrokenHeart, GiChainedHeart, GiHeartDrop,
};

export function GameIcon({ id, className, size }: { id: string; className?: string; size?: number | string }) {
  const Icon = REGISTRY[id] ?? GiBubbles;
  return <Icon className={className} size={size} />;
}

/** status-effect icon + color mapping */
export const STATUS_META: Record<string, { icon: string; color: string; name: string }> = {
  toxin: { icon: 'GiPoisonBottle', color: 'var(--color-toxin)', name: 'Toxin' },
  weakened: { icon: 'GiSwordBreak', color: 'var(--color-mist)', name: 'Weakened' },
  exposed: { icon: 'GiEyeShield', color: 'var(--color-danger)', name: 'Exposed' },
  brittle: { icon: 'GiCrackedShield', color: 'var(--color-mist)', name: 'Brittle' },
  might: { icon: 'GiFist', color: 'var(--color-danger)', name: 'Might' },
  finesse: { icon: 'GiWaveSurfer', color: 'var(--color-shield)', name: 'Finesse' },
  spines: { icon: 'GiSpikes', color: 'var(--color-bone)', name: 'Spines' },
  regen: { icon: 'GiHeartPlus', color: 'var(--color-toxin)', name: 'Regen' },
  anchor: { icon: 'GiAnchor', color: 'var(--color-shield)', name: 'Anchor' },
  charge: { icon: 'GiElectric', color: 'var(--color-volt)', name: 'Charge' },
  descent: { icon: 'GiDrowning', color: 'var(--color-drowned)', name: 'Descent' },
};
