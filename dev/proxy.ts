// dev/proxy.ts

import http from 'http'
import httpProxy from 'http-proxy'

// The local port your wrangler dev server is running on
const TARGET_PORT = 8787
// The port your proxy will listen on (choose any open port, e.g., 3000)
const PROXY_PORT = 8777

// Create a proxy server
const proxy = httpProxy.createProxyServer({
	target: `http://localhost:${TARGET_PORT}`,
	ws: true,
})

// Create an HTTP server that listens on all interfaces
const server = http.createServer((req, res) => {
	proxy.web(req, res, {}, (err) => {
		res.writeHead(502, { 'Content-Type': 'text/plain' })
		res.end('Proxy error: ' + err.message)
	})
})

// Support WebSocket proxying
server.on('upgrade', (req, socket, head) => {
	proxy.ws(req, socket, head)
})

server.listen(PROXY_PORT, '0.0.0.0', () => {
	console.log(`Proxy server running at http://0.0.0.0:${PROXY_PORT}/`)
	console.log('Accessible from your local network!')
})
