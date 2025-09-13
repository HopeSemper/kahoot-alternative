'use client'

import { QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'

export default function HostDashboard() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([])

  useEffect(() => {
    const getQuizSets = async () => {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .order('created_at', { ascending: false })
      if (error) {
        console.error(error)
        alert("Échec du chargement des quiz")
        return
      }
      setQuizSet(data || [])
    }
    getQuizSets()
  }, [])

  const startGame = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('games')
      .insert({ quiz_set_id: quizSetId })
      .select()
      .single()
    if (error) {
      console.error(error)
      alert("Impossible de démarrer la partie")
      return
    }
    const gameId = data.id
    window.open(`/host/game/${gameId}`, '_blank', 'noopener,noreferrer')
  }

  if (!quizSet.length) {
    return (
      <div className="text-center text-[#6B7280]">
        Aucun quiz pour l’instant. Ajoute un set et reviens ici.
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {quizSet.map((qs) => (
        <div key={qs.id} className="bg-white rounded-2xl shadow p-4 flex">
          <img className="h-28 w-28 rounded-lg object-cover mr-4" src="/default.png" alt="quiz" />
          <div className="flex flex-col justify-between flex-grow">
            <div>
              <h2 className="font-extrabold text-lg text-[#111827]">{qs.name}</h2>
              <div className="text-[#6B7280]">{qs.questions.length} questions</div>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-[#5E17EB] text-white py-2 px-4 rounded-xl font-semibold hover:opacity-90"
                onClick={() => startGame(qs.id)}
              >
                Démarrer
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
