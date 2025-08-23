type PromiseQueueItemResult<T> = {
  value?: T
  status?: 'undo'
}

type PromiseQueueItem<T> = {
  promise: Promise<PromiseQueueItemResult<T>>
  result: PromiseQueueItemResult<T>
  resolve: (value?: PromiseQueueItemResult<T>) => void,
  reject: (reason: any) => void
}

/** 
 * 顺序执行 Promise
 * 传入 exec 函数时遇错停止
 * 非 exec 时，手动判断前一个 Promise 返回值 status === 'undo' 是否需要继续执行
 */
export default class QueueChoke {
  private promiseQueue: Array<PromiseQueueItem<any>> = []

  public async do<T> (exec?: (preValue?: PromiseQueueItemResult<T>) => Promise<T>) {
    let _resolve: ((value?: PromiseQueueItemResult<T>) => void) = () => { }
    let _reject = (reason: any) => { }

    let _promise = new Promise<PromiseQueueItemResult<T>>((resolve, reject) => {
      _resolve = resolve as any
      _reject = reject
    })
      .then(res => {
        return res
      })
      .catch(error => {
        return {
          status: 'undo'
        } as PromiseQueueItemResult<T>
      })
      .finally(() => {
        this.promiseQueue = this.promiseQueue.filter(el => el.promise !== _promise)
      })

    let item: PromiseQueueItem<T> = {
      promise: _promise,
      resolve: _resolve,
      reject: _reject,
      result: {}
    }

    this.promiseQueue.push(item)

    let result: PromiseQueueItemResult<T> = {}

    if (this.promiseQueue.length > 1) {
      const result = await this.promiseQueue[this.promiseQueue.length - 2].promise
      item.result.value = result.value
      item.result.status = result.status
    }

    if (exec) {
      if (item.result.status === 'undo') {
        _resolve({ status: 'undo' })
      } else {
        exec(result)
          .then((res) => {
            _resolve({ value: res })
          })
          .catch(error => {
            _reject(error)
          })
      }
    }

    return item
  }

  public destory () {
    this.promiseQueue.forEach(_promise => {
      _promise.reject('undo')
    });
  }
}
