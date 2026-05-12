import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const IconHand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-indigo-400">
    <path d="M9 11V7a1 1 0 0 1 2 0v4m0-4V5a1 1 0 0 1 2 0v2m0-1V5a1 1 0 0 1 2 0v5m0-3a1 1 0 0 1 2 0v4c0 3.314-2.686 6-6 6H9a5 5 0 0 1-5-5v-2.5a1 1 0 0 1 2 0" />
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
    <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
  </svg>
)

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/app')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})[0]?.[0] ||
        'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-gray-900 to-violet-950 flex-col items-center justify-center p-16">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl" />

        {['ع','ب','ت','م','ش','ح','ل','ن'].map((l, i) => (
          <span key={i}
            className={`absolute font-black select-none ${i % 2 === 0 ? 'animate-float' : 'animate-float2'}`}
            style={{
              color: `rgba(165,180,252,${0.05 + (i % 3) * 0.04})`,
              fontSize: `${3 + (i % 3) * 1.5}rem`,
              left: `${(i * 53 + 10) % 80}%`,
              top:  `${(i * 37 + 15) % 80}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          >{l}</span>
        ))}

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="w-20 h-20 bg-indigo-600/15 border border-indigo-600/30 rounded-3xl flex items-center justify-center animate-glow-pulse">
            <IconHand />
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tight mb-3">
              Welcome back to{' '}
              <span className="gradient-text">SignEase</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xs">
              Translate Arabic sign language to text and speech — live in your browser.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {[['32','Signs'],['98.5%','Accuracy'],['<1s','Speed']].map(([v, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-lg font-black gradient-text">{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              S
            </div>
            <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">SignEase</span>
          </Link>

          <h1 className="text-3xl font-black tracking-tight mb-1">Sign in</h1>
          <p className="text-gray-500 mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one free →
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <IconAlert /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Email address</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder-gray-600 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-medium">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold rounded-xl mt-1 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                : 'Sign in →'
              }
            </button>
          </form>

          <p className="text-xs text-gray-700 text-center mt-8">
            SignEase · Arabic Sign Language Translator · 2026
          </p>
        </div>
      </div>
    </div>
  )
}
