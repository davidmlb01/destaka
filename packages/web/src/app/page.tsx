export default function Home() {
  return (
    <main className="min-h-screen bg-[#14532D] flex flex-col items-center justify-center text-center px-8">
      <div className="text-[#D97706] text-6xl mb-6">✦</div>
      <h1 className="font-display font-extrabold text-white text-5xl tracking-tight mb-4">
        Desta<span className="text-[#D97706]">ka</span>
      </h1>
      <p className="text-white/60 text-lg mb-12">
        Apareça para quem precisa de você.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="bg-[#D97706] text-[#1C1917] font-bold px-6 py-3 rounded-lg hover:bg-[#F59E0B] transition-colors"
        >
          Conectar Google
        </a>
        <a
          href="/dashboard"
          className="border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
        >
          Dashboard →
        </a>
      </div>
      <p className="text-white/25 text-xs mt-16">
        Bloco 2 completo — aguardando Bloco 1 (Google Cloud + Supabase)
      </p>
    </main>
  )
}
