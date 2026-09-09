import type { CollectionConfig } from 'payload'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
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
      label: 'Notificar Participantes',
      defaultValue: true,
    },
    {
      name: 'durationMinutes',
      type: 'number',
      label: 'Duração (Minutos)',
      defaultValue: 60,
    }
  ],
}
