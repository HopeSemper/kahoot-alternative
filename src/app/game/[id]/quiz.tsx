{hasShownChoices && !isAnswerRevealed && (
  <div className="flex-grow flex flex-col items-center">
    {/* Chrono visuel 30s */}
    <div className="mb-4">
      <CountdownCircleTimer
        isPlaying
        duration={durationSec} // 30s via la constante
        colors={['#5E17EB', '#FBBF24', '#EF4444', '#EF4444']}
        colorsTime={[
          Math.floor(durationSec * 0.6),
          Math.floor(durationSec * 0.25),
          Math.floor(durationSec * 0.1),
          0,
        ]}
        onComplete={() => undefined} // l'Host déclenche la fin réelle
      >
        {({ remainingTime }) => remainingTime}
      </CountdownCircleTimer>
    </div>

    {/* Choix rapprochés */}
    <div className="w-full flex justify-between flex-wrap p-2 gap-y-2 max-w-3xl">
      {question.choices.map((choice, index) => (
        <div key={choice.id} className="w-1/2 p-1">
          <button
            onClick={() => answer(choice)}
            disabled={chosenChoice !== null || isAnswerRevealed}
            className={`px-4 py-5 w-full text-lg md:text-2xl md:font-bold rounded text-white flex justify-between
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
                {choice.is_correct ? '✔️' : '❌'}
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  </div>
)}
