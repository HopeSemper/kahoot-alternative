'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Choice, Game, Participant, Question, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

const POLL_MS = 7000 // filet de sécurité: polling toutes les 7s pendant la partie

export default function GamePlayerPage({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  // --- état principal joueur ---
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.lobby)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  // refs pour accès stable
  const participantRef = useRef<Participant | null>(null)
  const lastRealtimeAt = useRef<number>(Date.now())
  const channelRef = useRef<RealtimeChannel | null>(null)
  participantRef.current = participant

  // callback depuis le Lobby quand le joueur est inscrit
  const onRegisterCompleted = (p: Participant) => {
    setParticipant(p)
    void fetchGame()
  }

  // --- data fetching ---
  const fetchQuestions = useCallback(async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, choices(*)`)
      .eq('quiz_set_id', quizSetId)
      .order('order', { ascending: true })

    if (error) {
      console.error('Erreur chargement questions:', error.message)
      return
    }
    setQuestions(data || [])
  }, [])

  const fetchGame = useCallback(async () => {
    const { data: game, error } = await supabase
      .from('games')
      .select()
      .eq('id', gameId)
      .single()

    if (error) {
      console.error('Erreur fetch game:', error.message)
      return
    }
    if (!game) return

    // maj écran/états
    setCurrentScreen(game.phase as Screens)
    if (game.phase === Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    // charger questions si nécessaire
    if (!questions) {
      await fetchQuestions(game.quiz_set_id)
    }
  }, [gameId, fetchQuestions, questions])

  // initial fetch au montage
  useEffect(() => {
    void fetchGame()
  }, [fetchGame])

  // abonnement realtime aux mises à jour du jeu
  useEffect(() => {
    // nettoie l'ancien channel si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('game_participant')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          lastRealtimeAt.current = Date.now()
          if (!participantRef.current) return

          const game = payload.new as Game
          if (game.phase === 'result') {
            setCurrentScreen(Screens.results)
          } else {
            setCurrentScreen(Screens.quiz)
            setCurrentQuestionSequence(game.current_question_sequence)
            setIsAnswerRevealed(game.is_answer_revealed)
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [gameId])

  // ✅ re-sync quand l’onglet revient actif, ou réseau revient, ou focus
  useEffect(() => {
    const resync = () => void fetchGame()

    const onVisibility = () => {
      if (!document.hidden) resync()
    }
    const onFocus = () => resync()
    const onOnline = () => resync()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
    }
  }, [fetchGame])

  // 🔁 Polling filet de sécurité pendant la partie (et résultats)
  useEffect(() => {
    if (currentScreen === Screens.lobby) return

    const id = setInterval(() => {
      // si on n’a pas reçu d’event realtime récemment, on force une resync
      const elapsed = Date.now() - lastRealtimeAt.current
      if (elapsed > POLL_MS * 1.2) {
        void fetchGame()
      }
    }, POLL_MS)

    return () => clearInterval(id)
  }, [currentScreen, fetchGame])

  return (
    <main className="min-h-screen bg-[#111827] text-white">
      {/* bandeau violet style Kahoot */}
      <div className="h-2 w-full bg-[#5E17EB]" />

      {currentScreen === Screens.lobby && (
        <section className="flex items-center justify-center min-h-[calc(100vh-0.5rem)] p-6">
          <div className="w-full max-w-2xl bg-white text-[#111827] rounded-2xl shadow-2xl p-6">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
              Rejoins la partie
            </h1>
            <p className="text-[#4B5563] mb-4">
              Entre ton pseudo pour participer au quiz. L’animateur contrôle le rythme des questions.
            </p>
            <Lobby onRegisterCompleted={onRegisterCompleted} gameId={gameId} />
          </div>
        </section>
      )}

      {currentScreen === Screens.quiz && questions && participant && (
        <section className="min-h-[calc(100vh-0.5rem)] p-4 md:p-8">
          <Quiz
            question={questions[currentQuestionSequence]}
            questionCount={questions.length}
            participantId={participant.id}
            isAnswerRevealed={isAnswerRevealed}
          />
        </section>
      )}

      {currentScreen === Screens.results && participant && (
        <Results participant={participant} />
      )}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-0.5rem)] text-center p-6">
      <div className="p-8 bg-white text-[#111827] rounded-2xl shadow-2xl">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
          Bravo, {participant.nickname} 🎉
        </h2>
        <p className="text-[#4B5563]">Merci d’avoir joué !</p>
      </div>
    </div>
  )
}
