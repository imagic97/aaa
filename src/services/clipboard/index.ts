class Clipboard {
  private _fakeEl: HTMLTextAreaElement | null = null

  constructor() {
    this._fakeEl = null
  }

  copy (text: string) {
    return new Promise<void>((resolve, reject) => {
      this._removeFake()

      this._addFake(text)

      const ret = this._doCopy()

      this._removeFake()

      if (ret) {
        resolve()
      } else {
        reject(new Error(`您的浏览器不支持一键复制，请手动复制：\n${text}`))
      }
    })
  }

  private _addFake (text: string) {
    const isRTL = window.document.documentElement.getAttribute('dir') === 'rtl'

    this._fakeEl = window.document.createElement('textarea')

    this._fakeEl.style.position = 'absolute'
    this._fakeEl.style[(isRTL ? 'right' : 'left')] = '-9999px'
    this._fakeEl.style.top = `${window.pageYOffset || window.document.documentElement.scrollTop}px`

    this._fakeEl.setAttribute('readonly', '')
    this._fakeEl.value = text

    window.document.body.appendChild(this._fakeEl)

    this._fakeEl.select()
    this._fakeEl.setSelectionRange(0, this._fakeEl.value.length)
  }

  private _removeFake () {
    if (this._fakeEl !== null) {
      window.document.body.removeChild(this._fakeEl)
      this._fakeEl.remove()
      this._fakeEl = null
    }
  }

  private _doCopy () {
    try {
      return window.document.execCommand('copy')
    } catch (e) {
      return false
    }
  }

  copyImage (blob: Blob) {
    return Promise.resolve()
      .then(() => {
        if (!navigator.clipboard) {
          throw new Error('您的浏览器暂不支持复制图像')
        }
        return new Promise<Blob>((resolve, reject) => {
          if (blob.type === 'image/png') {
            return resolve(blob)
          }

          try {
            var canvas = document.createElement('canvas')
            let img = new Image()
            img.setAttribute("crossOrigin", 'Anonymous')

            img.src = window.URL.createObjectURL(blob)
            let ctx = canvas.getContext('2d')

            if (!ctx) {
              reject('创建 Canvas 失败')
            }

            img.onload = () => {
              canvas.width = img.width
              canvas.height = img.height
              ctx!.drawImage(img, 0, 0)

              canvas.toBlob((data) => {
                if (data) {
                  resolve(data)
                } else {
                  reject('转换失败')
                }
              }, 'image/png')
            }
          } catch (error) {
            reject(error)
          }
        })
          .then((blob: Blob) => {
            const item = new ClipboardItem({
              [blob.type]: blob
            })
            return navigator.clipboard.write([item])
          })
      })
  }
}

export default new Clipboard()

