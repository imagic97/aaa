const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * 生成随机字符串
 * @param length - 长度，默认 6 位
 * @returns 随机字符串
 */
export default function randomString (length = 6): string {
  let ret = ''
  for (let i = 0; i < length; i++) {
    const ri = Math.floor(Math.random() * characters.length)
    ret += characters[ri]
  }
  return ret
}
