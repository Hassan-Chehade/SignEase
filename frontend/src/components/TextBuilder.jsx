import Autocomplete from './Autocomplete'

export default function TextBuilder({ text, onAddSpace, onBackspace, onClear, onSpeak, onSelectWord }) {
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="text-xs uppercase tracking-widest text-gray-500">Translation</p>

      <div
        dir="rtl"
        className="min-h-16 bg-gray-800 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-indigo-200 break-all select-all text-right"
      >
        {text || <span className="text-gray-600 font-sans text-sm font-normal tracking-normal">ابدأ بالإشارة لبناء النص…</span>}
      </div>

      {/* Autocomplete suggestions */}
      {text && <Autocomplete text={text} onSelect={onSelectWord} />}

      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary text-sm" onClick={onAddSpace}>
          Space
        </button>
        <button className="btn-secondary text-sm" onClick={onBackspace} disabled={!text}>
          ← Delete
        </button>
        {canSpeak && (
          <button className="btn-primary text-sm" onClick={onSpeak} disabled={!text}>
            🔊 Speak
          </button>
        )}
        <button className="btn-danger text-sm ml-auto" onClick={onClear} disabled={!text}>
          Clear
        </button>
      </div>
    </div>
  )
}
