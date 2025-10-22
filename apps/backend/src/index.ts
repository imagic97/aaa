import http from 'http'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })  

  res.end('Hello, Node.js!\n')
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`服务器正在监听端口 ${PORT}`)
})
