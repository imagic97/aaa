<script lang="ts" setup generic="T,K">
import type { SaSvgItem } from './SaSvgControl'

const props = defineProps<{
  isSelected?: boolean
  item: SaSvgItem<T, K>

  enableMove?: boolean
  enableResize?: boolean
}>()
</script>

<template>
  <g :transform="`translate(${item.x}, ${item.y})`">
    <g class="SaSvg__item_handler" :data-key="item.key">
      <!-- shadow -->
      <template v-if="props.isSelected">
        <slot name="shadow" v-bind="{ item }">
          <rect class="SaSvg__wrap_shadow" x="-10" y="-10" :width="item.w + 20" :height="item.h + 20" rx="8" fill="#556275" fill-opacity="0.1" />
        </slot>
      </template>

      <!-- 内容 -->
      <slot />

      <!-- 附加内容 -->
      <slot name="extra" v-bind="{ item }" />

      <!-- resize -->
      <template v-if="props.enableResize && props.isSelected">
        <g :transform="`translate(-4,-4)`">
          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="nw"
            style="cursor: nwse-resize;"
            :x="'0'"
            :y="'0'" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="n"
            style="cursor: ns-resize;"
            :x="`${props.item.w / 2}`"
            :y="'0'" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="ne"
            style="cursor: nesw-resize;"
            :x="`${props.item.w}`"
            :y="'0'" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="e"
            style="cursor: ew-resize;"
            :x="`${props.item.w}`"
            :y="`${props.item.h / 2}`" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="se"
            style="cursor: nwse-resize;"
            :x="`${props.item.w}`"
            :y="`${props.item.h}`" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="s"
            style="cursor: ns-resize;"
            :x="`${props.item.w / 2}`"
            :y="`${props.item.h}`" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="sw"
            style="cursor: nesw-resize;"
            :x="'0'"
            :y="`${props.item.h}`" />

          <use class="SaSvg__resize_handler" href="#SaSvg__anchor" width="8" height="8"
            data-mode="w"
            style="cursor: ew-resize;"
            :x="'0'"
            :y="`${props.item.h / 2}`" />
        </g>
      </template>
    </g>
  </g>
</template>
