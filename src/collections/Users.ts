import type { CollectionConfig } from 'payload'
import { adminOnly, ownerOrAdmin } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  auth: { useSessions: false, tokenExpiration: 86400, cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' } },
  access: { admin: ({ req }) => req.user?.role === 'admin', create: adminOnly, unlock: adminOnly, read: ownerOrAdmin, update: ownerOrAdmin, delete: adminOnly },
  hooks: { beforeChange: [({ data, originalDoc, operation }) => {
    // Trial start is server-owned, including updates through the generated REST API.
    data.createdAt = operation === 'create' ? new Date().toISOString() : originalDoc.createdAt
    return data
  }] },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome Completo',
      required: true,
    },
    {
      name: 'role',
      access: { create: ({ req }) => req.user?.role === 'admin', update: ({ req }) => req.user?.role === 'admin' },
      type: 'select',
      label: 'Papel do Usuário',
      options: [
        { label: 'Administrador (Trader)', value: 'admin' },
        { label: 'Usuário (Participante)', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'whatsapp',
      type: 'text',
      label: 'Número de WhatsApp/celular',
    },
    {
      name: 'zoomId',
      access: { create: () => false, update: () => false },
      type: 'text',
      label: 'Zoom ID',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'avatar_url',
      type: 'text',
      label: 'Avatar URL',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'operatesInFinancialMarket',
      type: 'select',
      label: 'Você já opera no mercado financeiro?',
      options: [
        { label: 'Sim', value: 'yes' },
        { label: 'Não', value: 'no' },
      ],
    },
    {
      name: 'tradingKnowledgeTime',
      type: 'text',
      label: 'Há quanto tempo conhece trading?',
    },
    {
      name: 'tookCoursesBefore',
      type: 'select',
      label: 'Já fez algum curso anteriormente?',
      options: [
        { label: 'Sim', value: 'yes' },
        { label: 'Não', value: 'no' },
      ],
    },
    {
      name: 'currentProfession',
      type: 'text',
      label: 'Qual é sua profissão atual?',
    },
    {
      name: 'availableTime',
      type: 'text',
      label: 'Quantas horas por dia ou por semana teria disponível para estudar e operar?',
    },
    {
      name: 'mainGoal',
      type: 'text',
      label: 'Qual seu principal objetivo com o mercado?',
    },
    {
      name: 'tradingIntention',
      type: 'select',
      label: 'Você pretende transformar trading em profissão ou apenas renda complementar?',
      options: [
        { label: 'Profissão', value: 'profession' },
        { label: 'Renda Complementar', value: 'extra_income' },
      ],
    },
    {
      name: 'biggestDifficulty',
      type: 'text',
      label: 'Qual sua maior dificuldade hoje?',
    },
    {
      name: 'expectations30Days',
      type: 'text',
      label: 'O que você espera aprender nesses 30 dias?',
    },
    {
      name: 'onboardingCompleted',
      access: { create: () => false, update: () => false },
      type: 'checkbox',
      label: 'Onboarding Concluído',
      defaultValue: false,
    }
  ],
}
