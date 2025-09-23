const fs = require('fs')
const path = require('path')

// 确保 logs 目录存在
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

// 日志文件路径
const logFilePath = path.join(logsDir, 'app.log')
export class Logger {
  /**
   * 日志记录函数
   * @param {...any} args - 要记录的日志内容
   */
  static log<T>(...args: Array<T>) {
    // 格式化日志内容
    const timestamp = new Date().toISOString()
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')
    const logMessage = `[log][${timestamp}] ${message}\n`

    // 输出到控制台
    console.log(...args)

    // 写入到日志文件
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  }

  static error<T>(...args: Array<T>) {
    // 格式化日志内容
    const timestamp = new Date().toISOString()
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')
    const logMessage = `[error][${timestamp}] ${message}\n`

    // 输出到控制台
    console.error(...args)

    // 写入到日志文件
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  }
}
