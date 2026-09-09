import Header from "@/components/Header";

export default function ReuniaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
