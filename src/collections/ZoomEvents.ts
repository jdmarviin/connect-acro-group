import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const ZoomEvents: CollectionConfig = {
  slug: 'zoom-events',
  admin: { useAsTitle: 'event' },
  access: { read: adminOnly, create: () => false, update: () => false, delete: adminOnly },
  fields: [
    { name: 'eventKey', type: 'text', required: true, unique: true },
    { name: 'event', type: 'text', required: true },
    { name: 'body', type: 'json', required: true },
  ],
}
