import { handleVercelRequest } from '../../server/vercel-adapter.mjs'

export default async function handler(req, res) {
  await handleVercelRequest(req, res)
}
