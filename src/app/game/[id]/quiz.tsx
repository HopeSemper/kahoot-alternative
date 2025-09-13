'use client'

import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question, supabase } from '@/types/types'
import { useState, useEffect } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

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

  // reset à chaque nouvelle question
  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
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
      // ⚠️ Si ta table `answers` a une colonne `choice_id`, garde la ligne suivante :
      // choice_id: choice.id,
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
    <div className="min-h-screen flex flex-col items-stretch bg-[#111827] text-white relative">
      {/* Titre question */}
      <div className="text-center">
        <h2 className="pb-4 text-2xl bg-white text-[#111827] font-bold mx-4 my-12 p-4 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
      </div>

      {/* Attente autres joueurs */}
      {!isAnswerRevealed && chosenChoice && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-white text-xl md:text-2xl text-center p-4">
            En attente des autres joueurs…
          </div>
        </div>
      )}

      {/* Compte à rebours avant affichage des choix */}
      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex-grow text-transparent flex justify-center">
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
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )}

      {/* Choix + Chrono de réponse 30s */}
      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex-grow flex flex-col items-stretch">
          {/* Chrono visuel 30s (affichage uniquement ; la fin réelle est pilotée par l’Host via Realtime) */}
          <div className="flex justify-center mb-6">
            <CountdownCircleTimer
              isPlaying
              duration={durationSec} // ✅ 30s via la constante
              colors={['#5E17EB', '#FBBF24', '#EF4444', '#EF4444']}
              colorsTime={[
                Math.floor(durationSec * 0.6),
                Math.floor(durationSec * 0.25),
                Math.floor(durationSec * 0.10),
                0,
              ]}
              onComplete={() => undefined}
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </div>

          <div className="flex-grow" />
          <div className="flex justify-between flex-wrap p-4 gap-y-2">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1">
                <button
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`px-4 py-6 w-full text-xl rounded text-white flex justify-between md:text-2xl md:font-bold
                    ${
                      index === 0
                        ? 'bg-red-500'
                        : index === 1
                        ? 'bg-blue-500'
                        : index === 2
                        ? 'bg-yellow-500 text-black'
                        : 'bg-green-500'
                    }
                    ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
                  `}
                >
                  <div>{choice.body}</div>
                  {isAnswerRevealed && (
                    <div>
                      {choice.is_correct ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultat de la question */}
      {isAnswerRevealed && (
        <div className="flex-grow flex justify-center items-center flex-col">
          <h2 className="text-2xl text-center pb-2">
            {chosenChoice?.is_correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </h2>
          <div
            className={`text-white rounded-full p-4 ${
              chosenChoice?.is_correct ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {chosenChoice?.is_correct ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Footer progression */}
      <div className="flex text-white py-2 px-4 items-center bg-black/70">
        <div className="text-2xl">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  )
}
