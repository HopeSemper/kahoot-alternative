'use client'

import { useEffect, useState } from 'react'
import { Participant, QuizSet, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'
import Results from './results'

enum AdminScreens {
  lobby = 'lobby',
  quiz = 'quiz',
  result = 'result',
}

export default function HostGamePage({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(AdminScreens.lobby)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [quizSet, setQuizSet] = useState<QuizSet>()
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  useEffect(() => {
    const getQuestions = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()
      if (gameError) {
        console.error(gameError.message)
        alert('Erreur lors du chargement du jeu')
        return
      }
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .eq('id', gameData.quiz_set_id)
        .order('order', { ascending: true, referencedTable: 'questions' })
        .single()
      if (error) {
        console.error(error.message)
        getQuestions()
        return
      }
      setQuizSet(data)
    }

    const setGameListener = async () => {
      const { data } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .order('created_at')
      if (data) setParticipants(data)

      supabase
        .channel('game')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'participants', filter: `game_id=eq.${gameId}` },
          (payload) => setParticipants((cur) => [...cur, payload.new as Participant])
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
          (payload) => {
            const game = payload.new as { current_question_sequence: number; phase: string }
            setCurrentQuestionSequence(game.current_question_sequence)
            setCurrentScreen(game.phase as AdminScreens)
          }
        )
        .subscribe()

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()
      if (gameError) {
        console.error(gameError)
        alert(gameError.message)
        return
      }
      setCurrentQuestionSequence(gameData.current_question_sequence)
      setCurrentScreen(gameData.phase as AdminScreens)
    }

    getQuestions()
    setGameListener()
  }, [gameId])

  return (
    <main className="min-h-screen bg-[#111827] text-white">
      {/* bandeau violet façon Kahoot */}
      <div className="h-2 w-full bg-[#5E17EB]" />

      {currentScreen === AdminScreens.lobby && (
        <section className="min-h-[calc(100vh-0.5rem)] flex items-center justify-center p-4 md:p-8">
          <Lobby participants={participants} gameId={gameId} />
        </section>
      )}

      {currentScreen === AdminScreens.quiz && quizSet && (
        <section className="min-h-[calc(100vh-0.5rem)] p-4 md:p-8">
          <Quiz
            question={quizSet.questions![currentQuestionSequence]}
            questionCount={quizSet.questions!.length}
            gameId={gameId}
            participants={participants}
          />
        </section>
      )}

      {currentScreen === AdminScreens.result && quizSet && (
        <section className="min-h-[calc(100vh-0.5rem)] p-4 md:p-8">
          <Results participants={participants} quizSet={quizSet} gameId={gameId} />
        </section>
      )}
    </main>
  )
}
