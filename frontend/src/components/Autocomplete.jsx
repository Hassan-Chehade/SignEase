import { useMemo } from 'react'
import { suggestWords } from '../data/arabicWords'

export default function Autocomplete({ text, onSelect }) {
  // Suggest based on the last word being built (after last space)
  const prefix = useMemo(() => {
    const parts = text.trimEnd().split(' ')
    return parts[parts.length - 1]
  }, [text])

  const suggestions = useMemo(() => suggestWords(prefix, 6), [prefix])

  if (!suggestions.length) return null

  const handleSelect = (word) => {
    const parts = text.split(' ')
    parts[parts.length - 1] = word
    onSelect(parts.join(' ') + ' ')
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="text-xs text-gray-600 self-center mr-1 uppercase tracking-widest">Suggestions</span>
      {suggestions.map(word => (
        <button
          key={word}
          onClick={() => handleSelect(word)}
          className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-300 text-sm px-3 py-1 rounded-lg transition-all hover:-translate-y-0.5 font-medium"
        >
          {word}
        </button>
      ))}
    </div>
  )
}
