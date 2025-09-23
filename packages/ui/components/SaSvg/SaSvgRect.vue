<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  width: number
  height: number
  backgroundColor?: string
  borderRadius?: [number, number, number, number]
  borderWidth?: number
  borderColor?: string
}>()

const border = computed(() => {
  const ret = {
    width: 0,
    color: '',
    rTL: 0,
    rTR: 0,
    rBL: 0,
    rBR: 0
  }
  if (props.borderRadius) {
    ret.rTL = props.borderRadius[0]
    ret.rTR = props.borderRadius[1]
    ret.rBR = props.borderRadius[2]
    ret.rBL = props.borderRadius[3]
  }

  if (props.borderWidth) {
    ret.width = props.borderWidth
  }

  if (props.borderColor) {
    ret.color = props.borderColor
  }
  return ret
})

const path = computed(() => {
  return `M${border.value.rTL} 0
H${props.width - border.value.rTR}
A${border.value.rTR},${border.value.rTR} 0 0,1 ${props.width} ${border.value.rTR} 
V${props.height - border.value.rBR}
A${border.value.rBR},${border.value.rBR} 0 0,1 ${props.width - border.value.rBR} ${props.height} 
H${border.value.rBL}
A${border.value.rBL},${border.value.rBL} 0 0,1 0 ${props.height - border.value.rBL} 
V${border.value.rTL}
A${border.value.rTL},${border.value.rTL} 0 0,1 ${border.value.rTL} 0z`
})
</script>

<template>
  <path :d="path" fill-rule="evenodd" :fill="backgroundColor" :stroke="border.color" :stroke-width="border.width" />
</template>
