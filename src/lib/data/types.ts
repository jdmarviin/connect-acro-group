export type ID = string | number
export interface AppUser {
  id: ID; name: string; email: string; role: 'owner' | 'admin' | 'user'; createdAt: string; updatedAt: string
  whatsapp?: string | null; zoomId?: string | null; avatar_url?: string | null; onboardingCompleted?: boolean | null
  trialEndsAt?: string; isBlocked?: boolean; journeyStatus?: string
  operatesInFinancialMarket?: string | null; tradingKnowledgeTime?: string | null; tookCoursesBefore?: string | null
  currentProfession?: string | null; availableTime?: string | null; mainGoal?: string | null
  tradingIntention?: string | null; biggestDifficulty?: string | null; expectations30Days?: string | null
}
export interface AppMeeting {
  id: ID; title: string; kind?: 'scheduled' | 'recurring' | 'personal' | 'occurrence' | null
  status?: 'scheduled' | 'live' | 'ended' | 'cancelled' | null; date?: string | null
  zoomMeetingId?: string | null; meetingUUID?: string | null; host?: ID | AppUser | null
  zoomHostId?: string | null; zoomLink: string; roomKey?: string | null
  parentMeeting?: ID | AppMeeting | null; startedAt?: string | null; endedAt?: string | null
  durationMinutes?: number | null; notifyParticipants?: boolean | null; createdAt: string; updatedAt: string
}
export interface AppLog {
  meetingTitle?: string | null
  id: ID; user?: ID | AppUser | null; meetingId: string; meetingUUID?: string | null
  joinTime?: string | null; leaveTime?: string | null; durationMinutes?: number | null
  participantRole?: string | null; source?: string | null; zoomUserId?: string | null
  webhookStatus?: string | null
  participantName?: string | null; participantEmail?: string | null; createdAt: string; updatedAt: string
}
export interface AppProduct { id: ID; name: string; description?: string | null; thumbnailUrl: string; checkoutUrl: string }
export interface Documents { users: AppUser; meetings: AppMeeting; 'meeting-logs': AppLog; products: AppProduct }
export type Where = { [field: string]: unknown }
export interface DataReader {
  find<C extends keyof Documents>(args: {collection:C;where?:Where;sort?:string;limit?:number;pagination?:boolean;depth?:number}): Promise<{docs:Documents[C][]}>
  findByID<C extends keyof Documents>(args:{collection:C;id:ID;depth?:number}):Promise<Documents[C]>
}
