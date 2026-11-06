export interface OverlayOptions {
  /** URL of the diagnostics page, resolved against the overlay entry module */
  uiUrl: string
  badge: boolean | 'auto'
  position: 'tl' | 'tr' | 'bl' | 'br'
  initialIsOpen: boolean | 'error'
}
