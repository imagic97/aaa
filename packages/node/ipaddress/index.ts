import os from 'os'

import HttpClient from '../httpClient'

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

function getAllIPs() {
  const ips: Record<string, Array<{ interface: string; address: string }>> = {
    IPv4: [],
    IPv6: []
  }
  if (!isNode) return ips

  const interfaces = os.networkInterfaces()

  for (const interfaceName in interfaces) {
    const _interface = interfaces[interfaceName]
    if (!_interface) continue
    _interface.forEach((iface) => {
      if (!iface.internal) {
        if (iface.family === 'IPv4') {
          ips.IPv4.push({
            interface: interfaceName,
            address: iface.address
          })
        } else if (iface.family === 'IPv6') {
          ips.IPv6.push({
            interface: interfaceName,
            address: iface.address
          })
        }
      }
    })
  }

  return ips
}

if (isNode) {
  const ips = getAllIPs()
  console.log('所有 IP 地址:', ips)

  ips.IPv6.slice(0, 1).forEach(async (el) => {
    try {
      // 发送 JSON 数据
      const jsonResponse = await HttpClient.postJsonpost({
        url: 'https://api.chuckfang.com/imagic',
        data: {
          title: 'ipaddress',
          msg: `${el.address}`,
          url: `moonlight://[${el.address}]:47989`
        },
        options: {}
      })
      console.log('JSON Response:', jsonResponse)
    } catch (error) {
      if (error instanceof Error) {
        console.error('HTTP Client Error:', error.message)
      }
    }
  })
}
