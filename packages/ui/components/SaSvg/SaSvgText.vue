<script lang="ts" setup>
import { computed } from 'vue'

import TextMakesure from './TextMeasure'

const props = withDefaults(
  defineProps<{
    canvasCtx: CanvasRenderingContext2D
    text: string
    width: number
    fontSize?: number
    textAlign?: 'center' | 'right' | 'left'
    maxLine?: number
    overflow?: string
    textEndGap?: number

    enableEdit?: boolean
  }>(),
  {
    fontSize: 12,
    maxLine: 1,
    overflow: '…',
    textEndGap: 0
  }
)

const renderText = computed(() => {
  return TextMakesure.getTextWidth({
    canvasCtx: props.canvasCtx,
    text: props.text,
    width: props.width,
    fontSize: props.fontSize,
    maxLine: props.maxLine,
    overflow: props.overflow,
    textEndGap: props.textEndGap,
    textAlign: props.textAlign
  })
})
</script>

<template>
  <slot v-bind="{ render: renderText }">
    <template v-for="(item, index) of renderText">
      <text :x="item.left" :y="1.4 * props.fontSize * index + 1.2 * props.fontSize" :font-size="props.fontSize">{{
        item.str
      }}</text>
    </template>
  </slot>
</template>
