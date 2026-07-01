import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '../state/store';
import { KEYWORDS } from '../content/keywords';
import { Modal } from './components/Bits';
import { GameIcon, STATUS_META } from './icons';

/** true when motion should be minimized (setting or OS preference) */
export function useReducedMotion(): boolean {
  const pref = useGame((s) => s.settings.reducedMotion);
  const [os, setOs] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setOs(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return os;
}

/** Full keyword glossary overlay (overlay === 'glossary'). */
export function StatusChipsGlossary() {
  const overlay = useGame((s) => s.overlay);
  const setOverlay = useGame((s) => s.setOverlay);
  return (
    <AnimatePresence>
      {overlay === 'glossary' && (
        <Modal title="Glossary" onClose={() => setOverlay('none')} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {Object.values(KEYWORDS).map((k) => (
              <div key={k.id} className="flex items-start gap-2 text-sm">
                {STATUS_META[k.id] ? (
                  <span className="mt-0.5 shrink-0" style={{ color: STATUS_META[k.id].color }}>
                    <GameIcon id={STATUS_META[k.id].icon} size={15} />
                  </span>
                ) : (
                  <span className="w-[15px] shrink-0" />
                )}
                <p className="text-(--color-mist) leading-snug">
                  <span className="font-bold text-(--color-foam)">{k.name}.</span> {k.text}
                </p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
