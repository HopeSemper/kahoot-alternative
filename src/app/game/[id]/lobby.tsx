'use client'

import { Participant, supabase } from '@/types/types'
import { FormEvent, useEffect, useState } from 'react'

const STORAGE_KEY = 'sq-participant'

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}
function saveSaved(payload: { gameId: string; participantId: string; nickname: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)

  // Si un joueur revient sur le lobby alors qu'il est déjà inscrit : restauration automatique
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = readSaved()
      if (!saved || saved.gameId !== gameId) return

      // Vérifie que le participant existe encore
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('id', saved.participantId)
        .maybeSingle()

      if (cancelled) return

      if (data?.id) {
        const p = data as Participant
        setParticipant(p)
        onRegisterCompleted(p)
      } else {
        // Rien en base : on laisse l'écran d’inscription (page.tsx gèrera aussi la recréation si besoin)
        // On peut garder le pseudo en placeholder
        setNickname(saved.nickname ?? '')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gameId, onRegisterCompleted])

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setSending(true)

    const { data, error } = await supabase
      .from('participants')
      .insert({ nickname: nickname.trim(), game_id: gameId })
      .select()
      .single()

    setSending(false)

    if (error) {
      // Gestion simple du doublon de pseudo dans la même partie
      if (error.message?.toLowerCase().includes('duplicate')) {
        alert('Ce pseudo est déjà pris pour cette partie. Essaie un autre 😉')
        return
      }
      console.error(error)
      alert("Impossible de rejoindre la partie.")
      return
    }

    const p = data as Participant
    setParticipant(p)

    // ✅ persiste pour survivre à un refresh
    saveSaved({ gameId, participantId: p.id, nickname: p.nickname })

    onRegisterCompleted(p)
  }

  return (
    <div className="min-h-[calc(100vh-0.5rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        {!participant && (
          <>
            <h1 className="text-2xl font-extrabold text-[#111827]">Rejoindre la partie</h1>
            <p className="mt-2 text-[#6B7280]">Entre ton pseudo pour participer.</p>

            <form onSubmit={onFormSubmit} className="mt-6 space-y-3">
              <input
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E17EB]"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.currentTarget.value)}
                placeholder="Ton pseudo"
                maxLength={20}
              />
              <button
                disabled={sending}
                className="w-full rounded-xl bg-[#5E17EB] text-white font-semibold px-4 py-3 hover:opacity-90 transition disabled:opacity-60"
              >
                {sending ? 'Connexion…' : 'Rejoindre'}
              </button>
            </form>
          </>
        )}

        {participant && (
          <div className="text-[#111827]">
            <h2 className="text-xl font-extrabold">Bienvenue {participant.nickname} 🎉</h2>
            <p className="mt-2 text-[#6B7280]">
              Tu es inscrit ! Ton pseudo s’affiche sur l’écran de l’animateur.
              Attends que la partie commence.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
