export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || isNaN(minutes)) return "00h00min00s";
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(h)}h${pad(m)}min${pad(s)}s`;
}
