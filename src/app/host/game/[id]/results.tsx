/* eslint-disable @next/next/no-img-element */
'use client'

import { GameResult, QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

export default function Results({
  quizSet,
  gameId,
}: {
  quizSet: QuizSet
  gameId: string
}) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
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
      setGameResults(data || [])
    }
    getResults()
  }, [gameId])

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <div className="h-2 w-full bg-[#5E17EB]" />
      <div className="text-center">
        <h1 className="text-3xl my-6 py-4 px-12 bg-white text-[#111827] inline-block rounded-2xl font-extrabold shadow">
          {quizSet.name}
        </h1>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-4">
          {gameResults.map((r, index) => (
            <div
              key={r.participant_id}
              className={`flex justify-between items-center bg-white text-[#111827] py-3 px-4 rounded-2xl my-3 w-full ${
                index < 3 ? 'shadow-xl font-bold' : ''
              }`}
            >
              <div className={`pr-4 ${index < 3 ? 'text-3xl' : 'text-base'}`}>
                {index + 1}
              </div>
              <div className={`flex-grow font-bold ${index < 3 ? 'text-4xl' : 'text-xl'}`}>
                {r.nickname}
              </div>
              <div className="pl-2">
                <span className="text-xl font-extrabold">{r.total_score}</span>
                <span className="ml-1">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Confetti width={width} height={height} recycle={true} />
    </div>
  )
}
