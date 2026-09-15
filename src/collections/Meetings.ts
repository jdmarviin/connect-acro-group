import type { CollectionConfig } from 'payload'
import { adminOnly, activeMember } from '../lib/access'
import { parseZoomLink } from '../lib/zoom-link'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    useAsTitle: 'title',
  },
  access: { create: adminOnly, read: activeMember, update: adminOnly, delete: adminOnly },
  hooks: { beforeValidate: [({ data }) => {
    if (data?.zoomLink) data.zoomMeetingId = parseZoomLink(data.zoomLink).meetingNumber
    return data
  }] },
  fields: [
    { name: 'status', type: 'select', options: ['scheduled', 'live', 'ended'], defaultValue: 'scheduled', index: true },
    { name: 'meetingUUID', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'startedAt', type: 'date', admin: { readOnly: true } },
    { name: 'endedAt', type: 'date', admin: { readOnly: true } },
    {
      name: 'title',
      type: 'text',
      label: 'Título da Reunião',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      label: 'Data e Hora',
      required: true,
    },
    {
      name: 'zoomLink',
      required: true,
      access: { read: ({ req }) => req.user?.role === 'admin' },
      type: 'text',
      label: 'Link do Zoom',
    },
    {
      name: 'zoomMeetingId',
      type: 'text',
      label: 'Zoom Meeting ID (Opcional)',
    },
    {
      name: 'notifyParticipants',
      type: 'checkbox',
      label: 'Notificar Participantes (integração futura)',
      defaultValue: false,
    },
    {
      name: 'durationMinutes',
      type: 'number',
      label: 'Duração (Minutos)',
      defaultValue: 60,
    }
  ],
}
