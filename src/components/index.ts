import { type App, defineAsyncComponent } from 'vue'

const Sfc = defineAsyncComponent(() => import('./sfc/index.vue'))

export default class {
  static install (app: App): void {
    app.component('Sfc', Sfc)
  }
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    Sfc: typeof Sfc
  }
}