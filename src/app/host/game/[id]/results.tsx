'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import useWindowSize from 'react-use/lib/useWindowSize'
import { GameResult, QuizSet, supabase } from '@/types/types'

// Charge Confetti côté client uniquement (évite des erreurs d'hydratation)
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

type DbRow = {
  game_id: string | null
  participant_id: string | null
  nickname: string | null
  total_score: number | null
}

export default function Results({
  quizSet,
  gameId,
}: {
  quizSet: QuizSet
  gameId: string
}) {
  const [rows, setRows] = useState<DbRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const { width, height } = useWindowSize()

  // Lecture sécurisée des résultats (vue game_results)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })

      if (cancelled) return
      if (error) {
        console.error('[results] fetch error:', error)
        setErr("Impossible de charger les résultats.")
        setRows([])
      } else {
        setRows(Array.isArray(data) ? (data as DbRow[]) : [])
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [gameId])

  // Sanitize pour le rendu (jamais de null dans l’UI)
  const leaderboard: GameResult[] = useMemo(() => {
    return rows
      .map((r, i) => ({
        game_id: r.game_id ?? gameId,
        participant_id: r.participant_id ?? `p-${i}`,
        nickname: (r.nickname ?? 'Joueur') as string,
        total_score: Number.isFinite(r.total_score ?? 0) ? (r.total_score as number) : 0,
      }))
      .sort((a, b) => b.total_score - a.total_score)
  }, [rows, gameId])

  // Sécurité supplémentaire : dimensions Confetti valides
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <div className="h-2 w-full bg-[#5E17EB]" />

      <div className="text-center">
        <h1 className="text-3xl my-6 py-4 px-12 bg-white text-[#111827] inline-block rounded-2xl font-extrabold shadow">
          {quizSet.name}
        </h1>
      </div>

      {/* États de chargement / erreur */}
      {loading && (
        <div className="text-center text-white/70 py-8">Chargement des résultats…</div>
      )}
      {err && !loading && (
        <div className="text-center text-red-400 py-8">{err}</div>
      )}

      {!loading && !err && (
        <>
          {/* Podium top 3 */}
          <div className="flex items-end justify-center gap-4 mb-6 px-4">
            {leaderboard.slice(0, 3).map((r, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
              const blockH = idx === 0 ? 'h-36' : idx === 1 ? 'h-32' : 'h-28'
              return (
                <div key={r.participant_id} className="flex flex-col items-center">
                  <div
                    className={`w-32 ${blockH} bg-white/10 backdrop-blur rounded-t-2xl flex items-center justify-center text-3xl font-bold`}
                    title={`${r.nickname} — ${r.total_score} pts`}
                  >
                    {medal}
                  </div>
                  <div className="w-32 bg-white/15 rounded-b-2xl text-center py-2">
                    <div className="text-sm font-semibold truncate">{r.nickname}</div>
                    <div className="text-xs">{r.total_score} pts</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Liste complète */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl px-4">
              {leaderboard.length === 0 ? (
                <div className="text-center text-white/60">
                  Personne n’a répondu pour cette partie.
                </div>
              ) : (
                <ul className="bg-white/10 rounded-xl divide-y divide-white/10">
                  {leaderboard.map((r, i) => (
                    <li
                      key={`${r.participant_id}-${i}`}
                      className={`flex justify-between items-center px-4 py-3 ${
                        i < 3 ? 'font-semibold' : ''
                      }`}
                    >
                      <span className="truncate">
                        {i + 1}. {r.nickname}
                      </span>
                      <span className="font-mono">{r.total_score} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Confettis (safe sizes) */}
          <Confetti width={safeWidth} height={safeHeight} recycle={false} numberOfPieces={400} />
        </>
      )}
    </div>
  )
}
