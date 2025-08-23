export * from './types/index'

export { default as ThemeNoraml } from './normal/index'

import { UiThemeColor, type UiTheme } from './types/index'

let currentThemeKey = ''
let currentThemeColor: UiThemeColor = UiThemeColor.LIGHT
const registedTheme = new Map<string, UiTheme>()

const registerListener = () => {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  function handleColorSchemeChange(e: MediaQueryList | MediaQueryListEvent) {
    if (e.matches) {
      currentThemeColor = UiThemeColor.DARK
      document.documentElement.classList.add(UiThemeColor.DARK)
    } else {
      currentThemeColor = UiThemeColor.LIGHT
      document.documentElement.classList.remove(UiThemeColor.DARK)
    }
  }

  handleColorSchemeChange(darkModeMediaQuery)

  darkModeMediaQuery.addEventListener('change', handleColorSchemeChange)
}

const register = async (theme: UiTheme, isDefault?: boolean) => {
  registedTheme.set(theme.THEME_KEY, theme)
  if (isDefault) {
    await useTheme({ themeKey: theme.THEME_KEY })
  }
}

const useTheme = async (options?: {
  themeKey?: string
  color?: UiThemeColor
}) => {
  const themeKey = options?.themeKey ?? currentThemeKey
  const themeColor = options?.color ?? currentThemeColor
  const targetTheme = registedTheme.get(themeKey)
  if (!targetTheme) {
    throw new Error('未知 css 主题')
  }

  currentThemeKey = themeKey
  document.documentElement.classList.forEach((el) => {
    if (el.startsWith('theme-')) {
      document.documentElement.classList.remove(el)
    }
  })
  document.documentElement.classList.add(`theme-${themeKey}`)
  await targetTheme.install()

  switch (themeColor) {
    case UiThemeColor.DARK:
      document.documentElement.classList.add(UiThemeColor.DARK)
      break
    case UiThemeColor.LIGHT:
      document.documentElement.classList.remove(UiThemeColor.DARK)
      break
  }
}

registerListener()

export { register, useTheme }
