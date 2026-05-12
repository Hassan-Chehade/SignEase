import { useEffect, useState } from 'react'
import { getHistory, clearHistory } from '../api/signApi'

export default function HistoryPanel() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getHistory()
      setHistory(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    await clearHistory()
    setHistory([])
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-gray-500">Detection Log</p>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1 px-2" onClick={load} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
          {history.length > 0 && (
            <button className="btn-danger text-xs py-1 px-2" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {history.length === 0 && (
          <p className="text-gray-600 text-sm w-full text-center py-4">No detections yet</p>
        )}
        {history.map((d) => (
          <span
            key={d.id}
            className="inline-flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-lg text-sm"
            title={`${Math.round(d.confidence * 100)}% confidence`}
          >
            <span className="font-bold text-indigo-300">{d.sign}</span>
            <span className="text-gray-500 text-xs">{Math.round(d.confidence * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
