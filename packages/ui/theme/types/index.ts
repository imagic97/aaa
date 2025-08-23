
export type UiTheme = {
  THEME_KEY: string
  install: () => Promise<void>
}

export enum UiThemeColor {
  DARK = 'dark',
  LIGHT = 'light',
}