import https from 'https'
import http from 'http'

export default class HttpClient {
  static async post({ url, data, options }: { url: string; data: any; options: Record<string, any> }) {
    const { headers = {}, timeout = 10000, json = true } = options

    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const protocol = urlObj.protocol === 'https:' ? https : http

      const postData = json ? JSON.stringify(data) : data

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (protocol === https ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          ...headers
        }
      }

      const req = protocol.request(requestOptions, (res) => {
        let responseData = ''
        let isJson = false

        // 检查响应内容类型
        const contentType = res.headers['content-type']
        if (contentType && contentType.includes('application/json')) {
          isJson = true
        }

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const result = isJson ? JSON.parse(responseData) : responseData
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: result
            })
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            })
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`))
      })

      req.setTimeout(timeout, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.write(postData)
      req.end()
    })
  }

  // 发送 JSON 数据
  static async postJsonpost({ url, data, options }: { url: string; data: any; options: Record<string, any> }) {
    return this.post({
      url,
      data,
      options: {
        ...options,
        json: true
      }
    })
  }

  // 发送表单数据
  static async postFormpost({ url, formData, options }: { url: string; formData: any; options: Record<string, any> }) {
    const params = new URLSearchParams(formData).toString()
    return this.post({
      url,
      data: params,
      options: {
        ...options,
        json: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers
        }
      }
    })
  }
}
