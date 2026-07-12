// Last line of defense: a render crash must never strand the player on a
// silent black screen (see the Descend Deeper soft-lock). The save is written
// debounced on every commit and is NOT touched here — reloading resumes it.

import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
  stack: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, stack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.setState({ stack: info.componentStack ?? '' });
    console.error('[undertow] render crash:', error, info.componentStack);
  }

  private copyDetails = () => {
    const { error, stack } = this.state;
    const text = `UNDERTOW crash report\n${String(error?.stack ?? error)}\n\nComponent stack:${stack}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-4 p-5 text-center">
        <h1
          className="font-display text-2xl font-bold tracking-[0.25em] pl-[0.25em]"
          style={{ color: 'var(--color-danger)', textShadow: '0 0 26px rgba(255,111,111,0.4)' }}
        >
          THE DEEP GLITCHED
        </h1>
        <p className="text-sm text-(--color-mist) max-w-[420px]">
          Something broke the surface — a rendering error, not the sea.{' '}
          <b className="text-(--color-foam)">Your save is untouched.</b> Reloading will pick your dive
          back up exactly where it was.
        </p>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button className="btn" onClick={this.copyDetails}>
            Copy error details
          </button>
        </div>
        <pre
          className="panel text-left text-[10px] leading-snug p-3 max-w-[min(92vw,560px)] max-h-[38vh] overflow-auto select-text"
          style={{ color: 'var(--color-mist)', whiteSpace: 'pre-wrap', userSelect: 'text' }}
        >
          {String(error?.stack ?? error)}
          {stack ? `\n\nComponent stack:${stack}` : ''}
        </pre>
        <p className="text-[11px] text-(--color-dim) max-w-[420px]">
          If this keeps happening, screenshot this screen or use “Copy error details” and send it to
          the developer.
        </p>
      </div>
    );
  }
}
