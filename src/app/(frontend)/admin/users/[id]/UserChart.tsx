"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function UserChart({ data }: { data: { date: string, duration: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-acro-silver-dark text-sm text-center pt-20">Nenhum dado de acesso registrado.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#B8BCC2" 
          tick={{ fill: '#B8BCC2', fontSize: 12 }} 
          axisLine={false} 
          tickLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#B8BCC2" 
          tick={{ fill: '#B8BCC2', fontSize: 12 }} 
          axisLine={false} 
          tickLine={false}
          dx={-10}
          tickFormatter={(val) => `${val}m`}
        />
        <Tooltip 
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
          formatter={(value: number) => [`${value} minutos`, 'Tempo Assistido']}
          labelStyle={{ color: '#B8BCC2', marginBottom: '8px' }}
        />
        <Bar 
          dataKey="duration" 
          fill="#1B54D6" 
          radius={[4, 4, 0, 0]} 
          activeBar={{ fill: '#4E88FF' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
