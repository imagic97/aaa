<script setup lang="ts">
import { type Component, ref, markRaw, onMounted, watch } from 'vue'

import compile from './compile'

const props = withDefaults(defineProps<{
  code: string
  bind?: { [key: string]: any } | null
  on?: { [key: string]: any } | null
}>(), {
  bind: null,
  on: null
})

const component = ref<Component | null>(null)
const stylesheet = ref<string | null>(null)
const error = ref<Error | null>(null)

const _init = () => {
  try {
    const { component: c, stylesheet: s } = compile(props.code)
    component.value = markRaw(c)
    stylesheet.value = s
    error.value = null
  } catch (e: any) {
    component.value = null
    stylesheet.value = null
    error.value = e instanceof Error
      ? e
      : typeof e === 'string'
        ? new Error(e)
        : new Error('unknow error')
  }
}

watch(() => props.code, () => {
  _init()
})

onMounted(() => {
  _init()
})
</script>

<template>
  <template v-if="error !== null">
    <div class="PtSfc__error">
      <div class="PtSfc__error-hd">compile code error</div>
      <div class="PtSfc__error-bd">{{ error.message }}</div>
    </div>
  </template>

  <template v-else>
    <template v-if="stylesheet !== null">
      <component is="style" type="text/css" v-html="stylesheet" />
    </template>

    <template v-if="component !== null">
      <component :is="component" v-bind="props.bind" v-on="props.on" />
    </template>
  </template>
</template>

<style lang="scss">
.PtSfc {
  &__error {
    padding: 10px;
    border: 1px solid #ce8f78;
    background-color: #d8d8d8;
    border-radius: 10px;
  }

  &__error-hd {
    font-weight: bold;
    margin-bottom: 10px;
  }

  &__error-bd {
    font-family: monospace;
    white-space: pre-wrap;
  }
}
</style>
