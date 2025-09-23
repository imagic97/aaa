export enum Direction {
  N = 'n',
  S = 's',
  W = 'w',
  E = 'e',
  NW = 'nw',
  NE = 'ne',
  SE = 'se',
  SW = 'sw',
  Empty = ''
}

export type Point = { x: number, y: number }

/**
 * 计算指定像素值的相邻网格像素值
 */
export const getNeighborGridPixel = (input: number, base: number = 10): number => {
  return Math.round(input / base) * base
}

/**
 * 从字符串中获取 Point 数组
 */
export const splitToPoints = (str: string) => {
  return str.split(/[\x20;]+/).reduce<Array<Point>>((sum, el) => {
    let [x, y] = el.split(/[\x20,]+/)
    if (y !== undefined) {
      sum.push({ x: Number(x), y: Number(y) })
    }
    return sum
  }, [])
}

