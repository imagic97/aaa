import Parser from 'rss-parser'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

interface RssFeed {
  title?: string
  description?: string
  link?: string
}

interface RssItem {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  guid?: string
}

class RssReader {
  parser = new Parser<RssFeed, RssItem>()

  async fetchRSSFromUrl(url: string) {
    try {
      const httpsAgent = new HttpsProxyAgent(new URL('http://127.0.0.1:8081'))

      const response = await axios.get(url, {
        httpsAgent: httpsAgent
        //   proxy: {
        //     protocol: 'http',
        //     host: '127.0.0.1',
        //     port: 8081
        //   }
      })

      const feed = await this.parser.parseString(response.data)
      return feed
    } catch (error) {
      throw new Error(`获取 RSS 失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async fetchMultipleRSS(urls: string[], maxItems = 10) {
    const results = []

    for (const url of urls) {
      try {
        const feed = await this.fetchRSSFromUrl(url)
        results.push({
          source: url,
          title: feed.title,
          items: feed.items?.slice(0, maxItems) || []
        })
      } catch (error) {
        console.error(`获取 ${url} 失败:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    return results
  }
}

export default new RssReader()
