import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function createAdmin() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })
    console.log(`Current users in DB: ${users.totalDocs}`)

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Admin',
        email: 'admin@acrogroup.com',
        password: 'admin',
        role: 'admin',
      },
    })
    console.log('Admin user created successfully!', user.email)
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
  process.exit(0)
}

createAdmin()
