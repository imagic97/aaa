enum ResizeMode {
  NW = 'nw',
  N = 'n',
  NE = 'ne',
  E = 'e',
  SE = 'se',
  S = 's',
  SW = 'sw',
  W = 'w'
}

export interface SaSvgBaseItem<T> {
  key: string
  x: number
  y: number
  w: number
  h: number
  type: T
}

export type SaSvgItem<T, K> = SaSvgBaseItem<T> & K

abstract class SaSvgEvents {
  /**
   * 回调：事件
   */
  abstract onWheel(event: WheelEvent): void

  /**
   * 回调：事件
   */
  abstract onKeyup(event: KeyboardEvent): void

  /**
   * 回调：事件
   */
  abstract onKeydown(event: KeyboardEvent): void

  /**
   * 回调：事件
   */
  abstract onMousedown(event: MouseEvent): void

  /**
   * 回调：事件
   */
  abstract onMousemove(event: MouseEvent): void

  /**
   * 回调：事件
   */
  abstract onMouseup(event: MouseEvent): void

  /**
   * 回调：事件
   */
  abstract onDragover(event: DragEvent): void

  /**
   * 回调：事件
   */
  abstract onDrop(event: DragEvent): void

  /**
   * 回调：事件
   */
  abstract onContextmenu(event: MouseEvent): void
}

abstract class SaSvgBase<T> {
  /**
   * 计算连线控制点
   *
   * @param fX 起点图形横坐标
   * @param fY 起点图形纵坐标
   * @param tX 终点图形横坐标
   * @param tY 终点图形纵坐标
   * @param x1 连线起点横坐标
   * @param y1 连线起点纵坐标
   * @param x2 连线终点横坐标
   * @param y2 连线终点纵坐标
   */
  abstract calcLinePoints(fX: number, fY: number, tX: number, tY: number, x1: number, y1: number, x2: number, y2: number): string

  /**
   * 生成正在连接节点的线段
   */
  abstract renderConnenting(): string

  /**
   * 回调：事件
   */
  abstract getItemMinSizes(type: T): { w: number; h: number }

  /**
   * 回调：事件
   */
  abstract getItemDefaultSizes(type: T): { w: number; h: number }

  /**
   * 回调：事件
   */
  abstract getViewportSize(): void

  /**
   * 回调：事件
   */
  abstract setViewportPos(input: { x: number; y: number }): void
  /**
   * 回调：事件
   */
  abstract setViewportScale(input: { scale: number }): void
  /**
   * 回调：事件
   */
  abstract getContentPos(): void
  /**
   * 回调：事件
   */
  abstract viewInit(): void
  /**
   * 回调：事件
   */
  abstract viewFull(): void
  /**
   * 回调：事件
   */
  abstract viewPrint(): void
}

/**
 * SaSvgControl
 */
export class SaSvgControl<T, K> implements SaSvgEvents, SaSvgBase<T> {
  ctx: CanvasRenderingContext2D | null = null

  get canvasCtx() {
    if (!this.ctx) {
      throw new Error('Canvas 未初始化')
    }
    return this.ctx
  }

  setCanvasCtx(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /**
   * 是否只读
   */
  readonly: boolean = false

  /**
   * 画布区域横向偏移
   */
  offsetX: number = 0

  /**
   * 画布区域纵向偏移
   */
  offsetY: number = 0

  /**
   * 画布区域缩放倍数
   */
  scale: number = 1

  /**
   * 当前指针 hover 对象
   */
  hoverItemKey: string | null = null

  /**
   * 是否正在移动组件
   */
  isMoving: boolean = false

  /**
   * 是否正在移动视图
   */
  isWalking: boolean = false

  /**
   * 是否正在选择
   */
  isSelecting: boolean = false

  /**
   * 是否正在拖拽大小
   */
  isResizing: boolean = false

  /**
   * 是否正在连线中
   */
  isConnecting: boolean = false

  /**
   * 是否正在按住空格
   */
  isKeySpaceDown: boolean = false

  /**
   * 选中的组件 key
   */
  selectedItemKeys: Array<string> = []

  isScrollingX: boolean = false
  scrollStartX: number = 0

  isScrollingY: boolean = false
  scrollStartY: number = 0

  resizingMode: ResizeMode | null = null
  resizingStarts: { [key: string]: { x: number; y: number; w: number; h: number } } | null = null

  movingStarts: { [key: string]: { x: number; y: number; w: number; h: number } } | null = null

  dragDelta: { deltaX: number; deltaY: number; target?: HTMLElement } = { deltaX: 0, deltaY: 0 }
  dragStartX: number = 0
  dragStartY: number = 0

  connectingStartItem: string | null = null
  connectingStartX: number = 0
  connectingStartY: number = 0
  connectingX: number = 0
  connectingY: number = 0

  selectingStartItem: string | null = null
  selectingStartX: number = 0
  selectingStartY: number = 0
  selectingX: number = 0
  selectingY: number = 0

  walkStartOffsetX: number = 0
  walkStartOffsetY: number = 0

  /**
   * 组件
   */
  items: Array<SaSvgItem<T, K>> = []

  constructor(items: Array<SaSvgItem<T, K>>) {
    this.items = items
  }

  /**
   * 判断是否存在祖先元素
   *
   * @param el 待判断的元素
   * @param needle css类名或指定元素
   */
  isAncestor(el: Node | null, needle: Node | string): boolean {
    if (el === null) return false
    if (el === needle) return true

    if (typeof needle === 'string') {
      const _el = el as HTMLElement
      if (_el.classList && _el.classList.contains(needle)) return true
    }

    return this.isAncestor(el.parentNode, needle)
  }

  /**
   * 获取祖先元素
   *
   * @param el 待判断的元素
   * @param needle css类名
   */
  getAncestor(el: HTMLElement | null, needle: string): HTMLElement | null {
    if (el === null) return null
    const _el = el as HTMLElement
    if (_el.classList && _el.classList.contains(needle)) return _el

    return this.getAncestor(el.parentElement, needle)
  }

  /**
   * 判断坐标是否在另一个矩形范围之内
   *
   * @param x 待判断的横坐标
   * @param y 待判断的纵坐标
   * @param x1 矩形左上的横坐标
   * @param y1 矩形左上的纵坐标
   * @param x2 矩形右下的横坐标
   * @param y2 矩形右下的纵坐标
   */
  isCoordsInRect(x: number, y: number, x1: number, y1: number, x2: number, y2: number): boolean {
    return (
      (x > x1 && y > y1 && x < x2 && y < y2) ||
      (x > x2 && y > y2 && x < x1 && y < y1) ||
      (x > x1 && y > y2 && x < x2 && y < y1) ||
      (x > x2 && y > y1 && x < x1 && y < y2)
    )
  }

  /**
   * 计算指定像素值的相邻网格像素值
   */
  neighborGridPixel(input: number, base: number): number {
    return Math.round(input / base) * base
  }

  onWheel(event: WheelEvent): void {
    if (event.ctrlKey) {
      event.preventDefault()

      const scaleBefore = this.scale

      this.scale = Math.max(0.2, Math.min(2, this.scale - event.deltaY * 0.001))

      const scaleAfter = this.scale

      const w = (event.currentTarget as HTMLElement).offsetWidth
      const h = (event.currentTarget as HTMLElement).offsetHeight

      {
        this.offsetX += w * (scaleBefore - scaleAfter) * (event.offsetX / w)
        this.offsetY += h * (scaleBefore - scaleAfter) * (event.offsetY / h)
      }
    } else {
      this.offsetX -= event.deltaX
      this.offsetY -= event.deltaY
    }
  }

  onKeyup(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.isKeySpaceDown = false
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.isKeySpaceDown = true
    }
  }

  onMousedown(event: MouseEvent): void {
    if (this.readonly) return

    const target = event.target as HTMLElement
    if ((event.button === 0 && this.isKeySpaceDown) || event.button === 1) {
      this.isWalking = true
      this.dragStartX = event.pageX
      this.dragStartY = event.pageY
      this.walkStartOffsetX = this.offsetX
      this.walkStartOffsetY = this.offsetY
      return
    }

    if (event.button === 0 && target.classList.contains('SaSvg__resize_handler')) {
      const itemElement = this.getAncestor(target, 'SaSvg__item_handler')
      if (itemElement) {
        const itemKey = itemElement.dataset.key as string
        // 缩放锚点
        const selectedItems = this.items.filter((item) => itemKey === item.key)
        this.selectedItemKeys = selectedItems.map((el) => el.key)

        if (selectedItems.length !== 0) {
          const targetMode = target.dataset.mode as ResizeMode
          this.isResizing = true
          this.dragStartX = event.pageX
          this.dragStartY = event.pageY
          this.resizingMode = targetMode
          this.resizingStarts = selectedItems.reduce(
            (sum: { [key: string]: { x: number; y: number; w: number; h: number } }, item) => {
              sum[item.key] = { x: item.x, y: item.y, w: item.w, h: item.h }
              return sum
            },
            {}
          )
        }
      }
      return
    }

    if (event.button === 0 && this.isAncestor(target, 'SaSvg__item_handler')) {
      const itemElement = this.getAncestor(target, 'SaSvg__item_handler')
      if (itemElement) {
        const itemKey = itemElement.dataset.key as string
        if (event.shiftKey) {
          // 多选
          const targetIndex = this.selectedItemKeys.indexOf(itemKey)
          if (targetIndex >= 0) {
            this.selectedItemKeys.splice(targetIndex, 1)
          } else {
            this.selectedItemKeys.push(itemKey)
          }
        } else if (event.altKey) {
          // 连线
          const targetItem = this.items.find((el) => el.key === itemKey)
          if (targetItem) {
            this.connectingStartX = this.connectingX = targetItem.x + targetItem.w / 2
            this.connectingStartY = this.connectingY = targetItem.y + targetItem.h / 2

            this.selectedItemKeys = [itemKey]
            this.isConnecting = true
            this.connectingStartItem = itemKey
            return
          }
        } else if (this.selectedItemKeys.length <= 1) {
          this.selectedItemKeys = [itemKey]
        } else if (!this.selectedItemKeys.includes(itemKey)) {
          this.selectedItemKeys = [itemKey]
        }

        if (!this.readonly) {
          this.isMoving = true
          if (this.readonly) return

          const selectedItems = this.items.filter((item) => this.selectedItemKeys.includes(item.key))
          this.dragStartX = event.pageX
          this.dragStartY = event.pageY
          this.movingStarts = selectedItems.reduce(
            (sum: { [key: string]: { x: number; y: number; w: number; h: number } }, item) => {
              sum[item.key] = { x: item.x, y: item.y, w: item.w, h: item.h }
              return sum
            },
            {}
          )
        }
      }
      return
    }

    if (event.button === 0 && target.classList.contains('SaSvg__sb-x-handler')) {
      // 点中了横向滚动条
      this.isScrollingX = true
      this.dragStartX = event.pageX
      this.scrollStartX = this.offsetX
      return
    }

    if (event.button === 0 && target.classList.contains('SaSvg__sb-y-handler')) {
      // 点中了纵向滚动条
      this.isScrollingY = true
      this.dragStartY = event.pageY
      this.scrollStartY = this.offsetY
      return
    }

    if (event.button === 0) {
      // 什么都没点中
      this.isSelecting = true
      this.dragStartX = event.offsetX
      this.dragStartY = event.offsetY
      this.selectingX = event.offsetX
      this.selectingY = event.offsetY
      if (!event.shiftKey) {
        this.selectedItemKeys = []
      }
    }
  }

  onMousemove(event: MouseEvent): void {
    if (this.readonly) return
    const target = event.target as HTMLElement
    const targetKey = target.dataset.key as string
    if (this.isAncestor(target, 'SaSvg__item_handler')) {
      this.hoverItemKey = targetKey
    } else {
      this.hoverItemKey = null
    }

    if (this.isWalking) {
      this.offsetX = this.walkStartOffsetX + (event.pageX - this.dragStartX)
      this.offsetY = this.walkStartOffsetY + (event.pageY - this.dragStartY)
    }

    if (this.isMoving) {
      const deltaX = (event.pageX - this.dragStartX) / this.scale
      const deltaY = (event.pageY - this.dragStartY) / this.scale

      this.dragDelta = { deltaX, deltaY, target: this.dragDelta.target }

      for (const itemKey in this.movingStarts) {
        const item = this.items.find((item) => item.key === itemKey)
        if (item !== undefined) {
          item.x = this.neighborGridPixel(this.movingStarts[itemKey].x + deltaX, 10)
          item.y = this.neighborGridPixel(this.movingStarts[itemKey].y + deltaY, 10)
        }
      }

      this.hoverItemKey = null
    }

    if (this.isResizing && this.resizingMode !== null && this.resizingStarts !== null) {
      const deltaX = (event.pageX - this.dragStartX) / this.scale
      const deltaY = (event.pageY - this.dragStartY) / this.scale
      if (this.selectedItemKeys.length === 1) {
        const targetKey = this.selectedItemKeys[0]
        const targetItem = this.items.find((el) => el.key === targetKey)
        if (targetItem) {
          const itemMinSizes = this.getItemMinSizes(targetItem.type)
          const itemMinWidth = itemMinSizes.w
          const itemMinHeight = itemMinSizes.h

          switch (this.resizingMode) {
            case 'nw':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w - deltaX), 20)
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h - deltaY), 20)
              if (targetItem.w > itemMinWidth) {
                targetItem.x = this.neighborGridPixel(this.resizingStarts[targetItem.key].x + deltaX, 10)
              }
              if (targetItem.h > itemMinHeight) {
                targetItem.y = this.neighborGridPixel(this.resizingStarts[targetItem.key].y + deltaY, 10)
              }
              break
            case 'n':
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h - deltaY), 20)
              if (targetItem.h > itemMinHeight) {
                targetItem.y = this.neighborGridPixel(this.resizingStarts[targetItem.key].y + deltaY, 10)
              }
              break
            case 'ne':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w + deltaX), 20)
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h - deltaY), 20)
              if (targetItem.h > itemMinHeight) {
                targetItem.y = this.neighborGridPixel(this.resizingStarts[targetItem.key].y + deltaY, 10)
              }
              break
            case 'e':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w + deltaX), 20)
              break
            case 'se':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w + deltaX), 20)
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h + deltaY), 20)
              break
            case 's':
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h + deltaY), 20)
              break
            case 'sw':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w - deltaX), 20)
              targetItem.h = this.neighborGridPixel(Math.max(itemMinHeight, this.resizingStarts[targetItem.key].h + deltaY), 20)
              if (targetItem.w > itemMinWidth) {
                targetItem.x = this.neighborGridPixel(this.resizingStarts[targetItem.key].x + deltaX, 10)
              }
              break
            case 'w':
              targetItem.w = this.neighborGridPixel(Math.max(itemMinWidth, this.resizingStarts[targetItem.key].w - deltaX), 20)
              if (targetItem.w > itemMinWidth) {
                targetItem.x = this.neighborGridPixel(this.resizingStarts[targetItem.key].x + deltaX, 10)
              }
              break
          }
          this.hoverItemKey = null
        }
      }
    }

    if (this.isConnecting) {
      this.connectingX = (event.offsetX - this.offsetX) / this.scale
      this.connectingY = (event.offsetY - this.offsetY) / this.scale
    }

    if (this.isSelecting) {
      this.selectingX = event.offsetX
      this.selectingY = event.offsetY
      this.selectedItemKeys = this.items
        .filter((item) => {
          return (
            this.isCoordsInRect(
              item.x * this.scale + this.offsetX,
              item.y * this.scale + this.offsetY,
              this.dragStartX,
              this.dragStartY,
              this.selectingX,
              this.selectingY
            ) &&
            this.isCoordsInRect(
              (item.x + item.w) * this.scale + this.offsetX,
              (item.y + item.h) * this.scale + this.offsetY,
              this.dragStartX,
              this.dragStartY,
              this.selectingX,
              this.selectingY
            )
          )
        })
        .map((item) => item.key)
    }

    if (this.isScrollingX && this.dragStartX !== null && this.scrollStartX !== null) {
      this.offsetX = this.scrollStartX - (event.pageX - this.dragStartX) * Math.max(1, Math.pow(this.scale, 2))
    }

    if (this.isScrollingY && this.dragStartY !== null && this.scrollStartY !== null) {
      this.offsetY = this.scrollStartY - (event.pageY - this.dragStartY) * Math.max(1, Math.pow(this.scale, 2))
    }
  }

  onMouseup(event: MouseEvent): void {
    if (this.isWalking) {
      this.isWalking = false
      this.dragStartX = 0
      this.dragStartY = 0
      this.walkStartOffsetX = 0
      this.walkStartOffsetY = 0
    }

    if (this.isMoving) {
      this.isMoving = false
      this.dragStartX = 0
      this.dragStartY = 0
    }

    if (this.isResizing) {
      this.isResizing = false
      this.dragStartX = 0
      this.dragStartY = 0
      this.resizingMode = null
    }

    if (this.isConnecting) {
      this.isConnecting = false
      this.connectingStartItem = null
      this.connectingStartX = 0
      this.connectingStartY = 0
      this.connectingX = 0
      this.connectingY = 0
    }

    if (this.isSelecting) {
      this.isSelecting = false
      this.dragStartX = 0
      this.dragStartY = 0
      this.selectingX = 0
      this.selectingY = 0
    }

    if (this.isScrollingX) {
      this.isScrollingX = false
      this.dragStartX = 0
      this.scrollStartX = 0
    }

    if (this.isScrollingY) {
      this.isScrollingY = false
      this.dragStartY = 0
      this.scrollStartY = 0
    }
  }

  calcLinePoints(fX: number, fY: number, tX: number, tY: number, x1: number, y1: number, x2: number, y2: number): string {
    let c1x = 0
    let c1y = 0
    let c2x = 0
    let c2y = 0

    if (Math.abs(fX - tX) <= Math.abs(fY - tY)) {
      c1x = x1
      c1y = (y1 + y2) / 2
      c2x = x2
      c2y = (y1 + y2) / 2
    } else {
      c1x = (x1 + x2) / 2
      c1y = y1
      c2x = (x1 + x2) / 2
      c2y = y2
    }

    return `${x1} ${y1} ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`
  }

  renderConnenting() {
    return this.calcLinePoints(
      this.connectingStartX,
      this.connectingStartY,
      this.connectingX,
      this.connectingY,
      this.connectingStartX,
      this.connectingStartY,
      this.connectingX,
      this.connectingY
    )
  }

  onDragover(event: DragEvent): void {}

  onDrop(event: DragEvent): void {}

  onContextmenu(event: MouseEvent): void {}

  getItemMinSizes(type: T) {
    return { w: 40, h: 40 }
  }

  getItemDefaultSizes(type: T) {
    return { w: 40, h: 40 }
  }

  destory() {}

  getViewportSize() {}
  setViewportPos(input: { x: number; y: number }) {}
  setViewportScale(input: { scale: number }) {}
  getContentPos() {}
  viewInit() {}
  viewFull() {}
  viewPrint() {}
}
