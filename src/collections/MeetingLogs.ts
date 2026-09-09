import type { CollectionConfig } from 'payload'

export const MeetingLogs: CollectionConfig = {
  slug: 'meeting-logs',
  admin: {
    useAsTitle: 'meetingId',
  },
  access: {
    create: () => true, // Will be created by webhook
    read: () => true, // Admin panel handles its own auth
  },
  fields: [
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
