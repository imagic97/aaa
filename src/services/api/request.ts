import HttpService, { type HttpMethod } from '@/services/http'

/**
 * 请求转换
 *
 * @param data 请求体
 * @param headers 请求头
 */
const transformRequest = function (config: any) {
  if (typeof config.params === 'object' && config.params !== null) {
    for (const key in config.params) {
      if (Array.isArray(config.params[key])) {
        config.params[key] = config.params[key].join(',')
      }
    }
  }

  if (typeof config.data === 'object' && config.data !== null) {
    const hasBlob = Object.keys(config.data).some(key => config.data[key] instanceof Blob)

    if (hasBlob) {
      const formData = new FormData()
      Object.keys(config.data).forEach(function (key) {
        formData.append(key, config.data[key])
      })
      config.data = formData
    }
    else {
      config.headers['Content-Type'] = 'application/json'
      config.data = JSON.stringify(config.data)
    }
  }

  return Promise.resolve(config)
}


/**
 * @param response
 */
async function handleResponse<T> (response: Response): Promise<T> {
  let body

  if (response.headers.get('Content-Type') === 'application/json') {
    body = await response.json()
  } else {
    body = await response.text() as T
  }

  switch (response.status) {
    case 401:
      return Promise.reject(new Error(body.message))
    case 500:
    case 502:
      return Promise.reject(new Error('服务器繁忙，请稍候重试'))
    case 403:
    case 404:
    case 501:
    case 503:
    case 504:
      return Promise.reject(new Error('服务暂不可用，请稍候重试'))
    default:
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(body)
      }
      return Promise.reject(new Error(`${response.status} ${response.statusText}`))
  }
}

export default async function request<T> ({
  method,
  url,
  params,
  data,
  config
}: {
  method: HttpMethod
  url: string
  params?: Record<string, string>
  data?: any,
  config?: {
    baseURL?: string
    header?: Record<string, any>
    params?: any
    timeout?: number
  }
}): Promise<T> {
  if (params !== undefined) {
    for (const k in params) {
      if (params[k] === undefined) {
        delete params[k]
      }
    }
  }

  let baseConfig = {
    baseURL: '',
    method,
    url,
    headers: {},
    params,
    data: data
  }

  if (config !== undefined) {
    baseConfig = { ...baseConfig, ...config }
  }

  baseConfig = await transformRequest(baseConfig)

  return HttpService.request({
    method: baseConfig.method,
    url: `${baseConfig.baseURL}/${baseConfig.url}`,
    headers: baseConfig.headers,
    params: baseConfig.params,
    data: baseConfig.data,
    timeout: config && config.timeout
  })
    .then(response => {
      return handleResponse<T>(response)
    })
    .catch((error: Error) => {
      if ('response' in error) {
        return handleResponse<T>(error.response as Response)
      }

      if (error.message === 'Network Error') {
        error.message = '网络连接断开，请检查网络状况'
        return Promise.reject(error)
      }

      if (error.message.indexOf('timeout of ') === 0) {
        error.message = '网络连接超时，请检查网络状况'
        return Promise.reject(error)
      }

      return Promise.reject(error)
    })
}

export { request }
