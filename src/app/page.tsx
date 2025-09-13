'use client'

import Link from 'next/link'

export default function HostHome() {
  return (
    <main className="min-h-screen bg-[#111827] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Bandeau style Kahoot */}
          <div className="bg-[#5E17EB] h-3 w-full" />

          <div className="px-8 py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#111827]">
              Espace animateur
            </h1>
            <p className="mt-3 text-[#4B5563]">
              Prépare et lance tes quiz en direct. Les joueurs rejoignent avec un code PIN
              affiché à l’écran. Expérience fluide, fun et compétitive — façon Kahoot.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/host/dashboard"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-[#5E17EB] hover:opacity-90 transition"
              >
                Démarrer / gérer une partie
              </Link>

              <Link
                href="/how-to-play"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] transition"
              >
                Comment jouer
              </Link>
            </div>

            {/* Tips rapides */}
            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              <div className="bg-[#F9FAFB] rounded-xl p-4">
                <p className="text-sm text-[#6B7280]">
                  1) Choisis un set de questions puis clique <span className="font-semibold">Démarrer</span>.
                </p>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl p-4">
                <p className="text-sm text-[#6B7280]">
                  2) Les invités scannent le QR ou entrent le <span className="font-semibold">code PIN</span>.
                </p>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl p-4">
                <p className="text-sm text-[#6B7280]">
                  3) Lance la question, révèle la bonne réponse, et surveille le <span className="font-semibold">classement</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer discret */}
        <p className="mt-6 text-center text-sm text-white/60">
          Astuce : pour éviter toute erreur, utilise toujours le même domaine lors des tests.
        </p>
      </div>
    </main>
  )
}
