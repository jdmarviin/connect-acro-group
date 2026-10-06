import PersonalRoomSync from '@/components/PersonalRoomSync'
import { formatDuration } from '@/lib/format'
import { isManager } from '@/lib/access'
import RefreshStatus from '@/components/RefreshStatus'
import { isLeadLog, belongsToMeeting } from '@/lib/reporting';
import Link from "next/link";
import { Users, Video, Activity, MessageCircle, Mail, Flame, ThermometerSun, Snowflake, ChevronRight, Calendar, Play } from "lucide-react";
import { getData } from '@/lib/data'
import { currentUser } from '@/lib/auth'
import { trialEndsAt } from '@/lib/access'
import { redirect } from "next/navigation";
import AdminChart from "./AdminChart"; // Client component wrapper for Recharts

const getStatusColor = (status: string) => {
  if (status === "quente") return "#ef4444"; // red-500
  if (status === "morno") return "#eab308"; // yellow-500
  return "#3b82f6"; // blue-500
};

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ zoom?: string }> }) {
  const { zoom } = await searchParams;
  const adminUser = await currentUser();

  if (!adminUser || !isManager(adminUser)) {
    redirect('/dashboard') // Redirect non-admins
  }
  const db = await getData()

  // Independent reads run concurrently; each keeps its own RLS transaction.
  const [leadsReq, meetingsReq, logsReq] = await Promise.all([db.find({
    collection: 'users',
    where: {
      role: { equals: 'user' }
    },
    pagination: false,
  }), db.find({
    collection: 'meetings',
    sort: '-date',
    pagination: false,
  }), db.find({
    collection: 'meeting-logs',
    pagination: false,
    depth: 1,
  })]);

  const now = new Date();
  const leadLogs = logsReq.docs.filter(isLeadLog);
  const durationByUser = new Map<string, number>();
  for (const log of leadLogs) {
    const id = typeof log.user === 'object' && log.user ? log.user.id : log.user;
    if (id != null) durationByUser.set(String(id), (durationByUser.get(String(id)) || 0) + (log.durationMinutes || 0));
  }

  const rankedLeads = leadsReq.docs.map(lead => {
    // Determine days remaining
    const trialEnd = new Date(trialEndsAt(lead));
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate real engagement from logs
    const totalDuration = durationByUser.get(String(lead.id)) || 0;
    // Let's say 10 hours (600 mins) is 100% engagement
    const engagement = Math.min(100, Math.round((totalDuration / 600) * 100));
    
    let status = "frio";
    if (totalDuration >= 420) status = "quente";
    else if (totalDuration >= 180) status = "morno";

    return {
      id: lead.id,
      name: lead.name,
      whatsapp: lead.whatsapp || '',
      email: lead.email,
      daysRemaining,
      engagement,
      totalDuration,
      status
    }
  }).sort((a, b) => b.totalDuration - a.totalDuration);

  const processedMeetings = meetingsReq.docs.map(meeting => {
    const meetingDate = meeting.date ? new Date(meeting.date) : null;

    // Find logs for this meeting's zoom ID on this specific day
    const meetingLogs = leadLogs.filter(log => {
      return belongsToMeeting(log, meeting);
    });

    // Count unique users
    const uniqueUsers = new Set(meetingLogs.map(l => {
      return typeof l.user === 'object' && l.user ? l.user.id : l.user;
    }).filter(Boolean)).size;

    return {
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      kind: meeting.kind,
      date: meetingDate,
      uniqueUsers,
      zoomMeetingId: meeting.zoomMeetingId,
      zoomLink: meeting.zoomLink,
      durationMinutes: meeting.durationMinutes || 60
    };
  });

  processedMeetings.sort((a, b) => Number(b.kind === 'personal') - Number(a.kind === 'personal'));

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-32">
      <RefreshStatus />
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Painel Comercial</h1>
        <p className="text-acro-silver-dark mt-1">Visão geral do engajamento dos leads no período gratuito.</p>
      </header>

      <div className="mb-8 flex flex-wrap gap-6"><Link className="bg-acro-blue text-white px-5 py-3 rounded-xl" href="/admin/meetings/new">Criar reunião</Link><a className="underline" href="/api/auth/zoom">Conectar Zoom</a><Link className="underline" href="/admin/usuarios">Gerenciar usuários</Link><PersonalRoomSync /></div>
      {zoom === 'personal-room-error' && <p role="alert" className="text-amber-300 mb-6">O login foi concluído, mas a sala pessoal não pôde ser sincronizada. Confira as permissões do aplicativo Zoom e use o botão de sincronização.</p>}
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-acro-silver-dark">Leads Ativos (Trial)</div>
            <div className="text-2xl font-bold text-white">{rankedLeads.filter(lead => lead.daysRemaining > 0).length}</div>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-acro-silver-dark">Reuniões (Total)</div>
            <div className="text-2xl font-bold text-white">{processedMeetings.length}</div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden border-acro-blue/30">
          <div className="absolute right-0 top-0 w-32 h-32 bg-acro-blue/10 blur-2xl rounded-full" />
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-acro-silver-dark">Engajamento Médio</div>
            <div className="text-2xl font-bold text-white">
              {rankedLeads.length > 0 ? Math.round(rankedLeads.reduce((acc, l) => acc + l.engagement, 0) / rankedLeads.length) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Meetings List */}
        <div className="glass-panel rounded-3xl p-1">
          <div className="bg-acro-dark/50 backdrop-blur-sm rounded-[23px] h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-acro-blue-light" />
                Reuniões e histórico de chamadas
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-acro-silver-dark border-b border-white/10">
                    <th className="pb-3 font-semibold">Título</th>
                    <th className="pb-3 font-semibold text-center">Data</th>
                    <th className="pb-3 font-semibold text-center">Duração</th>
                    <th className="pb-3 font-semibold text-center">Participantes</th>
                    <th className="pb-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedMeetings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-acro-silver-dark">Nenhuma reunião encontrada.</td>
                    </tr>
                  ) : processedMeetings.map((meeting) => (
                    <tr key={meeting.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <div className="font-semibold text-white">{meeting.title}</div>
                        <div className={`text-xs ${meeting.status === 'live' ? 'text-red-500 font-bold' : 'text-acro-silver-dark'}`}>{meeting.status === "live" ? "Ao vivo" : meeting.status === "ended" ? "Encerrada" : "Agendada"}</div>
                      </td>
                      <td className="py-4 text-center text-sm text-acro-silver">
                        {meeting.date ? meeting.date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Recorrente · sem data fixa'}
                      </td>
                      <td className="py-4 text-center text-sm text-acro-silver">
                        {formatDuration(meeting.durationMinutes)}
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-acro-blue/10 text-acro-blue-light font-bold">
                          <Users className="w-4 h-4" />
                          {meeting.uniqueUsers}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {meeting.status !== 'ended' && meeting.kind !== 'occurrence' && <Link href={`/reuniao/${meeting.zoomMeetingId}`} className="inline-flex items-center p-2 text-green-500" title="Iniciar reunião no sistema"><Play className="w-4 h-4" /></Link>}
                          <Link href={`/admin/meetings/${meeting.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-acro-blue/10 text-sm font-medium text-acro-blue-light hover:bg-acro-blue hover:text-white transition-colors">
                            Relatório <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Ranking List */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-1">
          <div className="bg-acro-dark/50 backdrop-blur-sm rounded-[23px] h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Ranking de Interesse</h2>
              <span className="text-xs font-medium bg-white/10 text-acro-silver px-3 py-1 rounded-full">Prioridade</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-acro-silver-dark border-b border-white/10">
                    <th className="pb-3 font-semibold">Lead</th>
                    <th className="pb-3 font-semibold text-center">Score</th>
                    <th className="pb-3 font-semibold text-center">Tempo Assistido</th>
                    <th className="pb-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rankedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-acro-silver-dark">Nenhum participante encontrado.</td>
                    </tr>
                  ) : rankedLeads.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <div className="font-semibold text-white">{lead.name}</div>
                        <div className="text-xs text-acro-silver-dark">Restam {lead.daysRemaining} dias</div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {lead.status === "quente" && <Flame className="w-4 h-4 text-red-500" />}
                          {lead.status === "morno" && <ThermometerSun className="w-4 h-4 text-yellow-500" />}
                          {lead.status === "frio" && <Snowflake className="w-4 h-4 text-blue-500" />}
                          <span className={`text-xs font-bold uppercase
                            ${lead.status === "quente" ? "text-red-500" : lead.status === "morno" ? "text-yellow-500" : "text-blue-500"}
                          `}>
                            {lead.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="font-medium text-white">{formatDuration(lead.totalDuration)}</div>
                        <div className="w-24 h-1.5 bg-white/10 rounded-full mx-auto mt-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${lead.engagement}%`, 
                              backgroundColor: getStatusColor(lead.status) 
                            }} 
                          />
                        </div>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <Link href={`/admin/users/${lead.id}`} className="inline-block p-2 rounded-lg bg-acro-blue/10 text-acro-blue-light hover:bg-acro-blue hover:text-white transition-colors" title="Ver Relatório">
                          <Activity className="w-4 h-4" />
                        </Link>
                        {lead.whatsapp && (
                          <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" className="inline-block p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors" title="WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <a href={`mailto:${lead.email}`} className="inline-block p-2 rounded-lg bg-acro-silver/10 text-acro-silver hover:bg-acro-silver hover:text-acro-dark transition-colors" title="E-mail">
                          <Mail className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Comparativo Global</h2>
          <div className="flex-1 min-h-[300px]">
             {/* Chart is a client component to support Recharts */}
             <AdminChart data={rankedLeads} />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-acro-silver-dark leading-relaxed">
            Pontuação por tempo assistido: 600 minutos correspondem a 100%. Quente a partir de 420 minutos; morno a partir de 180 minutos.
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
