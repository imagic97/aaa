<script setup lang="ts" generic="T, K">
import { computed, watch, nextTick, useTemplateRef, type CSSProperties, onMounted } from 'vue'

import type { SaSvgControl } from './SaSvgControl'

const props = defineProps<{
  control: SaSvgControl<T, K>
  readonly?: boolean
}>()

/**
 * 可视区域
 */
const elCanvas = useTemplateRef('elCanvas')

/**
 * 可视区域
 */
const elViewport = useTemplateRef('elViewport')

/**
 * 当前光标指针 CSS 类型
 * @returns {CSSProperties['cursor']} CSS cursor 值
 */
const cssCursor = computed<CSSProperties['cursor']>(() => {
  if (props.control.isMoving) return 'move'
  if (props.control.isWalking) return 'grabbing'
  if (props.control.isKeySpaceDown) return 'grab'

  return 'initial'
})

/**
 * 滚动条数据
 */
const sb = computed<{ xRatio: number; xOffset: number; yRatio: number; yOffset: number } | null>(() => {
  const viewportSize = _getViewportSize()

  if (viewportSize === null) return null

  const contentPos = _getContentPos()

  if (contentPos === null) return null

  const scale = props.control.scale
  const offsetX = props.control.offsetX
  const offsetY = props.control.offsetY

  const w = Math.max(contentPos.r * scale, viewportSize.w - offsetX) - Math.min(contentPos.l * scale, 0 - offsetX)
  const h = Math.max(contentPos.b * scale, viewportSize.h - offsetY) - Math.min(contentPos.t * scale, 0 - offsetY)

  const xRatio = viewportSize.w / w
  const yRatio = viewportSize.h / h
  const xOffset = 0 - offsetX > contentPos.l * scale ? (0 - offsetX - contentPos.l * scale) / w : 0
  const yOffset = 0 - offsetY > contentPos.t * scale ? (0 - offsetY - contentPos.t * scale) / h : 0

  return { xRatio, yRatio, xOffset, yOffset }
})

/**
 * 获取可视区域大小
 */
const _getViewportSize = (): { w: number; h: number } | null => {
  if (elViewport.value === null) return null

  return {
    w: elViewport.value.offsetWidth,
    h: elViewport.value.offsetHeight
  }
}

/**
 * 设置可视区域位置
 */
const _setViewportPos = (input: { x: number; y: number }): void => {
  props.control.offsetX = input.x
  props.control.offsetY = input.y
}

/**
 * 设置可视区域缩放
 */
const _setViewportScale = (input: { scale: number }): void => {
  props.control.scale = input.scale
}

/**
 * 获取内容区域边界坐标
 */
const _getContentPos = (): { l: number; t: number; r: number; b: number } | null => {
  const l = props.control.items.reduce((sum, item) => {
    if (item.x < sum) sum = item.x
    return sum
  }, Infinity)
  const t = props.control.items.reduce((sum, item) => {
    if (item.y < sum) sum = item.y
    return sum
  }, Infinity)
  const r = props.control.items.reduce((sum, item) => {
    if (item.x + item.w > sum) sum = item.x + item.w
    return sum
  }, -Infinity)
  const b = props.control.items.reduce((sum, item) => {
    if (item.y + item.h > sum) sum = item.y + item.h
    return sum
  }, -Infinity)

  return { l, t, r, b }
}

/**
 * 原始缩放
 */
const _doInitview = () => {
  props.control.scale = 1
  props.control.offsetX = 0
  props.control.offsetY = 0
}

/**
 * 铺满缩放
 */
const _doFullview = (width?: number, height?: number) => {
  const viewportSize = _getViewportSize()

  if (viewportSize && width !== undefined) {
    viewportSize.w = width
  }
  if (viewportSize && height !== undefined) {
    viewportSize.h = height
  }

  if (viewportSize === null) return

  const contentPos = _getContentPos()

  if (contentPos === null) return

  const { l, t, r, b } = contentPos

  const w = r - l + 20
  const h = b - t + 20

  if (isNaN(w) || isNaN(h)) return

  props.control.scale = Math.min(viewportSize.w / w, viewportSize.h / h)
  props.control.offsetX = (viewportSize.w - w * props.control.scale) / 2 - l * props.control.scale + 10
  props.control.offsetY = (viewportSize.h - h * props.control.scale) / 2 - t * props.control.scale + 10
}

const _print = (rect?: { width: number; height: number }) => {
  if (elViewport.value === null) return
  if (rect) {
    _doFullview(rect.width, rect.height)
  } else {
    const size = _getViewportSize()
    if (size) {
      rect = { width: size.w, height: size.h }
    }
  }

  let svgNode = elViewport.value.querySelector('svg')
  if (!svgNode) return
  nextTick(() => {
    iframePrint(svgNode, rect)
  })
}

const iframePrint = (node: Element, rect?: { width: number; height: number }) => {
  const htmlText = node.outerHTML

  let elFrame = window.document.createElement('iframe')
  // Safari 需要设置宽高
  elFrame.setAttribute('style', `position: absolute; height: 100%; width: 100%; left: 999px; top: -999px; z-index: -99;`)
  elFrame = window.document.body.appendChild(elFrame)

  // Firefox 需要挂载 iframe 后再继续
  setTimeout(() => {
    const iframeDoc = elFrame.contentDocument
    if (iframeDoc === null) return

    if (rect) {
      let insertString = ` viewBox="0 0 ${rect.width} ${rect.height}" `
      let position = 5
      iframeDoc.body.innerHTML = `${htmlText.slice(0, position)}${insertString}${htmlText.slice(position)}`
    } else {
      iframeDoc.body.innerHTML = `${htmlText}`
    }

    elFrame.contentWindow?.focus()
    elFrame.contentWindow?.print()

    setTimeout(() => {
      window.document.body.removeChild(elFrame)
    }, 1000)
  }, 500)
}

watch(
  () => props.control,
  () => {
    props.control.getViewportSize = _getViewportSize
    props.control.setViewportPos = _setViewportPos
    props.control.setViewportScale = _setViewportScale
    props.control.getContentPos = _getContentPos
    props.control.viewInit = _doInitview
    props.control.viewFull = _doFullview
    props.control.viewPrint = _print
  },
  { immediate: true }
)

onMounted(() => {
  if (elCanvas.value) {
    const ctx = elCanvas.value.getContext('2d')
    if (ctx) {
      props.control.setCanvasCtx(ctx)
    }
  }
})

defineExpose({
  getViewportSize: _getViewportSize,
  setViewportPos: _setViewportPos,
  setViewportScale: _setViewportScale,
  getContentPos: _getContentPos,
  viewInit: _doInitview,
  viewFull: _doFullview,
  print: _print
})
</script>

<template>
  <div class="SaSvg">
    <div
      ref="elViewport"
      tabindex="0"
      class="SaSvg__viewport"
      @wheel.capture="props.control.onWheel"
      @keyup="props.control.onKeyup"
      @keydown="props.control.onKeydown"
      @mousedown="props.control.onMousedown"
      @mousemove="props.control.onMousemove"
      @mouseup="props.control.onMouseup"
      @mouseleave="props.control.onMouseup"
      @dragover.prevent="props.control.onDragover"
      @drop="props.control.onDrop"
      @contextmenu.prevent="props.control.onContextmenu"
      :style="{ cursor: cssCursor }"
    >
      <canvas style="display: none" ref="elCanvas"></canvas>

      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style="display: block; touch-actions: none"
        v-if="elCanvas !== null"
      >
        <defs>
          <pattern
            id="SaSvg__def_bg"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
          >
            <line x1="20" y1="0" x2="20" y2="20" stroke="#e3e3e3" stroke-width="1" />
            <line x1="0" y1="20" x2="20" y2="20" stroke="#e3e3e3" stroke-width="1" />
          </pattern>

          <symbol id="SaSvg__anchor" viewBox="0 0 8 8" preserveAspectRatio="none">
            <path fill="#ffffff" fill-rule="evenodd" stroke="#adadad" stroke-width="1" d="M.5.5h7v7h-7z" />
          </symbol>
        </defs>

        <g>
          <rect x="0" y="0" width="100%" height="100%" fill="#f6f6f6" fill-rule="evenodd" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#SaSvg__def_bg)" fill-rule="evenodd" />
        </g>

        <slot
          name="background"
          v-bind="{
            selectItemKeys: props.control.selectedItemKeys,
            offsetX: props.control.offsetX,
            offsetY: props.control.offsetY,
            scale: props.control.scale
          }"
        />

        <template v-if="props.control.isConnecting">
          <g :transform="`translate(${props.control.offsetX}, ${props.control.offsetY}) scale(${props.control.scale})`">
            <polyline
              fill="none"
              fill-rule="evenodd"
              stroke="#8AABCC"
              stroke-width="1"
              :points="`${props.control.renderConnenting()}`"
            />
          </g>
        </template>

        <g :transform="`translate(${props.control.offsetX}, ${props.control.offsetY}) scale(${props.control.scale})`">
          <slot v-bind="{ selectItemKeys: props.control.selectedItemKeys }" />
        </g>

        <template v-if="props.control.isSelecting && props.control.dragStartX !== 0 && props.control.dragStartY !== 0">
          <polygon
            :points="`${props.control.dragStartX},${props.control.dragStartY} ${props.control.selectingX},${props.control.dragStartY} ${props.control.selectingX},${props.control.selectingY} ${props.control.dragStartX},${props.control.selectingY}`"
            fill="rgb(126, 154, 196, 0.2)"
            fill-rule="evenodd"
            stroke="#7e9ac4"
            stroke-width="1"
          />
        </template>
      </svg>

      <template
        v-if="
          !props.control.isSelecting &&
          !props.control.isMoving &&
          !props.control.isResizing &&
          !props.control.isConnecting &&
          sb !== null
        "
      >
        <div class="SaSvg__sb-x" v-if="sb.xRatio < 1">
          <div class="SaSvg__sb-x-handler" :style="{ width: `${sb.xRatio * 100}%`, left: `${sb.xOffset * 100}%` }" />
        </div>

        <div class="SaSvg__sb-y" v-if="sb.yRatio < 1">
          <div class="SaSvg__sb-y-handler" :style="{ height: `${sb.yRatio * 100}%`, top: `${sb.yOffset * 100}%` }" />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.SaSvg {
  width: 100%;
  height: 100%;

  &__viewport {
    width: 100%;
    height: 100%;
    outline-width: 0;
    user-select: none;
    position: relative;
  }

  $sbWidth: 10px;

  &__sb-x {
    position: absolute;
    bottom: 0;
    left: 0;
    right: $sbWidth;
    height: $sbWidth;
    z-index: 1;

    &:hover &-handler {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }

  &__sb-y {
    position: absolute;
    right: 0;
    top: 0;
    bottom: $sbWidth;
    width: $sbWidth;
    z-index: 1;

    &:hover &-handler {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }

  &__sb-x-handler,
  &__sb-y-handler {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: #{math.div($sbWidth, 2)};

    position: relative;

    transition-property: background-color;
    transition-duration: 150ms;
  }

  &__sb-x-handler {
    height: 100%;
    width: 200px;
  }

  &__sb-y-handler {
    width: 100%;
    height: 200px;
  }

  .line-selected {
    stroke-dasharray: 5, 3;
    animation: dash 2s linear infinite;
    --dashoffset: -48;

    @keyframes dash {
      to {
        stroke-dashoffset: var(--dashoffset);
      }
    }
  }
}
</style>
