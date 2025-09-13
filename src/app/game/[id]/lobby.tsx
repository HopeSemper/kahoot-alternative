'use client'

import { Participant, supabase } from '@/types/types'
import { FormEvent, useState } from 'react'

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

    setParticipant(data as Participant)
    onRegisterCompleted(data as Participant)
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
