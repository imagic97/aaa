import { type Component } from 'vue'
import { type RouteLocationMatched, type RouteLocationRaw } from 'vue-router'

export enum PtLifecycleHooks {
  // BEFORE_CREATE = 'bc',
  // CREATED = 'c',
  // BEFORE_MOUNT = 'bm',
  // MOUNTED = 'm',
  // BEFORE_UPDATE = 'bu',
  // UPDATED = 'u',
  // BEFORE_UNMOUNT = 'bum',
  // UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  // RENDER_TRIGGERED = 'rtg',
  // RENDER_TRACKED = 'rtc',
  // ERROR_CAPTURED = 'ec',
  // SERVER_PREFETCH = 'sp',
}

export type RouterType = {
  getCurrentViewKey: () => string | null
  closeByIndex: (index: number) => void
  closeOthersByIndex: (index: number) => void
  closePrevOthersByIndex: (index: number) => void
  closeNextOthersByIndex: (index: number) => void
  closeAll: () => void
  getSize: () => number
}

export type RouterGuard = (to: RouteLocationMatched, next: (location?: RouteLocationRaw) => void) => boolean

class PtRouter {
  private static routerItem: RouterType | null = null

  private static hooks: Array<{ viewKey: string, type: PtLifecycleHooks, hook: Function }> = []

  private static routerGuards: Array<RouterGuard> = []

  static register (router: RouterType) {
    this.routerItem = router
  }

  static unregister () {
    this.routerItem = null
    this.hooks = []
  }

  static get instance () {
    return this.routerItem
  }

  static get beforeEachGuard () {
    return this.routerGuards
  }

  static beforeEach (guard: RouterGuard) {
    this.routerGuards.push(guard)
  }

  static deleteBeforeEach (guard: RouterGuard) {
    this.routerGuards = this.routerGuards.filter(el => el !== guard)
  }

  static registerHook (hook: Function, type: PtLifecycleHooks) {
    if (this.instance === null) return
    const viewKey = this.instance.getCurrentViewKey()
    if (viewKey === null) return
    this.hooks.push({ viewKey: viewKey, type: type, hook: hook })
  }

  static unregisterHook (targetViewKey: string | null) {
    if (this.instance === null) return
    if (targetViewKey === null) return

    this.hooks = this.hooks.filter(el => el.viewKey !== targetViewKey)
  }

  static triggerHook (targetViewKey: string | null, type: PtLifecycleHooks) {
    if (this.instance === null) return
    if (targetViewKey === null) return

    this.hooks.forEach((el) => {
      if (el.viewKey === targetViewKey && el.type === type) {
        try {
          el.hook.call(null, [])
        } catch (error) {
          window.console.error(error)
        }
      }
    })
  }

  static onActivated (hook: Function) {
    this.registerHook(hook, PtLifecycleHooks.ACTIVATED)
  }

  static onDeactivated (hook: Function) {
    this.registerHook(hook, PtLifecycleHooks.DEACTIVATED)
  }
}

export default PtRouter

