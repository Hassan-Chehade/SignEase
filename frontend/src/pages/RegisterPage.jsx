import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const IconAlert = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
    <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
  </svg>
)

const IconCheck = ({ className = '' }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 ${className}`}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" />
  </svg>
)

const IconX = ({ className = '' }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 ${className}`}>
    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22z" />
  </svg>
)

const IconDetect = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5V4a1.5 1.5 0 0 1 1.5-1.5h2.5M17.5 6.5V4A1.5 1.5 0 0 0 16 2.5h-2.5M2.5 13.5V16A1.5 1.5 0 0 0 4 17.5h2.5M17.5 13.5V16a1.5 1.5 0 0 1-1.5 1.5h-2.5" />
    <circle cx="10" cy="10" r="3" strokeLinecap="round" />
  </svg>
)

const IconAcademic = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-sky-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 10 20.904a48.62 48.62 0 0 1 6.231-4.41 60.441 60.441 0 0 0-.491-6.347m-11.48 0a60.506 60.506 0 0 1 7.74-3.342M4.26 10.147A60.44 60.44 0 0 1 10 8.058m0 0a60.437 60.437 0 0 1 5.74 2.089M10 8.058V3m0 0-3 2m3-2 3 2" />
  </svg>
)

const IconBook = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-violet-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const IconSpeaker = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 8.728M16.463 8.288a5.25 5.25 0 0 1 0 3.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 10c0-.83.112-1.633.322-2.396C2.806 6.757 3.63 6.25 4.51 6.25h2.24z" />
  </svg>
)

const FEATURES = [
  { icon: <IconDetect />,  text: 'Detect 32 Arabic sign language letters' },
  { icon: <IconAcademic />,text: 'Interactive practice mode with scoring'  },
  { icon: <IconBook />,    text: 'Full sign dictionary with example images' },
  { icon: <IconSpeaker />, text: 'Arabic text-to-speech output'             },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setError(null)
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.confirm)
      navigate('/app')
    } catch (err) {
      const errors = err?.response?.data?.errors
      setError(errors
        ? Object.values(errors).flat()[0]
        : err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8)          s++
    if (/[A-Z]/.test(p))        s++
    if (/[0-9]/.test(p))        s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength]

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-950 via-gray-900 to-indigo-950 flex-col items-center justify-center p-16">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl" />

        {['م','ر','ح','ب','ا','ل','ش','ن'].map((l, i) => (
          <span key={i}
            className={`absolute font-black select-none ${i % 2 === 0 ? 'animate-float' : 'animate-float2'}`}
            style={{
              color: `rgba(196,181,253,${0.05 + (i % 3) * 0.04})`,
              fontSize: `${3 + (i % 3) * 1.5}rem`,
              left: `${(i * 61 + 8) % 80}%`,
              top:  `${(i * 43 + 10) % 80}%`,
              animationDelay: `${i * 0.9}s`,
            }}
          >{l}</span>
        ))}

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="flex gap-3">
            {['ا', 'ب', 'ج'].map((l, i) => (
              <div key={l}
                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-indigo-300">
                {l}
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tight mb-3">
              Join <span className="gradient-text">SignEase</span> today
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xs">
              Start translating, learning, and communicating with Arabic sign language — completely free.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-gray-300">
                {icon}
                {text}
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

          <h1 className="text-3xl font-black tracking-tight mb-1">Create account</h1>
          <p className="text-gray-500 mb-8">
            Already have one?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <IconAlert /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Full name</label>
              <input type="text" required value={form.name} onChange={set('name')}
                placeholder="Your name"
                className="w-full bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all"
              />
            </div>

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
                  placeholder="8+ characters"
                  className="w-full bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder-gray-600 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-medium">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-800'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Confirm password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')}
                  placeholder="••••••••"
                  className={`w-full bg-gray-900 border hover:border-gray-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-600 outline-none transition-all ${
                    form.confirm && form.password !== form.confirm
                      ? 'border-red-500/50 focus:border-red-500'
                      : form.confirm && form.password === form.confirm
                      ? 'border-green-500/50 focus:border-green-500'
                      : 'border-gray-700 focus:border-indigo-500'
                  }`}
                />
                {form.confirm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <IconCheck className="text-green-400" />
                      : <IconX className="text-red-400" />
                    }
                  </span>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold rounded-xl mt-1 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                : 'Create account →'
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
