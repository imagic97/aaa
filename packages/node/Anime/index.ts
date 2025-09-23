import fs from 'fs'
import path from 'path'

import QbTorrent from '../QbTorrent'
import { AnimeConfig } from './type'
import Config from '../Config'
import RssReader from '../RssReader'
import { Logger } from '../Logger'

/**
 * 获取指定目录下的所有文件夹
 * @param {string} dirPath 目录路径
 * @returns {Promise<string[]>} 文件夹名称数组
 */
async function getDirectories(dirPath: string) {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
    return items.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
  } catch (err) {
    Logger.error(new Error(`读取文件夹 ${dirPath} 失败：${err}`))
    return []
  }
}

async function readConfigFile(dirPath: string) {
  const readmePath = path.join(dirPath, 'config.json')
  try {
    const content = await fs.promises.readFile(readmePath, 'utf-8')
    return JSON.parse(content) as AnimeConfig
  } catch (err) {
    Logger.error(new Error(`读取文件 ${readmePath} 失败：${err}`))
    return null
  }
}

/**
 * 主函数：获取目录下的文件夹并读取各自的文件
 * @param {string} targetDir 目标目录
 */
async function processDirectories(targetDir: string) {
  try {
    const ret: Array<{
      dirName: string
      files: Array<string>
    }> = []
    const directories = await getDirectories(targetDir)
    for (const dir of directories) {
      const item: (typeof ret)[0] = {
        dirName: dir,
        files: []
      }
      const fullDirPath = path.join(targetDir, dir)
      const items = await fs.promises.readdir(fullDirPath, { withFileTypes: true })
      const files = items.map((dirent) => dirent.name)
      item.files = files

      ret.push(item)
    }
    return ret
  } catch (err) {
    Logger.error(new Error(`读取已下载文件失败：${err}`))
    return []
  }
}

const downloadPath = new Config().get('filePath')
const configPath = path.join(downloadPath, 'config.json')

async function init() {
  const files = await processDirectories(downloadPath)
  const animeConfig: AnimeConfig = {
    anime: files.map((el) => {
      return {
        name: el.dirName,
        regx: '',
        dirPath: el.dirName,
        files: el.files,
        total: el.files.length,
        episode: 0,
        episodes: []
      }
    }),
    filterRegx: [],
    episodeRegx: []
  }

  try {
    await fs.promises.writeFile(configPath, JSON.stringify(animeConfig, null, 4), 'utf8')
  } catch (err) {
    Logger.error('写入文件出错:', err)
  }
}

export default async function main() {
  if (!Config.isNodeEnv) return

  const animeConfig: AnimeConfig | null = await readConfigFile(downloadPath)

  if (!animeConfig) {
    init()
    return
  }

  const files = await processDirectories(downloadPath)

  // 初始化动画对应的正则条件
  const animeRegx = new Map<
    string,
    {
      regx: RegExp
      excludeRegx?: RegExp
    }
  >()

  const globalRegx = {
    exclude: animeConfig.excludeRegx ? new RegExp(animeConfig.excludeRegx, 'gi') : null,
    filter: animeConfig.filterRegx.map((el) => new RegExp(el)),
    episode: animeConfig.episodeRegx.map((el) => new RegExp(el))
  }

  animeConfig.anime.forEach((el) => {
    const found = files.find((item) => item.dirName === el.dirPath)
    let _regx = new RegExp(el.regx)
    let _excludeRegx: RegExp | undefined
    if (el.excludeRegx && el.excludeRegx.length > 0) {
      _excludeRegx = new RegExp(el.excludeRegx)
    }
    animeRegx.set(el.name, {
      regx: _regx,
      excludeRegx: _excludeRegx
    })
    if (found) {
      el.files = found.files
      el.total = found.files.length
    } else {
      fs.mkdir(`${downloadPath}/${el.dirPath}`, { recursive: true }, (err) => {})
      el.files = []
      el.total = 0
      el.episodes = []
    }
  })

  try {
    Logger.log('正在获取 RSS 订阅……')
    const singleFeed = await RssReader.fetchRSSFromUrl(new Config().get('animeRss'))

    // if (animeConfig.excludeRegx && animeConfig.excludeRegx.length > 0) {
    //   const excludeRegx = new RegExp(animeConfig.excludeRegx, 'i')
    //   singleFeed.items = singleFeed.items.filter(el => !excludeRegx.test(el.title ?? ''))
    // }
    // if (animeConfig.filterRegx && animeConfig.filterRegx.length > 0) {
    //   const filterRegx = animeConfig.filterRegx.map(el => new RegExp(el, 'gi'))
    //   singleFeed.items.forEach(el => {
    //     if (el.title) {
    //       filterRegx.forEach(regx => {
    //         el.title = el.title!.replace(regx, '')
    //       })
    //     }
    //   })
    // }

    Logger.log('\n正在校验是否存在更新')
    const pendingMagnet: Array<{
      path: string
      name: string
      title: string
      magnet: string
      episode: number
      source: (typeof animeConfig.anime)[0]
    }> = []
    for (const item of singleFeed.items) {
      if (item.title) {
        Logger.log('\n当前 RssFeed：', item.title)
        let _title = item.title
        if (globalRegx.exclude && globalRegx.exclude.test(item.title)) {
          Logger.log('exclude!!!')
          continue
        }

        globalRegx.filter.forEach((el) => {
          _title = _title.replace(el, '')
        })

        let _episode = -1
        const found = animeConfig.anime.find((el) => {
          const regx = animeRegx.get(el.name)
          if (!regx) return false

          if (regx.excludeRegx) {
            if (regx.excludeRegx.test(_title)) {
              return false
            }
          }

          if (regx.regx.test(_title)) {
            // 获取集数
            globalRegx.episode.some((el) => {
              let episodeMatch = el.exec(_title)
              if (episodeMatch && episodeMatch.length > 0 && /\d+/.test(episodeMatch[1])) {
                _episode = parseInt(episodeMatch[1])
                return true
              }
              return false
            })
            return !el.episodes.includes(_episode)
          }
          return false
        })

        if (found && item.enclosure) {
          const pending = pendingMagnet.find((el) => el.name === found.name && el.episode === _episode)
          if (pending) {
            // 已存在，跳过
          } else {
            pendingMagnet.push({
              name: found.name,
              title: item.title,
              path: found.dirPath,
              magnet: item.enclosure.url,
              source: found,
              episode: _episode
            })
          }
        }
      }
    }

    const qbTorrent = new QbTorrent()

    for (const el of pendingMagnet) {
      await qbTorrent
        .addMagnet(el.magnet, `${downloadPath}/${el.path}`)
        .then(() => {
          Logger.log(`\n已添加到 qbTorrent: --${el.episode}-- ${el.title}`)
          el.source.episodes.push(el.episode)
        })
        .catch((error) => {
          Logger.log(`添加 qbTorrent 错误:`, el.title)
          Logger.log(`错误: `, error)
        })
    }

    await fs.promises.writeFile(configPath, JSON.stringify(animeConfig, null, 4), 'utf8')

    Logger.log('\n脚本结束')
  } catch (error) {
    Logger.error('发生错误:', error instanceof Error ? error.message : String(error))
  }
}

if (require.main === module) {
  main()
}
