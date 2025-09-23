import { exec } from 'child_process'

import HttpClient from '../HttpClient'
import { Logger } from '../Logger'

type IpInterface = {
  IPAddress: string
  SuffixOrigin: string
  InterfaceAlias: string
}

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

const getIpv6 = async () => {
  const _promise = new Promise<string | null>((resolve, reject) => {
    exec(
      `powershell -Command "(Get-NetIPAddress -AddressFamily IPv6 | Where-Object {  $_.IPAddress -ne '::1' -and $_.SuffixOrigin -ne 'Random' -and  $_.InterfaceAlias -notlike '*Wi-Fi Direct*'}) | ConvertTo-Json"`,
      (error, stdout, stderr) => {
        let interfaces: Array<IpInterface> = JSON.parse(stdout)
        const found = interfaces
          .filter((el) => el.InterfaceAlias === 'WLAN')
          .map((el) => el.IPAddress)
          .join(',')
        resolve(found)
      }
    )
  })

  await _promise
  return _promise
}

const getIpv4 = async () => {
  const _promise = new Promise<string | null>((resolve, reject) => {
    exec(
      `powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {  $_.IPAddress -ne '::1' -and $_.SuffixOrigin -ne 'Random' -and $_.InterfaceAlias -ne 'WLAN' -and  $_.InterfaceAlias -notlike '*Wi-Fi Direct*'}) | ConvertTo-Json"`,
      (error, stdout, stderr) => {
        let interfaces: Array<IpInterface> = JSON.parse(stdout)
        const found = interfaces.find((el) => el.InterfaceAlias === 'WLAN')
        resolve(found?.IPAddress ?? null)
      }
    )
  })

  await _promise
  return _promise
}

let prevString: string | null = null

export default async function main() {
  if (!isNode) return

  try {
    const ipv6 = await getIpv6()
    if (ipv6 === prevString) return
    prevString = ipv6
    Logger.log('ipv6:', ipv6)
    // 发送 JSON 数据
    const jsonResponse = await HttpClient.postJsonpost({
      url: 'https://api.chuckfang.com/imagic',
      data: {
        title: 'ipaddress',
        msg: `${ipv6}`
      },
      options: {}
    })
    Logger.log('JSON Response:', jsonResponse)
  } catch (error) {
    if (error instanceof Error) {
      Logger.error('HTTP Client Error:', error.message)
    }
  }
}

if (require.main === module) {
  main()
}
