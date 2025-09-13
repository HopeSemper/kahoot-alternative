'use client'

import { Participant, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useMemo, useState } from 'react'

type Props = { participants: Participant[]; gameId: string }

export default function Lobby({ participants, gameId }: Props) {
  const { Canvas } = useQRCode()

  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const joinUrl = useMemo(() => `${BASE}/game/${gameId}`, [BASE, gameId])

  const [starting, setStarting] = useState(false)

  const onClickStartGame = async () => {
    try {
      setStarting(true)
      const { error } = await supabase
        .from('games')
        .update({
          phase: 'quiz',
          current_question_sequence: 0,
          is_answer_revealed: false,
        })
        .eq('id', gameId)
      if (error) {
        console.error(error)
        alert("Impossible de démarrer la partie")
      }
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-black rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Salle d’attente</h1>
          <p className="text-white/70">
            Demandez aux invités de scanner le QR ou d’aller sur{' '}
            <span className="font-semibold">{BASE.replace('https://', '')}</span>{' '}
            puis d’entrer le code affiché.
          </p>

          <button
            onClick={onClickStartGame}
            disabled={starting}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-[#5E17EB] hover:opacity-90 transition disabled:opacity-60"
          >
            {starting ? 'Démarrage…' : 'Démarrer la partie'}
          </button>

          <div className="pt-4">
            <p className="text-sm text-white/60 mb-2">
              Joueurs connectés : <span className="font-semibold">{participants.length}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span key={p.id} className="text-sm bg-white/10 px-3 py-1 rounded-full border border-white/10 text-white">
                  {p.nickname}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Canvas
            text={joinUrl}
            options={{
              errorCorrectionLevel: 'M',
              margin: 3,
              scale: 4,
              width: 520,
              color: { dark: '#000000', light: '#ffffff' },
            }}
          />
        </div>
      </div>

      <p className="text-center text-white/50 text-sm mt-4">
        Astuce : garde toujours le même domaine en Production pour éviter toute confusion.
      </p>
    </div>
  )
}
