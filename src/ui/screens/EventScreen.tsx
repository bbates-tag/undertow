// "?" node events: a vignette, 2–3 choices with visible consequences, a log.

import { ChevronRight } from 'lucide-react';
import { useGame } from '../../state/store';
import { EVENTS } from '../../content/events';
import { GameIcon } from '../icons';
import { GoldChip, HpChip, Bubbles } from '../components/Bits';

export function EventScreen() {
  const run = useGame((s) => s.run);
  const eventLog = useGame((s) => s.eventLog);
  const pendingPick = useGame((s) => s.pendingPick);
  const eventChoose = useGame((s) => s.eventChoose);
  const leaveNode = useGame((s) => s.leaveNode);
  if (!run?.eventId) return null;
  const ev = EVENTS[run.eventId];
  const resolved = eventLog.length > 0;

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center p-4 gap-4 relative overflow-hidden" data-act={run.act}>
      <Bubbles count={10} />
      <div className="panel p-5 w-[min(94vw,480px)] relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-xl border flex items-center justify-center shrink-0"
            style={{ borderColor: 'rgba(180,143,255,0.45)', color: 'var(--color-power)', background: 'rgba(8,17,32,0.8)' }}
          >
            <GameIcon id={ev.icon} size={32} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">{ev.name}</h1>
            <div className="flex gap-2 mt-1">
              <HpChip hp={run.hp} maxHp={run.maxHp} />
              <GoldChip gold={run.gold} />
            </div>
          </div>
        </div>
        <p className="text-sm text-(--color-mist) leading-relaxed mb-4 italic">{ev.text}</p>

        {!resolved ? (
          <div className="flex flex-col gap-2">
            {ev.choices.map((c) => (
              <button key={c.id} className="btn !justify-start text-left !py-2.5" onClick={() => eventChoose(c.id)}>
                <span>
                  <span className="font-bold block text-sm">{c.label}</span>
                  <span className="text-[11px] text-(--color-mist) font-normal block">{c.detail}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {eventLog.map((line, i) => (
              <p key={i} className="text-sm text-(--color-glow)">
                ◆ {line}
              </p>
            ))}
            {!pendingPick && (
              <button className="btn btn-primary mt-2 self-center" onClick={leaveNode} autoFocus>
                Swim on <ChevronRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
