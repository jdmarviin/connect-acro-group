import { getPayload } from 'payload'
import config from '../src/payload.config'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
if (!email || !password || password.length < 12) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD com pelo menos 12 caracteres.')
const payload = await getPayload({ config })
try {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
  if (existing.docs.length) throw new Error('E-mail já cadastrado. Ajuste o papel pelo administrador existente; nenhuma conta foi alterada.')
  await payload.create({ collection: 'users', data: { name: process.env.ADMIN_NAME || 'Trader', email, password, role: 'admin', onboardingCompleted: true } })
  payload.logger.info('Administrador criado.')
} finally { await payload.destroy() }
