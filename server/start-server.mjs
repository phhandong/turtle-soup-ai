const SERVER_FC_API_URL = 'https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run'

process.env.FC_API_URL = SERVER_FC_API_URL
process.env.PORT ||= '4173'
process.env.FC_TIMEOUT_MS ||= '60000'

const { createApp } = await import('./index.mjs')

const port = Number(process.env.PORT) || 4173
const server = createApp()

server.listen(port, () => {
  console.log(`Server listening on http://127.0.0.1:${port}`)
  console.log(`Forwarding /api/ai to ${process.env.FC_API_URL}`)
})
