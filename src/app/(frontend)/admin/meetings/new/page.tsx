"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Calendar, Link as LinkIcon, Bell, MessageCircle, Mail, Smartphone } from "lucide-react";
import { createMeetingAction } from "./actions";

export default function ScheduleMeeting() {
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    formData.append('notify', notify ? 'on' : 'off');
    try {
      await createMeetingAction(formData);
    } catch {
      alert("Erro ao criar reunião");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-32">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-acro-silver-dark hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Agendar Reunião</h1>
        <p className="text-acro-silver-dark mt-1">Crie uma nova sala para transmissão ao vivo via Zoom.</p>
      </header>

      <form action={handleSubmit} className="glass-panel p-8 rounded-3xl space-y-8">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-acro-silver">Título da Reunião</label>
            <input 
              type="text" 
              name="title"
              required
              placeholder="Ex: Operacional Abertura - Índice" 
              className="w-full bg-acro-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-acro-blue/50 focus:ring-1 focus:ring-acro-blue/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-acro-silver">Data</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="date" 
                  name="date"
                  required
                  className="w-full bg-acro-dark/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-acro-blue/50 focus:ring-1 focus:ring-acro-blue/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-acro-silver">Horário</label>
              <div className="relative">
                <input 
                  type="time" 
                  name="time"
                  required
                  className="w-full bg-acro-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-acro-blue/50 focus:ring-1 focus:ring-acro-blue/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-acro-silver">Link do Zoom</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="url" 
                name="zoomLink"
                placeholder="https://zoom.us/j/123456789 (Deixe em branco para gerar automaticamente)" 
                className="w-full bg-acro-dark/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-acro-blue/50 focus:ring-1 focus:ring-acro-blue/50 transition-all"
              />
            </div>
            <p className="text-xs text-acro-silver-dark mt-1">Se não preenchido, o sistema criará uma sala Zoom automaticamente.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-acro-blue-light" />
                Notificar participantes ativos
              </h3>
              <p className="text-sm text-acro-silver-dark mt-1">
                Dispara um aviso para a base de usuários que estão dentro do período de Trial.
              </p>
              
              <div className={`flex items-center gap-4 mt-4 transition-opacity ${notify ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                <div className="flex items-center gap-1.5 text-xs font-medium text-acro-silver bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Smartphone className="w-3.5 h-3.5" /> Push Sistema
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-acro-silver bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <MessageCircle className="w-3.5 h-3.5 text-green-400" /> WhatsApp
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-acro-silver bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> E-mail
                </div>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setNotify(!notify)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notify ? 'bg-acro-blue' : 'bg-white/20'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notify ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3.5 bg-acro-blue hover:bg-acro-blue-light text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(27,84,214,0.5)] disabled:opacity-50"
          >
            {loading ? 'Agendando...' : 'Salvar e Agendar'}
          </button>
        </div>

      </form>
    </div>
  );
}
