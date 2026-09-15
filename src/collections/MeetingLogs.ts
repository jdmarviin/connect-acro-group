import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const MeetingLogs: CollectionConfig = {
  slug: 'meeting-logs',
  admin: {
    useAsTitle: 'meetingId',
  },
  access: { create: () => false, read: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'sessionKey', type: 'text', unique: true, index: true },
    { name: 'meetingUUID', type: 'text', index: true },
    { name: 'participantRole', type: 'select', options: ['admin', 'user', 'unknown'], defaultValue: 'unknown' },
    { name: 'source', type: 'select', options: ['zoom', 'browser'], defaultValue: 'zoom' },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Usuário',
      index: true,
    },
    {
      name: 'zoomUserId',
      type: 'text',
      label: 'Zoom User ID',
      index: true,
    },
    {
      name: 'participantName',
      type: 'text',
      label: 'Nome do Participante (Zoom)',
    },
    {
      name: 'participantEmail',
      type: 'text',
      label: 'Email do Participante (Zoom)',
    },
    {
      name: 'meetingId',
      type: 'text',
      label: 'Zoom Meeting ID',
      required: true,
      index: true,
    },
    {
      name: 'joinTime',
      type: 'date',
      label: 'Data e Hora de Entrada',
    },
    {
      name: 'leaveTime',
      type: 'date',
      label: 'Data e Hora de Saída',
    },
    {
      name: 'durationMinutes',
      type: 'number',
      label: 'Duração Total (Minutos)',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'webhookStatus',
      type: 'select',
      label: 'Status do Webhook',
      options: [
        { label: 'Aberto (Entrou)', value: 'joined' },
        { label: 'Fechado (Saiu)', value: 'left' },
      ],
      defaultValue: 'joined',
    }
  ],
}
