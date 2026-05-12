export default function SignDisplay({ sign, confidence, isLoading }) {
  const pct = Math.round((confidence || 0) * 100)
  const barColor = pct > 75 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="card p-6 flex flex-col items-center gap-4">
      <p className="text-xs uppercase tracking-widest text-gray-500">Detected Sign</p>

      <div className="w-28 h-28 rounded-2xl bg-gray-800 border-2 border-indigo-600/40 flex items-center justify-center">
        {isLoading ? (
          <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : sign ? (
          <span className="text-6xl font-black text-indigo-300">{sign}</span>
        ) : (
          <span className="text-3xl text-gray-600">?</span>
        )}
      </div>

      {sign && !isLoading && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Confidence</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {!sign && !isLoading && (
        <p className="text-gray-600 text-sm">Show a hand to the camera</p>
      )}
    </div>
  )
}
