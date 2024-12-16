/**
 * HTTP 动作
 */
export type HttpMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'PURGE' | 'LINK' | 'UNLINK'

/**
 * HTTP 异常
 */
export class HttpError extends Error {
  public code?: number = undefined
  public data?: any = undefined
}

/**
 * HTTP 请求封装
 *
 * @public
 */
export default class HttpService {

  /**
   * @private
   */
  constructor() { }

  /**
   * 发起 HTTP 请求并返回结果
   *
   * @param options - 命名参数
   * @returns 请求结果
   */
  public static async request ({
    method,
    url,
    headers,
    data,
    params,
    timeout,
    signal,
    withCredentials
  }: {
    /** 请求动作 */
    method: HttpMethod

    /** 请求 URL */
    url: string

    /** 请求头 */
    headers?: Record<string, string>

    /** 请求体 */
    data?: XMLHttpRequestBodyInit | null

    /** 请求 URL 参数 */
    params?: Record<string, string>

    /** 请求超时时间（单位：毫秒） */
    timeout?: number

    withCredentials?: boolean

    onUploadProgress?: () => void

    onDownloadProgress?: () => void

    signal?: AbortSignal
  }): Promise<Response> {
    let search: string | null = null
    if (params !== undefined) {
      search = (new URLSearchParams(params)).toString()
    }

    const input: string = `${url}${search !== null ? `?${search}` : ''}`

    const controller = new AbortController()

    let timer: number | null = null
    if (timeout !== undefined) {
      timer = window.setTimeout(() => {
        controller.abort(new Error(`timeout of ${timeout}ms exceeded`))
      }, timeout)
    }

    const abortFn = (event: Event) => {
      controller.abort(event)
    }

    if (signal !== undefined) {
      signal.addEventListener('abort', abortFn)
    }

    return fetch(input, {
      method,
      headers,
      body: data,
      signal: controller.signal,
      credentials: withCredentials ? 'same-origin' : 'omit',
      redirect: 'error'
    })
      .catch(async (error: Error) => {
        if (controller.signal.aborted && controller.signal.reason instanceof Error) {
          error = controller.signal.reason
        }

        if (error.message === 'Network Error') {
          error.message = '网络连接断开，请检查网络'
          return Promise.reject(error)
        }
        if (error.message.startsWith('timeout of ')) {
          error.message = '网络连接超时，请检查网络'
          return Promise.reject(error)
        }

        return Promise.reject(error)
      })
      .finally(() => {
        if (signal !== undefined) {
          signal.removeEventListener('abort', abortFn)
        }
        if (timer !== null) {
          clearTimeout(timer)
        }
      })
  }
}
