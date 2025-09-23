import { createVNode, defineAsyncComponent } from 'vue'

export { default as SaLink } from './SaLink.vue'
export { default as SaInput } from './SaInput.vue'
export { default as SaButton } from './SaButton.vue'
export { default as SaLoader } from './SaLoader.vue'
export { default as SaRouterView } from './SaRouter/SaRouterView.vue'
export { default as SaSvg } from './SaSvg/index.vue'
export { SaSvgControl } from './SaSvg/SaSvgControl'
export { default as SaSvgSlot } from './SaSvg/SaSvgSlot.vue'
export { default as SASvgRect } from './SaSvg/SaSvgRect.vue'
export { default as SaSvgText } from './SaSvg/SaSvgText.vue'

const asyncComponentOption = {
  delay: 200,
  loadingComponent: createVNode('div', { class: 'sa-component-loading' }),
  errorComponent: createVNode('div', { class: 'sa-component-loaded-error' })
}

const SaSfc = defineAsyncComponent({
  loader: () => import('./SaSfc/index.vue'),
  ...asyncComponentOption
})

export { SaSfc }
