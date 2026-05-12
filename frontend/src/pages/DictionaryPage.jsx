import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'

function SignCard({ cls, onClick }) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <button
      onClick={() => onClick(cls)}
      className="card p-0 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-indigo-600/50 transition-all duration-200 text-left group"
    >
      <div className="aspect-square bg-gray-800 flex items-center justify-center relative overflow-hidden">
        {imgOk ? (
          <img
            src={`/python/sign/${cls.name}`}
            alt={cls.arabic}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span className="text-5xl font-black text-gray-700">{cls.arabic}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-2 right-2 text-3xl font-black text-white drop-shadow-lg">
          {cls.arabic}
        </span>
      </div>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">{cls.name}</span>
        <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
      </div>
    </button>
  )
}

function Modal({ cls, onClose }) {
  const [imgOk, setImgOk] = useState(true)

  if (!cls) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card max-w-sm w-full mx-4 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gray-800 aspect-video flex items-center justify-center overflow-hidden">
          {imgOk ? (
            <img
              src={`/python/sign/${cls.name}`}
              alt={cls.arabic}
              className="w-full h-full object-contain"
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className="text-9xl font-black text-gray-600">{cls.arabic}</span>
          )}
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="text-5xl font-black text-indigo-300 mb-1">{cls.arabic}</div>
            <div className="text-sm text-gray-400">{cls.name}</div>
          </div>
          <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function DictionaryPage() {
  const { user, logout } = useAuth()
  const [classes, setClasses]   = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/python/classes')
      .then(r => r.json())
      .then(({ classes }) => setClasses(classes))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = classes.filter(c =>
    c.arabic.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Sign Dictionary</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              All 32 Arabic sign language letters — click any card for a full view
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search (e.g. ب or bb)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600 w-52"
            />
            <Link to="/app" className="btn-secondary text-sm whitespace-nowrap">← App</Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading signs…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-600">No signs found</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map(cls => (
              <SignCard key={cls.name} cls={cls} onClick={setSelected} />
            ))}
          </div>
        )}
      </main>

      <Modal cls={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
