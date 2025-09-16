'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Game, Participant, Question, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

const POLL_MS = 7000
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

export default function GamePlayerPage({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.lobby)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const participantRef = useRef<Participant | null>(null)
  const lastRealtimeAt = useRef<number>(Date.now())
  const channelRef = useRef<RealtimeChannel | null>(null)
  participantRef.current = participant

  const onRegisterCompleted = (p: Participant) => {
    setParticipant(p)
    saveSaved({ gameId, participantId: p.id, nickname: p.nickname })
    void fetchGame()
  }

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

    setCurrentScreen(game.phase as Screens)
    if (game.phase === Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }
    if (!questions) await fetchQuestions(game.quiz_set_id)
  }, [gameId, fetchQuestions, questions])

  // Restauration auto
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = readSaved()
      if (!saved || saved.gameId !== gameId) return

      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('id', saved.participantId)
        .maybeSingle()

      if (cancelled) return

      if (data?.id) {
        const p = data as Participant
        setParticipant(p)
        saveSaved({ gameId, participantId: p.id, nickname: p.nickname ?? saved.nickname ?? 'Joueur' })
      } else {
        const nick = (saved.nickname ?? 'Joueur').slice(0, 20)
        let attemptNick = nick
        let recreated: Participant | null = null

        for (let i = 0; i < 2; i++) {
          const { data: ins, error } = await supabase
            .from('participants')
            .insert({ game_id: gameId, nickname: attemptNick })
            .select()
            .single()
          if (!error && ins?.id) { recreated = ins as Participant; break }
          attemptNick = `${nick}-${Math.floor(Math.random() * 900 + 100)}`
        }

        if (recreated) {
          setParticipant(recreated)
          saveSaved({ gameId, participantId: recreated.id, nickname: recreated.nickname })
        }
      }
      await fetchGame()
    })()
    return () => { cancelled = true }
  }, [gameId, fetchGame])

  useEffect(() => { void fetchGame() }, [fetchGame])

  // realtime
  useEffect(() => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    const channel = supabase
      .channel('game_participant')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          lastRealtimeAt.current = Date.now()
          if (!participantRef.current) return
          const game = payload.new as Game
          if (game.phase === 'result') setCurrentScreen(Screens.results)
          else {
            setCurrentScreen(Screens.quiz)
            setCurrentQuestionSequence(game.current_question_sequence)
            setIsAnswerRevealed(game.is_answer_revealed)
          }
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [gameId])

  // re-sync sur focus/online
  useEffect(() => {
    const resync = () => void fetchGame()
    const onVisibility = () => { if (!document.hidden) resync() }
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

  // Polling filet de sécu
  useEffect(() => {
    if (currentScreen === Screens.lobby) return
    const id = setInterval(() => {
      const elapsed = Date.now() - lastRealtimeAt.current
      if (elapsed > POLL_MS * 1.2) void fetchGame()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [currentScreen, fetchGame])

  return (
    <main className="min-h-screen bg-[#111827] text-white">
      <div className="h-2 w-full bg-[#5E17EB]" />
      {currentScreen === Screens.lobby && (
        <section className="flex items-center justify-center min-h-[calc(100vh-0.5rem)] p-6">
          <div className="w-full max-w-2xl bg-white text-[#111827] rounded-2xl shadow-2xl p-6">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Rejoins la partie</h1>
            <p className="text-[#4B5563] mb-4">
              Entre ton pseudo pour participer au quiz. L’animateur contrôle le rythme des questions.
            </p>
            <Lobby onRegisterCompleted={onRegisterCompleted} gameId={gameId} />
          </div>
        </section>
      )}

      {currentScreen === Screens.quiz && questions && participant && (
        // ⚠️ on autorise le scroll vertical ici
        <section className="min-h-[calc(100vh-0.5rem)] p-4 md:p-8 overflow-y-auto">
          <Quiz
            question={questions[currentQuestionSequence]}
            questionCount={questions.length}
            participantId={participant.id}
            isAnswerRevealed={isAnswerRevealed}
          />
        </section>
      )}

      {currentScreen === Screens.results && participant && <Results participant={participant} />}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-0.5rem)] text-center p-6">
      <div className="p-8 bg-white text-[#111827] rounded-2xl shadow-2xl">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Bravo, {participant.nickname} 🎉</h2>
        <p className="text-[#4B5563]">Merci d’avoir joué !</p>
      </div>
    </div>
  )
}
