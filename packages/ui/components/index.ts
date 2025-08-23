
import { createVNode, defineAsyncComponent } from 'vue'

export { default as SaLink } from './SaLink.vue'
export { default as SaInput } from './SaInput.vue'
export { default as SaButton } from './SaButton.vue'
export { default as SaLoader } from './SaLoader.vue'
export { default as SaRouterView } from './SaRouter/SaRouterView.vue'

const asyncComponentOption = {
  delay: 200,
  loadingComponent: createVNode('div', { class: 'sa-component-loading' }),
  errorComponent: createVNode('div', { class: 'sa-component-loaded-error' }),
}

const SaSfc = defineAsyncComponent({
  loader: () => import('./SaSfc/index.vue'),
  ...asyncComponentOption,
})

export { SaSfc }