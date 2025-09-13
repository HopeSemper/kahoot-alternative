'use client'

import { TIME_TIL_CHOICE_REVEAL, QUESTION_ANSWER_TIME } from '@/constants'
import { Answer, Participant, Question, supabase } from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question,
  questionCount,
  gameId,
  participants,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [hasShownChoices, setHasShownChoices] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const answerStateRef = useRef<Answer[]>()
  answerStateRef.current = answers

  // Classement provisoire (TOP 10) cumulé après révélation (via vue game_results)
  const [leaderboard, setLeaderboard] = useState<
    { participant_id: string; nickname: string; total_score: number }[]
  >([])
  const [lbLoading, setLbLoading] = useState(false)

  const durationSec = Math.floor(QUESTION_ANSWER_TIME / 1000)

  const getNextQuestion = async () => {
    const isLast = questionCount === question.order + 1
    const updateData = isLast
      ? { phase: 'result' }
      : { current_question_sequence: question.order + 1, is_answer_revealed: false }

    const { error } = await supabase.from('games').update(updateData).eq('id', gameId)
    if (error) alert(error.message)
  }

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase.from('games').update({ is_answer_revealed: true }).eq('id', gameId)
  }

  // Lecture du classement cumulé (inclut les joueurs à 0)
  const fetchLeaderboard = async () => {
    setLbLoading(true)
    const { data, error } = await supabase
      .from('game_results')
      .select()
      .eq('game_id', gameId)
      .order('total_score', { ascending: false })
      .limit(10)
    if (!error && data) setLeaderboard(data)
    setLbLoading(false)
  }

  useEffect(() => {
    // reset de la question
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])
    setLeaderboard([])

    const t = setTimeout(() => setHasShownChoices(true), TIME_TIL_CHOICE_REVEAL)

    // écoute des réponses en direct pour cette question
    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `question_id=eq.${question.id}` },
        (payload) => {
          setAnswers((cur) => [...cur, payload.new as Answer])
          // si tous les participants ont répondu, on révèle automatiquement
          if ((answerStateRef.current?.length ?? 0) + 1 === participants.length) onTimeUp()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(t)
      supabase.removeChannel(channel)
    }
  }, [question.id, participants.length, gameId])

  // À la révélation : charger le TOP 10 cumulé
  useEffect(() => {
    if (isAnswerRevealed) {
      fetchLeaderboard()
    } else {
      setLeaderboard([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswerRevealed])

  return (
    <div className="min-h-screen flex flex-col items-stretch bg-[#111827] text-white relative">
      {/* bouton suivant */}
      <div className="absolute right-4 top-4">
        {isAnswerRevealed && (
          <button
            className="px-4 py-2 bg-[#5E17EB] text-white rounded-xl font-semibold hover:opacity-90"
            onClick={getNextQuestion}
          >
            {questionCount === question.order + 1 ? 'Voir les résultats' : 'Question suivante'}
          </button>
        )}
      </div>

      {/* Titre */}
      <div className="text-center">
        <h2 className="pb-4 text-2xl bg-white text-[#111827] font-bold mx-4 my-6 md:my-12 p-4 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
      </div>

      {/* Image (facultative) */}
      {question.image_url && (
        <div className="mx-auto my-4 max-w-4xl px-4">
          <img
            src={question.image_url}
            alt="Illustration"
            className="w-full rounded-xl shadow-lg object-cover max-h-[360px]"
          />
        </div>
      )}

      <div className="flex-grow text-white px-8">
        {/* timer + compteur réponses pendant la phase de réponse */}
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-5xl">
              <CountdownCircleTimer
                onComplete={() => onTimeUp()}
                isPlaying
                duration={durationSec}
                colors={['#5E17EB', '#FBBF24', '#EF4444', '#EF4444']}
                colorsTime={[
                  Math.floor(durationSec * 0.6),
                  Math.floor(durationSec * 0.25),
                  Math.floor(durationSec * 0.10),
                  0,
                ]}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold">{answers.length}</div>
              <div className="text-xl">réponses</div>
            </div>
          </div>
        )}

        {/* histogramme à la révélation */}
        {isAnswerRevealed && (
          <>
            <div className="flex justify-center">
              {question.choices.map((choice, index) => {
                const count = answers.filter((a) => a.choice_id === choice.id).length
                const pct = (count * 100) / (answers.length || 1)
                const color =
                  index === 0 ? 'bg-red-500' :
                  index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-yellow-500' : 'bg-green-500'
                return (
                  <div key={choice.id} className="mx-2 h-48 w-24 flex flex-col items-stretch justify-end">
                    <div className="flex-grow relative">
                      <div style={{ height: `${pct}%` }} className={`absolute bottom-0 left-0 right-0 mb-1 rounded-t ${color}`} />
                    </div>
                    <div className={`mt-1 text-white text-lg text-center py-2 rounded-b ${color}`}>
                      {count}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Classement provisoire (TOP 10) sous l’histogramme */}
            <div className="mt-8 w-full max-w-2xl mx-auto">
              <h3 className="text-center text-xl font-bold mb-3">
                Classement (cumul après cette question)
              </h3>

              {lbLoading ? (
                <div className="text-center text-white/70">Mise à jour du classement…</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center text-white/70">Aucune réponse encore.</div>
              ) : (
                <>
                  {/* Podium top 3 */}
                  <div className="flex items-end justify-center gap-4 mb-6">
                    {leaderboard.slice(0, 3).map((r, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                      const height = idx === 0 ? 'h-28' : idx === 1 ? 'h-24' : 'h-20'
                      return (
                        <div key={r.participant_id} className="flex flex-col items-center text-white">
                          <div className={`w-28 ${height} bg-white/10 backdrop-blur rounded-t-2xl flex items-center justify-center text-2xl font-bold`}>
                            {medal}
                          </div>
                          <div className="w-28 bg-white/15 rounded-b-2xl text-center py-2">
                            <div className="text-sm font-semibold truncate">{r.nickname}</div>
                            <div className="text-xs">{r.total_score} pts</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 4ème+ en liste */}
                  <ul className="bg-white/10 rounded-xl divide-y divide-white/10">
                    {leaderboard.slice(3).map((r, i) => (
                      <li key={r.participant_id} className="flex justify-between px-4 py-3">
                        <span className="font-semibold">{i + 4}. {r.nickname}</span>
                        <span className="font-mono">{r.total_score} pts</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Choix (aperçu host) */}
      {hasShownChoices && (
        <div className="flex justify-between flex-wrap p-4">
          {question.choices.map((choice, index) => {
            const color =
              index === 0 ? 'bg-red-500' :
              index === 1 ? 'bg-blue-500' :
              index === 2 ? 'bg-yellow-500' : 'bg-green-500'
            return (
              <div key={choice.id} className="w-1/2 p-1">
                <div
                  className={`px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between
                  ${color} ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}`}
                >
                  <div>{choice.body}</div>
                  {isAnswerRevealed && (
                    <div>
                      {choice.is_correct ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                          viewBox="0 0 24 24" strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                          viewBox="0 0 24 24" strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* footer progression */}
      <div className="flex text-white py-2 px-4 items-center bg-black/70">
        <div className="text-2xl">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  )
}
