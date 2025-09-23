export default class TextMakesure {
  static getTextWidth({
    canvasCtx,
    text,
    width,
    fontSize = 12,
    maxLine = 1,
    overflow = '…',
    textEndGap = 0,
    textAlign = 'left'
  }: {
    canvasCtx: CanvasRenderingContext2D
    text: string
    width: number
    fontSize?: number
    maxLine?: number
    overflow?: string
    textEndGap?: number
    textAlign?: 'center' | 'right' | 'left'
  }) {
    canvasCtx.save()
    const ret: Array<{ str: string; width: number; widths: Array<number>; left: 0 }> = []
    let _overflowWidth = 0
    if (canvasCtx) {
      if (overflow.length > 0) {
        const materic = canvasCtx.measureText(overflow)
        _overflowWidth = materic.width
      }
      let curText: (typeof ret)[0] = { str: '', width: 0, widths: [], left: 0 }
      ret.push(curText)
      canvasCtx.font = `${fontSize}px sans-serif`
      for (const el of text) {
        const materic = canvasCtx.measureText(el)
        if (curText.width + materic.width > width - (ret.length === maxLine ? textEndGap : 0)) {
          if (ret.length === maxLine) {
            if (_overflowWidth > 0) {
              let last = ret[ret.length - 1]
              let lastLineWidth = width - textEndGap
              while (last.width + _overflowWidth > lastLineWidth) {
                const w = last.widths.pop() ?? 0
                last.width -= w
                last.str = last.str.slice(0, last.str.length - 1)
              }
              last.width += _overflowWidth
              last.str += overflow
            }
            return ret
          }

          curText = { str: el, width: materic.width, widths: [materic.width], left: 0 }
          ret.push(curText)
        } else {
          curText.str += el
          curText.width += materic.width
          curText.widths.push(materic.width)
        }
      }
    }
    canvasCtx.restore()
    return ret.map((el) => {
      let left = 0
      switch (textAlign) {
        case 'center':
          left = (width - el.width) / 2
          break

        case 'right':
          left = width - el.width
          break
      }
      return {
        ...el,
        left
      }
    })
  }
}
