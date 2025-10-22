const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

const logFilePath = path.join(logsDir, 'app.log')

export class Logger {
  static log<T>(...args: Array<T>) {
    const timestamp = new Date().toLocaleString()
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')
    const logMessage = `[${timestamp}][log] ${message}\n`

    console.log(...args)
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  }

  static error<T>(...args: Array<T>) {
    const timestamp = new Date().toLocaleString()
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')
    const logMessage = `[${timestamp}][error] ${message}\n`

    console.error(...args)
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  }
}
