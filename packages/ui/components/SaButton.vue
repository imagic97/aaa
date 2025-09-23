<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: '' | 'rounded' | 'circle'
    color?: '' | 'primary' | 'danger'
    disabled?: boolean
    loading?: Promise<unknown> | unknown
    label?: string
  }>(),
  {
    type: '',
    color: ''
  },
)

const emit = defineEmits<{
  click: [MouseEvent]
}>()

const _loading = ref(false)

watch(() => props.loading, () => {
  if (props.loading === undefined) return

  if (typeof props.loading === 'boolean') {
    _loading.value = props.loading
    return
  }

  if (props.loading instanceof Promise) {
    _loading.value = true
    return props.loading
      .finally(() => {
        _loading.value = false
      })
  }

  _loading.value = false
}, { immediate: true })

const onClick = (event: MouseEvent) => {
  if (props.disabled) return
  if (_loading.value) return

  emit('click', event)
}
</script>

<template>
  <button
    class="sa-button"
    :class="{
      'is-disabled': props.disabled,
      'is-loading': props.loading !== undefined && _loading,
    }"
    v-bind="{
      [`${props.type}`]: '',
      [`${props.color}`]: '',
      'aria-label': props.label,
    }"
    draggable="false"
    @click="onClick">

    <template v-if="props.loading !== undefined">
        <i class="sa-button-loading"></i>
        <i class="sa-button-loading"></i>
        <i class="sa-button-loading"></i>
        <i class="sa-button-loading"></i>
        <i class="sa-button-loading"></i>
        <i class="sa-button-loading"></i>
    </template>

    <template v-if="!(props.type === 'circle' && _loading)">
      <slot />
    </template>
  </button>
</template>
