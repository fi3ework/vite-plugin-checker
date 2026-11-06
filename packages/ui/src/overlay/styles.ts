export const styles = /* css */ `
:host {
  --_bg: var(--mb-bg, #0d1117);
  --_fg: var(--mb-fg, #e6edf3);
  --_accent: var(--mb-accent, #7aa2ff);
  --_font: var(
    --mb-font-sans,
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  );
  --_radius: var(--mb-radius, 8px);
  --_error: #ff7b72;
  --_warning: #e3b341;
  --_line: color-mix(in srgb, var(--_fg) 16%, var(--_bg));
  --_muted: color-mix(in srgb, var(--_fg) 62%, var(--_bg));
  --_inset: 12px;
  --_offset: calc(var(--_stack, 0) * 44px);

  all: initial;
  color-scheme: dark;
}

@media (prefers-color-scheme: light) {
  :host {
    --_bg: var(--mb-bg, #ffffff);
    --_fg: var(--mb-fg, #1f2328);
    --_accent: var(--mb-accent, #3a5ccc);
    --_error: #cf222e;
    --_warning: #9a6700;
    color-scheme: light;
  }
}

[hidden] {
  display: none !important;
}

.badge {
  position: fixed;
  z-index: 99990;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--_line);
  border-radius: 999px;
  background: var(--_bg);
  color: var(--_fg);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  font: 600 13px/1 var(--_font);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.badge:hover {
  border-color: color-mix(in srgb, var(--_fg) 32%, var(--_bg));
}
.badge:focus-visible,
.bar button:focus-visible,
.bar a:focus-visible,
.handle:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}
.pos-tl { top: calc(var(--_inset) + var(--_offset)); left: var(--_inset); }
.pos-tr { top: calc(var(--_inset) + var(--_offset)); right: var(--_inset); }
.pos-bl { bottom: calc(var(--_inset) + var(--_offset)); left: var(--_inset); }
.pos-br { bottom: calc(var(--_inset) + var(--_offset)); right: var(--_inset); }

.count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.count::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.error { color: var(--_error); }
.warning { color: var(--_warning); }
.failed { color: var(--_error); }

.spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--_muted);
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawer {
  box-sizing: border-box;
  position: fixed;
  z-index: 99990;
  left: var(--_inset);
  right: var(--_inset);
  display: flex;
  flex-direction: column;
  height: var(--_height, 45vh);
  min-height: 160px;
  max-height: calc(100vh - 2 * var(--_inset));
  overflow: hidden;
  border: 1px solid var(--_line);
  border-radius: var(--_radius);
  background: var(--_bg);
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.3);
  font: 13px/1.4 var(--_font);
  color: var(--_fg);
}
.drawer.side-b { bottom: calc(var(--_inset) + var(--_offset)); }
.drawer.side-t { top: calc(var(--_inset) + var(--_offset)); flex-direction: column-reverse; }

.bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  height: 28px;
  padding: 0 4px;
  border-bottom: 1px solid var(--_line);
}
.side-t .bar {
  border-top: 1px solid var(--_line);
  border-bottom: 0;
}
.handle {
  position: absolute;
  inset: 0 64px;
  cursor: ns-resize;
  touch-action: none;
}
.handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 4px;
  margin: -2px 0 0 -18px;
  border-radius: 2px;
  background: var(--_line);
}
.bar button,
.bar a {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--_muted);
  cursor: pointer;
}
.bar button:hover,
.bar a:hover {
  color: var(--_fg);
  background: color-mix(in srgb, var(--_fg) 8%, var(--_bg));
}
svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
iframe {
  flex: 1;
  width: 100%;
  border: 0;
  background: var(--_bg);
}
.dragging iframe {
  pointer-events: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-right-color: var(--_muted);
  }
}
`
