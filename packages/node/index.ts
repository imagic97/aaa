import { exec } from 'child_process'
import { Logger } from './Logger'
import CronJob from './CronJob'
import { default as ipMain } from './IPAddress'
import { default as animeMain } from './Anime'

async function main() {
  await new Promise<void>((resolove) => {
    exec(`powershell -Command "run-proxy"`, (error, stdout, stderr) => {
      resolove()
    })
  })

  const cronJob = new CronJob()
  cronJob.register(
    async () => {
      Logger.log('---------ipaddress start---------')
      await ipMain()
      Logger.log('---------ipaddress end---------')
    },
    60 * 5,
    true
  )

  cronJob.register(
    async () => {
      Logger.log('---------anime start---------')
      await animeMain()
      Logger.log('---------anime end---------')
    },
    60 * 60 * 1,
    true
  )

  cronJob.start()
}

if (require.main === module) {
  main()
}
