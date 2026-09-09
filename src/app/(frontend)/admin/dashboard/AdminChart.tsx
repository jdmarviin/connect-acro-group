"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const getStatusColor = (status: string) => {
  if (status === "quente") return "#ef4444"; // red-500
  if (status === "morno") return "#eab308"; // yellow-500
  return "#3b82f6"; // blue-500
};

export default function AdminChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-acro-silver-dark text-sm text-center pt-20">Dados insuficientes.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#B8BCC2', fontSize: 12 }} />
        <Tooltip 
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar dataKey="engagement" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
