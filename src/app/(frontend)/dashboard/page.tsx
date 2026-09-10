import Link from "next/link";
import { PlayCircle, Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect } from "next/navigation";

export default async function ParticipantDashboard() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  
  let user = null;
  const cookieHeader = headers.get('cookie') || ''
  const match = cookieHeader.match(/payload-token=([^;]+)/)
  
  if (match && match[1]) {
    try {
      const decoded = jwt.verify(match[1], process.env.PAYLOAD_SECRET!) as { id: string | number }
      user = await payload.findByID({ collection: 'users', id: decoded.id })
    } catch {}
  }

  if (!user) {
    redirect('/api/auth/zoom')
  }

  // Fetch upcoming meetings
  const now = new Date();
  const upcomingMeetingsReq = await payload.find({
    collection: 'meetings',
    where: {
      date: {
        greater_than_equal: now.toISOString(),
      }
    },
    sort: 'date',
    limit: 5,
  });
  
  // Find live meeting (within 15 minutes before or during the meeting duration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let liveMeeting: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetings = upcomingMeetingsReq.docs.map((m: any) => {
    const meetingDate = new Date(m.date);

    const endTime = new Date(meetingDate.getTime() + (m.durationMinutes || 60) * 60000);
    const isLive = now >= new Date(meetingDate.getTime() - 15 * 60000) && now <= endTime;
    
    if (isLive) liveMeeting = m;
    
    return {
      ...m,
      isLive,
    }
  });

  // Calculate Trial days remaining (assuming 30 days from creation)
  const createdAt = new Date(user.createdAt);
  const trialEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Mocking past meetings history for now, as we don't have enough MeetingLogs data structure ready for a real aggregation here without a lot of logic.
  // In a real scenario, we would group MeetingLogs by meetingId for this user.

  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 pb-32">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Meu Painel</h1>
          <p className="text-acro-silver-dark mt-1">Acompanhe seu desempenho e próximas reuniões.</p>
        </div>
        
        {/* Trial Status Card */}
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-acro-blue/20 bg-acro-blue/5">
          <div className="w-10 h-10 rounded-full bg-acro-blue/20 flex items-center justify-center text-acro-blue-light">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-acro-silver-dark font-medium">Período de Teste</div>
            <div className="text-xl font-bold text-white">{daysRemaining} dias restantes</div>
          </div>
        </div>
      </header>

      {/* Live Now Banner */}
      {liveMeeting && (
        <div className="mb-10 w-full rounded-2xl p-[1px] bg-gradient-to-r from-red-500/50 via-acro-blue/50 to-transparent">
          <div className="w-full h-full bg-acro-dark rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12">
                <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-20 animate-ping"></span>
                <div className="relative w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500">
                  <PlayCircle className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500">Ao Vivo Agora</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{liveMeeting.title}</h3>
              </div>
            </div>
            <Link 
              href={`/reuniao/${liveMeeting.zoomMeetingId || liveMeeting.id}`}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] flex items-center gap-2 w-full md:w-auto justify-center"
            >
              Entrar na Sala
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Next Meetings */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-acro-blue-light" />
            <h2 className="text-xl font-semibold text-white">Próximas Reuniões</h2>
          </div>
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-acro-silver-dark text-sm">
                Nenhuma reunião agendada no momento.
              </div>
            ) : (
              meetings.filter(m => !m.isLive).map((m) => (
                <div key={m.id} className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-acro-blue/30 transition-colors">
                  <div>
                    <h4 className="font-semibold text-white">{m.title}</h4>
                    <p className="text-sm text-acro-silver-dark flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5" /> 
                      {new Date(m.date).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {(() => {
                    const pwdMatch = m.zoomLink?.match(/pwd=([^&]+)/);
                    const pwd = pwdMatch ? pwdMatch[1] : '';
                    const href = `/reuniao/${m.zoomMeetingId || m.id}${pwd ? `?pwd=${pwd}` : ''}`;
                    
                    return (
                      <Link 
                        href={href}
                        className="px-6 py-2 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_-5px_rgba(220,38,38,0.4)] flex items-center gap-2 text-sm"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        Ao Vivo
                      </Link>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Past Meetings - Hardcoded for prototype demonstration as logs need to be populated first */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-acro-silver" />
            <h2 className="text-xl font-semibold text-white">Histórico e Progresso</h2>
          </div>
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 bg-green-500 h-full"></div>
              <h4 className="font-semibold text-white">Operacional Manhã (Ontem)</h4>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-acro-silver-dark mb-1">
                  <span>Engajamento</span>
                  <span className="text-green-400">70%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-acro-silver-dark">Assistiu 42 min de 60 min</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
