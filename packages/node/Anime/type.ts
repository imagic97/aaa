export interface AnimeConfig {
  /** 排除 */
  excludeRegx?: string,
  /** 文本过滤 */
  filterRegx: Array<string>,
  /** 集数获取 */
  episodeRegx: Array<string>,
  anime: Array<{
    /** 排除 */
    excludeRegx?: string
    name: string
    regx: string
    dirPath: string
    files: Array<string>
    total: number
    episodes: Array<number>
  }>
}
