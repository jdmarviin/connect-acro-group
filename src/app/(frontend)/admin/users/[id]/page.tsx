import Link from "next/link";
import { ArrowLeft, User, Mail, MessageCircle, Clock, Calendar as CalendarIcon, Video } from "lucide-react";
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect, notFound } from "next/navigation";
import UserChart from "./UserChart";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminUserDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  
  let adminUser = null;
  const cookieHeader = headers.get('cookie') || ''
  const match = cookieHeader.match(/payload-token=([^;]+)/)
  
  if (match && match[1]) {
    try {
      const decoded = jwt.verify(match[1], process.env.PAYLOAD_SECRET!) as { id: string | number }
      adminUser = await payload.findByID({ collection: 'users', id: decoded.id })
    } catch (e) {}
  }

  if (!adminUser || adminUser.role !== 'admin') {
    redirect('/dashboard')
  }

  let leadUser;
  try {
    leadUser = await payload.findByID({
      collection: 'users',
      id: resolvedParams.id,
    });
  } catch (e) {
    notFound();
  }

  // Fetch all meeting logs for this user
  const logsReq = await payload.find({
    collection: 'meeting-logs',
    where: {
      user: { equals: leadUser.id }
    },
    limit: 5000,
    sort: '-createdAt'
  });

  // Fetch scheduled meetings to map zoomMeetingId to titles if possible
  const meetingsReq = await payload.find({
    collection: 'meetings',
    limit: 1000,
  });

  const meetingsMap = new Map();
  meetingsReq.docs.forEach(m => {
    meetingsMap.set(`${m.zoomMeetingId}_${new Date(m.date).toLocaleDateString('pt-BR')}`, m.title);
  });

  // Group logs by day
  const dailyStats = new Map<string, number>();
  
  const detailedLogs = logsReq.docs.map(log => {
    const joinTime = log.joinTime ? new Date(log.joinTime) : new Date(log.createdAt);
    const dateStr = joinTime.toLocaleDateString('pt-BR'); // Format: DD/MM/YYYY
    const duration = log.durationMinutes || 0;

    // Sum daily duration
    const currentDayDuration = dailyStats.get(dateStr) || 0;
    dailyStats.set(dateStr, currentDayDuration + duration);

    // Try to find the scheduled meeting title based on zoomMeetingId and date
    const titleKey = `${log.meetingId}_${dateStr}`;
    const meetingTitle = meetingsMap.get(titleKey) || `Reunião (${log.meetingId})`;

    return {
      id: log.id,
      meetingId: log.meetingId,
      meetingTitle,
      joinTime,
      leaveTime: log.leaveTime ? new Date(log.leaveTime) : null,
      durationMinutes: duration,
      webhookStatus: log.webhookStatus
    };
  });

  // Prepare chart data (sort by date ascending for timeline)
  // DD/MM/YYYY string sorting is tricky, so we parse it back
  const chartData = Array.from(dailyStats.entries()).map(([dateStr, duration]) => {
    const [day, month, year] = dateStr.split('/');
    return {
      date: dateStr,
      duration,
      timestamp: new Date(Number(year), Number(month) - 1, Number(day)).getTime()
    };
  }).sort((a, b) => a.timestamp - b.timestamp);

  const totalWatched = chartData.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 pb-32">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-acro-silver-dark hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </Link>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{leadUser.name || 'Usuário Sem Nome'}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-acro-silver-dark">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-acro-blue-light" /> {leadUser.email}</span>
            {leadUser.whatsapp && (
              <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-green-500" /> {leadUser.whatsapp}</span>
            )}
            <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-acro-blue-light" /> Registrado em {new Date(leadUser.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="glass-panel px-5 py-3 rounded-xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-acro-silver" />
          <div>
            <div className="text-xs font-semibold text-acro-silver-dark uppercase tracking-wider">Tempo Total</div>
            <div className="text-lg font-bold text-white">{totalWatched} minutos</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel rounded-3xl p-1">
            <div className="bg-acro-dark/50 backdrop-blur-sm rounded-[23px] h-full p-6">
              <h2 className="text-lg font-bold text-white mb-6">Evolução de Acessos</h2>
              <div className="h-[300px]">
                <UserChart data={chartData} />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Logs Column */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-1 h-full">
            <div className="bg-acro-dark/50 backdrop-blur-sm rounded-[23px] h-full p-6">
              <h2 className="text-lg font-bold text-white mb-6">Histórico de Sessões no Zoom</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-acro-silver-dark border-b border-white/10">
                      <th className="pb-3 font-semibold">Sessão / Reunião</th>
                      <th className="pb-3 font-semibold text-center">Data e Hora</th>
                      <th className="pb-3 font-semibold text-center">Saída</th>
                      <th className="pb-3 font-semibold text-right">Duração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detailedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-acro-silver-dark">Nenhum histórico de reunião encontrado.</td>
                      </tr>
                    ) : detailedLogs.map((log) => (
                      <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="font-semibold text-white">{log.meetingTitle}</div>
                          <div className="text-xs text-acro-silver-dark flex items-center gap-1 mt-0.5">
                            <Video className="w-3 h-3" /> {log.meetingId}
                          </div>
                        </td>
                        <td className="py-4 text-center text-sm text-acro-silver">
                          {log.joinTime.toLocaleDateString('pt-BR')} <br />
                          <span className="text-xs text-acro-silver-dark">{log.joinTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-4 text-center text-sm text-acro-silver">
                          {log.leaveTime ? log.leaveTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-acro-blue/20 text-acro-blue-light">
                              Ao vivo
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="font-medium text-white">{log.durationMinutes} min</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
