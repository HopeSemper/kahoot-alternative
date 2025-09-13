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

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])

    const t = setTimeout(() => setHasShownChoices(true), TIME_TIL_CHOICE_REVEAL)

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `question_id=eq.${question.id}` },
        (payload) => {
          setAnswers((cur) => [...cur, payload.new as Answer])
          if ((answerStateRef.current?.length ?? 0) + 1 === participants.length) onTimeUp()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(t)
      supabase.removeChannel(channel)
    }
  }, [question.id, participants.length, gameId])

  // Durée en secondes pour le composant de timer
  const durationSec = Math.floor(QUESTION_ANSWER_TIME / 1000)

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

      {/* titre */}
      <div className="text-center">
        <h2 className="pb-4 text-2xl bg-white text-[#111827] font-bold mx-4 my-12 p-4 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
      </div>

      <div className="flex-grow text-white px-8">
        {/* timer + compteur réponses */}
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-5xl">
              <CountdownCircleTimer
                onComplete={() => onTimeUp()}
                isPlaying
                duration={durationSec} // ✅ 30 s (via constante)
                colors={['#5E17EB', '#FBBF24', '#EF4444', '#EF4444']}
                colorsTime={[
                  Math.floor(durationSec * 0.6), // 60%
                  Math.floor(durationSec * 0.25), // 25%
                  Math.floor(durationSec * 0.10), // 10%
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
        )}
      </div>

      {/* choix (aperçu host) */}
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
