import { ref, watch } from 'vue'
import randomString from '../utils/randomString'

/**
 * @param functions 影响 history 状态
 * @returns status boolean
 */
export default function useRouterStack<T>(functions?: {
  /** 正向时执行函数 */
  do?: () => Promise<T>
  /** 返回时执行函数 */
  back?: (value?: T) => Promise<void>
}) {
  const status = ref(false)
  let key = ''

  let execValue: T | undefined = undefined

  if (functions && functions.do) {
    const thatDo = functions.do
    functions.do = async () => {
      execValue = await thatDo.call(null)
      status.value = true
      return execValue
    }
  }

  if (functions && functions.back) {
    const thatBack = functions.back
    functions.back = async () => {
      await thatBack.call(null, execValue)
      status.value = false
    }
  }

  const whenPopState = async (event: PopStateEvent) => {
    if (!event.state[key]) {
      if (functions && functions.back) {
        await functions.back.call(null, execValue)
      }
      status.value = false
    }
  }

  watch(status, (newVal, oldVal) => {
    if (newVal) {
      key = randomString()
      window.history.pushState(
        {
          ...history.state,
          [key]: true
        },
        ''
      )
      window.addEventListener('popstate', whenPopState)
    } else {
      window.removeEventListener('popstate', whenPopState)
      if (history.state[key] === true) {
        history.back()
      }
    }
  })

  return status
}
