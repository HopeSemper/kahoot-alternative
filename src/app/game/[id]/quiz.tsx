'use client'

import { useEffect, useState } from 'react'
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
    // 100svh = hauteur réelle de l'écran mobile (barres iOS/Android incluses)
    // overflow-hidden pour éviter le scroll de page
    <div
      className="min-h-[100svh] flex flex-col items-stretch bg-[#111827] text-white relative overflow-hidden"
      // on réserve un peu d'espace en bas pour ne pas cacher le contenu derrière le footer fixe
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Titre question */}
      <div className="text-center">
        <h2 className="pb-3 text-xl bg-white text-[#111827] font-bold mx-3 my-6 p-3 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
      </div>

      {/* Attente autres joueurs */}
      {!isAnswerRevealed && chosenChoice && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-white text-lg md:text-2xl text-center p-3">
            En attente des autres joueurs…
          </div>
        </div>
      )}

      {/* Compte à rebours avant affichage des choix */}
      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex-grow text-transparent flex justify-center items-start pt-2">
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

      {/* Choix + Chrono 30s */}
      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex-grow flex flex-col items-center">
          {/* Chrono compact */}
          <div className="mb-3">
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
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </div>

          {/* Grille des choix — texte multi-ligne + hauteur auto pour éviter la coupure */}
          <div className="w-full flex justify-between flex-wrap p-2 gap-y-2 max-w-3xl">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1">
                <button
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`px-3 py-4 w-full text-lg md:text-2xl md:font-bold rounded text-white flex items-center justify-between gap-2
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
                  {/* wrap propre + coupure possible sur mots longs */}
                  <div className="whitespace-normal break-words leading-snug text-left">
                    {choice.body}
                  </div>
                  {isAnswerRevealed && <div>{choice.is_correct ? '✔️' : '❌'}</div>}
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
            {chosenChoice?.is_correct ? '✔️' : '❌'}
          </div>
        </div>
      )}

      {/* Footer progression — FIXE + safe area iOS */}
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
