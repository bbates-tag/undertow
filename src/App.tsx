import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGame } from './state/store';
import { useReducedMotion, StatusChipsGlossary } from './ui/hooks';
import { ensureAudio } from './audio/zzfx';
import { music } from './audio/music';
import { MenuScreen } from './ui/screens/MenuScreen';
import { NewRunScreen } from './ui/screens/NewRunScreen';
import { MapScreen } from './ui/screens/MapScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { RewardScreen } from './ui/screens/RewardScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { RestScreen } from './ui/screens/RestScreen';
import { EventScreen } from './ui/screens/EventScreen';
import { GameOverScreen, VictoryScreen } from './ui/screens/RunEndScreens';
import { AchievementsScreen, CreditsScreen, HowToPlayScreen, SettingsScreen, StatsScreen } from './ui/screens/MetaScreens';
import { DeckOverlay } from './ui/components/DeckOverlay';
import { Toasts } from './ui/components/Bits';
import { DebugPanel } from './ui/DebugPanel';

const SCREENS = {
  menu: MenuScreen,
  newRun: NewRunScreen,
  map: MapScreen,
  battle: BattleScreen,
  reward: RewardScreen,
  shop: ShopScreen,
  rest: RestScreen,
  event: EventScreen,
  gameover: GameOverScreen,
  victory: VictoryScreen,
  stats: StatsScreen,
  achievements: AchievementsScreen,
  credits: CreditsScreen,
  settings: SettingsScreen,
  howToPlay: HowToPlayScreen,
} as const;

export default function App() {
  const screen = useGame((s) => s.screen);
  const overlay = useGame((s) => s.overlay);
  const settings = useGame((s) => s.settings);
  const reduced = useReducedMotion();

  // audio unlock on first gesture (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      try {
        ensureAudio();
        if (useGame.getState().settings.music) music.start();
      } catch {
        // no audio available
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const ScreenComponent = SCREENS[screen] ?? MenuScreen;
  const motionClass = settings.reducedMotion === 'on' ? 'reduce-motion' : settings.reducedMotion === 'auto' ? 'motion-auto' : '';

  return (
    <div className={motionClass} data-reduced={reduced}>
      <ScreenComponent />
      <AnimatePresence>{overlay !== 'none' && overlay !== 'glossary' && <DeckOverlay key="deck-overlay" />}</AnimatePresence>
      {screen !== 'battle' && <StatusChipsGlossary />}
      <Toasts />
      <DebugPanel />
    </div>
  );
}
