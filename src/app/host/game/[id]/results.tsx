'use client'

import { GameResult, QuizSet, supabase } from '@/types/types'
import { useEffect, useMemo, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

type Podium = { id: string; nickname: string; total: number }

export default function Results({
  quizSet,
  gameId,
}: {
  quizSet: QuizSet
  gameId: string
}) {
  const [rows, setRows] = useState<GameResult[]>([])
  const { width, height } = useWindowSize()

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })
      if (error) {
        console.error(error)
        alert("Impossible de charger les résultats")
        return
      }
      setRows(data ?? [])
    }
    load()
  }, [gameId])

  const ranked = useMemo(
    () =>
      rows.map(r => ({
        id: r.participant_id,
        nickname: r.nickname,
        total: r.total_score ?? 0,
      })),
    [rows]
  )

  const top3 = ranked.slice(0, 3)
  const others = ranked.slice(3)

  const avatar = (name: string) =>
    `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`

  return (
    <div className="min-h-screen bg-[#111827] text-white relative overflow-hidden">
      <Confetti width={width} height={height} recycle={true} numberOfPieces={400} />
      <div className="h-2 w-full bg-[#5E17EB]" />

      <div className="text-center mt-8 mb-6">
        <h1 className="inline-block bg-white text-[#111827] font-extrabold text-2xl md:text-3xl px-8 py-4 rounded-2xl shadow-2xl">
          {quizSet.name}
        </h1>
      </div>

      {/* Podium */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          {/* 2nd */}
          <MedalCard
            place={2}
            nickname={top3[1]?.nickname}
            score={top3[1]?.total}
            color="silver"
            avatarUrl={top3[1] ? avatar(top3[1].nickname) : undefined}
            height="h-56"
          />
          {/* 1st */}
          <MedalCard
            place={1}
            nickname={top3[0]?.nickname}
            score={top3[0]?.total}
            color="gold"
            avatarUrl={top3[0] ? avatar(top3[0].nickname) : undefined}
            height="h-64"
          />
          {/* 3rd */}
          <MedalCard
            place={3}
            nickname={top3[2]?.nickname}
            score={top3[2]?.total}
            color="bronze"
            avatarUrl={top3[2] ? avatar(top3[2].nickname) : undefined}
            height="h-48"
          />
        </div>

        {/* Classement complet */}
        {others.length > 0 && (
          <div className="mt-10 bg-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 font-semibold bg-white/10">Classement complet</div>
            <ul className="divide-y divide-white/10">
              {others.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-right">{i + 4}.</span>
                    <img src={avatar(p.nickname)} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-medium">{p.nickname}</span>
                  </div>
                  <div className="font-mono">{p.total} pts</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function MedalCard({
  place,
  nickname,
  score,
  color,
  avatarUrl,
  height,
}: {
  place: 1 | 2 | 3
  nickname?: string
  score?: number
  color: 'gold' | 'silver' | 'bronze'
  avatarUrl?: string
  height: string
}) {
  const palette =
    color === 'gold'
      ? { ring: 'ring-yellow-400', bg: 'bg-yellow-300/10', medal: '🥇' }
      : color === 'silver'
      ? { ring: 'ring-gray-300', bg: 'bg-gray-300/10', medal: '🥈' }
      : { ring: 'ring-amber-700', bg: 'bg-amber-700/10', medal: '🥉' }

  return (
    <div className={`flex flex-col items-center ${height}`}>
      <div className={`flex-1 w-full ${palette.bg} rounded-t-2xl flex items-end justify-center p-4`}>
        <div className="text-center">
          <div className="text-5xl">{palette.medal}</div>
          {avatarUrl && (
            <img
              src={avatarUrl}
              className={`w-20 h-20 rounded-full ring-4 ${palette.ring} mx-auto mt-2`}
              alt=""
            />
          )}
          <div className="mt-2 font-bold text-lg truncate max-w-[14rem]">
            {nickname ?? '—'}
          </div>
          <div className="text-sm opacity-80">{score ?? 0} pts</div>
        </div>
      </div>
      <div className="w-full bg-white/10 h-6 rounded-b-2xl" />
    </div>
  )
}
