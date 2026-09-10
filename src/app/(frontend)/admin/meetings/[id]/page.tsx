import Link from "next/link";
import { ArrowLeft, Users, Calendar, Clock, Video } from "lucide-react";
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect, notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminMeetingDetail({ params }: PageProps) {
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
    } catch {}
  }

  if (!adminUser || adminUser.role !== 'admin') {
    redirect('/dashboard')
  }

  let meeting;
  try {
    meeting = await payload.findByID({
      collection: 'meetings',
      id: resolvedParams.id,
    });
  } catch {
    notFound();
  }

  // Find logs for this meeting's zoom ID on this specific day
  const meetingDate = new Date(meeting.date);
  const startOfDay = new Date(meetingDate);
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(meetingDate);
  endOfDay.setHours(23,59,59,999);

  const logsReq = await payload.find({
    collection: 'meeting-logs',
    limit: 5000,
  });

  const relevantLogs = logsReq.docs.filter(log => {
    if (log.meetingId !== meeting.zoomMeetingId) return false;
    const joinTime = log.joinTime ? new Date(log.joinTime) : new Date(log.createdAt);
    return joinTime >= startOfDay && joinTime <= endOfDay;
  });

  // Group logs by user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userLogsMap = new Map<string, any>();
  
  relevantLogs.forEach(log => {
    const userId = typeof log.user === 'object' && log.user ? log.user.id : log.user;
    if (!userId) return;
    
    if (!userLogsMap.has(userId.toString())) {
      userLogsMap.set(userId.toString(), {
        user: typeof log.user === 'object' ? log.user : { id: userId, name: 'Desconhecido', email: 'N/A' },
        totalDuration: 0,
        logs: []
      });
    }
    
    const userEntry = userLogsMap.get(userId.toString());
    userEntry.totalDuration += (log.durationMinutes || 0);
    userEntry.logs.push(log);
  });

  const participants = Array.from(userLogsMap.values()).sort((a, b) => b.totalDuration - a.totalDuration);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 pb-32">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-acro-silver-dark hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </Link>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-acro-silver-dark">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-acro-blue-light" /> {meetingDate.toLocaleDateString('pt-BR')}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-acro-blue-light" /> {meetingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-acro-blue-light" /> Zoom ID: {meeting.zoomMeetingId || 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {(() => {
            const pwdMatch = meeting.zoomLink?.match(/pwd=([^&]+)/);
            const pwd = pwdMatch ? pwdMatch[1] : '';
            const href = `/reuniao/${meeting.zoomMeetingId || meeting.id}${pwd ? `?pwd=${pwd}` : ''}`;
            return (
              <Link href={href} className="px-5 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold flex items-center gap-2 transition-colors">
                <Video className="w-5 h-5" /> Iniciar Sala (Host)
              </Link>
            );
          })()}
          <div className="glass-panel px-5 py-3 rounded-xl flex items-center gap-3">
            <Users className="w-5 h-5 text-acro-silver" />
            <div>
              <div className="text-xs font-semibold text-acro-silver-dark uppercase tracking-wider">Total de Participantes</div>
              <div className="text-lg font-bold text-white">{participants.length} participações</div>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-panel rounded-3xl p-1">
        <div className="bg-acro-dark/50 backdrop-blur-sm rounded-[23px] h-full p-6">
          <h2 className="text-lg font-bold text-white mb-6">Lista de Presença</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-acro-silver-dark border-b border-white/10">
                  <th className="pb-3 font-semibold">Participante</th>
                  <th className="pb-3 font-semibold text-center">Acessos na Sala</th>
                  <th className="pb-3 font-semibold text-center">Tempo Total</th>
                  <th className="pb-3 font-semibold text-right">Ver Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-acro-silver-dark">Nenhum log registrado para esta reunião.</td>
                  </tr>
                ) : participants.map((p) => (
                  <tr key={p.user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-white">{p.user.name || p.user.email}</div>
                      <div className="text-xs text-acro-silver-dark">{p.user.email}</div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="inline-flex items-center justify-center bg-white/5 text-acro-silver text-xs px-2.5 py-1 rounded-md border border-white/10">
                        {p.logs.length}x entradas
                      </div>
                    </td>
                    <td className="py-4 text-center font-medium text-white">
                      {p.totalDuration} min
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/users/${p.user.id}`} className="inline-block px-3 py-1.5 rounded-lg bg-acro-blue/10 text-acro-blue-light text-sm hover:bg-acro-blue hover:text-white transition-colors">
                        Ver Relatório
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
