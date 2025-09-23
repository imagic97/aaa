import fs from 'fs'
import axios from 'axios'
import FormData from 'form-data'

import Config from '../Config'

export default class QbTorrent {
  private baseUrl: string
  private username: string
  private password: string
  private sid: string | null = null

  constructor() {
    const config = new Config()
    const url = config.get('qbitUrl')
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
    this.username = config.get('qbitUser')
    this.password = config.get('qbitPwd')
  }

  /**
   * 登录 qBittorrent Web UI
   */
  async login(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v2/auth/login`,
        `username=${this.username}&password=${this.password}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )

      if (response.data === 'Ok.') {
        const cookies = response.headers['set-cookie']
        if (cookies && cookies.length > 0) {
          this.sid = cookies[0].split('')[0]
        }
      } else {
        throw new Error('登录失败: ' + response.data)
      }
    } catch (error) {
      throw new Error(`登录错误: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 添加磁力链接任务
   * @param magnet 磁力链接
   * @param savePath 保存路径(可选)
   */
  async addMagnet(magnet: string, savePath?: string): Promise<void> {
    if (!this.sid) await this.login()

    const form = new FormData()
    form.append('urls', magnet)
    if (savePath) form.append('savepath', savePath)

    try {
      await axios.post(`${this.baseUrl}/api/v2/torrents/add`, form, {
        headers: {
          Cookie: this.sid,
          ...form.getHeaders()
        }
      })
    } catch (error) {
      throw new Error(`添加磁力链接失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 添加种子文件任务
   * @param torrentPath 种子文件路径
   * @param savePath 保存路径(可选)
   */
  async addTorrent(torrentPath: string, savePath?: string): Promise<void> {
    if (!this.sid) await this.login()

    const form = new FormData()
    form.append('torrents', fs.createReadStream(torrentPath))
    if (savePath) form.append('savepath', savePath)

    try {
      await axios.post(`${this.baseUrl}/api/v2/torrents/add`, form, {
        headers: {
          Cookie: this.sid,
          ...form.getHeaders()
        }
      })
    } catch (error) {
      throw new Error(`添加种子文件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 获取所有任务列表
   */
  async getTorrents(): Promise<any[]> {
    if (!this.sid) await this.login()

    try {
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        headers: { Cookie: this.sid }
      })
      return response.data
    } catch (error) {
      throw new Error(`获取任务列表失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
