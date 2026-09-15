import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const MeetingTickets: CollectionConfig = {
  slug: 'meeting-tickets',
  access: { create: () => false, read: adminOnly, update: () => false, delete: adminOnly },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'meetingId', type: 'text', required: true, index: true },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}
