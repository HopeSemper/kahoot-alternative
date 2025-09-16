'use client'

import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer, ColorFormat } from 'react-countdown-circle-timer'
import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question, supabase } from '@/types/types'

export default function Quiz({
  question,
  questionCount,
  participantId,
  isAnswerRevealed,
}: {
  question: Question
  questionCount: number
  participantId: string
  isAnswerRevealed: boolean
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)
  const [hasShownChoices, setHasShownChoices] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Laisse le scroll, mais force l'arrivée tout en haut à chaque question
  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
    // top du conteneur
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [question.id])

  const answer = async (choice: Choice) => {
    setChosenChoice(choice)
    const now = Date.now()
    const score = !choice.is_correct
      ? 0
      : 1000 -
        Math.round(
          Math.max(0, Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)) * 1000
        )
    const { error } = await supabase.from('answers').insert({
      participant_id: participantId,
      question_id: question.id,
      choice_id: choice.id,
      score,
    })
    if (error) {
      setChosenChoice(null)
      console.error(error)
      alert("Désolé, on n'a pas pu enregistrer ta réponse.")
    }
  }

  const durationSec = Math.floor(QUESTION_ANSWER_TIME / 1000)

  return (
    // On autorise le scroll ici, avec padding pour ne pas masquer par le footer fixe
    <div
      ref={scrollRef}
      className="min-h-[100svh] flex flex-col bg-[#111827] text-white relative overflow-y-auto overscroll-contain"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        scrollBehavior: 'auto',
      }}
    >
      {/* Titre (compact) */}
      <div className="text-center px-3">
        <h2 className="pb-2 text-xl bg-white text-[#111827] font-bold my-2 p-3 rounded inline-block md:text-3xl md:px-24 max-w-[920px] w-full">
          {question.body}
        </h2>
      </div>

      {/* Avant l’affichage des choix */}
      {!hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex justify-center pt-1">
          <CountdownCircleTimer
            onComplete={() => {
              setHasShownChoices(true)
              setQuestionStartTime(Date.now())
            }}
            isPlaying
            duration={TIME_TIL_CHOICE_REVEAL / 1000}
            colors={['#ffffff', '#ffffff', '#ffffff', '#ffffff']}
            trailColor={'transparent' as ColorFormat}
            colorsTime={[7, 5, 2, 0]}
            size={170}        // ⬅️ plus compact
            strokeWidth={10}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )}

      {/* Choix + chrono */}
      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex flex-col items-center">
          <div className="mt-2 mb-3">
            <CountdownCircleTimer
              isPlaying
              duration={durationSec}
              colors={['#5E17EB', '#FBBF24', '#EF4444', '#EF4444']}
              colorsTime={[
                Math.floor(durationSec * 0.6),
                Math.floor(durationSec * 0.25),
                Math.floor(durationSec * 0.1),
                0,
              ]}
              onComplete={() => undefined}
              size={170}       // ⬅️ plus compact
              strokeWidth={10}
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </div>

          <div className="w-full max-w-3xl flex justify-between flex-wrap p-2 gap-y-2">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1">
                <button
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`px-3 py-4 w-full text-lg md:text-2xl md:font-bold rounded text-white flex items-center justify-between gap-2
                    ${
                      index === 0 ? 'bg-red-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-yellow-500 text-black' : 'bg-green-500'
                    }
                    ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
                  `}
                >
                  <div className="whitespace-normal break-words leading-snug text-left">
                    {choice.body}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultat */}
      {isAnswerRevealed && (
        <div className="flex-1 w-full flex justify-center items-center flex-col px-3">
          <h2 className="text-2xl text-center pb-2">
            {chosenChoice?.is_correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </h2>
          <div className={`text-white rounded-full p-4 ${chosenChoice?.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
            {chosenChoice?.is_correct ? '✔️' : '❌'}
          </div>
        </div>
      )}

      {/* Footer progression — fixe */}
      <div
        className="fixed left-0 right-0 bottom-0 z-30 bg-black/80 text-white backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      >
        <div className="py-2 px-4 text-center">
          <span className="text-2xl">
            {question.order + 1}/{questionCount}
          </span>
        </div>
      </div>
    </div>
  )
}
