import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ── Nav ── */
const NAV_LINKS = [
  { label: 'Features',     id: 'features'     },
  { label: 'How It Works', id: 'how-it-works'  },
  { label: 'Gallery',      id: 'gallery'       },
  { label: 'About',        id: 'about'         },
]

const BG_LETTERS = ['ع','ب','ت','م','ش','ح','ل','ن','ر','ك','س','ف','ق','ه','و','ج']

/* ── Visual components (contextual, no random photos) ── */

/** Mini browser frame wrapper */
function BrowserFrame({ children, url = 'localhost:5173', className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-700/80 shadow-2xl bg-gray-900 ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800/80 border-b border-gray-700/50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <div className="flex-1 mx-3 h-4 rounded bg-gray-700/50 flex items-center px-2">
          <span className="text-xs text-gray-500">{url}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

/** Hand skeleton SVG — 21 landmark dots + finger connections */
function HandSkeleton({ className = '' }) {
  const pts = [
    [50,90],[38,75],[30,62],[24,52],[18,44],   // wrist + thumb
    [48,55],[46,38],[44,26],[42,18],            // index
    [52,53],[52,35],[52,22],[52,13],            // middle
    [57,55],[59,37],[61,24],[63,15],            // ring
    [63,58],[67,43],[70,32],[73,23],            // pinky
  ]
  const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
  ]
  const colors = { thumb:'#f97316', index:'#22c55e', middle:'#3b82f6', ring:'#a855f7', pinky:'#ec4899', palm:'#6366f1' }
  const cc = (a,b) => {
    if(a<=4||b<=4) return colors.thumb
    if(a<=8||b<=8) return colors.index
    if(a<=12||b<=12) return colors.middle
    if(a<=16||b<=16) return colors.ring
    if(a<=20||b<=20) return colors.pinky
    return colors.palm
  }
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {connections.map(([a,b],i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke={cc(a,b)} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round"/>
      ))}
      {pts.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={[4,8,12,16,20].includes(i)?2.2:1.5}
          fill={[4,8,12,16,20].includes(i)?'#fff':'#94a3b8'}/>
      ))}
    </svg>
  )
}

/** Feature card visuals */
function DetectionVisual() {
  return (
    <div className="relative w-full aspect-video bg-gray-800 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-gray-900" />
      {/* Fake webcam grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
      <div className="relative flex flex-col items-center gap-3">
        <HandSkeleton className="w-32 h-32 drop-shadow-lg" />
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
          <span className="text-2xl font-black text-indigo-300">ب</span>
          <div className="h-1.5 w-20 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-[92%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"/>
          </div>
          <span className="text-xs text-gray-400">92%</span>
        </div>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-red-400 text-xs px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE
      </div>
    </div>
  )
}

function AutocompleteVisual() {
  const words = ['بيت','باب','بنت','بحر','بلد']
  return (
    <div className="w-full aspect-video bg-gray-800 flex flex-col p-4 gap-3 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-gray-900"/>
      <div className="relative">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Translation</div>
        <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xl text-indigo-200" dir="rtl">
          ب<span className="animate-pulse border-r-2 border-indigo-400 ml-0.5"/>
        </div>
      </div>
      <div className="relative">
        <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Suggestions</div>
        <div className="flex flex-wrap gap-2">
          {words.map((w,i) => (
            <span key={w}
              className="bg-indigo-600/30 border border-indigo-600/50 text-indigo-300 px-3 py-1 rounded-lg text-sm font-medium"
              style={{opacity: 1 - i*0.12}}>
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PracticeVisual() {
  return (
    <div className="w-full aspect-video bg-gray-800 flex items-center justify-center gap-6 p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/40 to-gray-900"/>
      <div className="relative flex flex-col items-center gap-2 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Sign This</div>
        <div className="w-24 h-24 rounded-2xl bg-gray-900 border-2 border-sky-600/50 flex items-center justify-center">
          <span className="text-5xl font-black text-sky-300">م</span>
        </div>
        <div className="text-xs text-gray-500">meem</div>
      </div>
      <div className="relative flex flex-col items-center gap-2 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Detected</div>
        <div className="w-24 h-24 rounded-2xl bg-gray-900 border-2 border-green-500/50 flex items-center justify-center">
          <span className="text-5xl font-black text-green-300">م</span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
          ✓ Correct!
        </div>
      </div>
      <div className="relative flex flex-col gap-2">
        <div className="text-center">
          <div className="text-3xl font-black text-green-400">7</div>
          <div className="text-xs text-gray-500">Correct</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-gray-400">9</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  )
}

function SpeechVisual() {
  const bars = [3,6,9,7,4,8,5,9,6,3,7,5,8,4,6]
  return (
    <div className="w-full aspect-video bg-gray-800 flex flex-col items-center justify-center gap-5 p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-gray-900"/>
      <div className="relative bg-gray-900 rounded-xl px-5 py-3 font-mono text-lg text-indigo-200" dir="rtl">
        بيت كبير جميل
      </div>
      {/* Waveform */}
      <div className="relative flex items-center gap-1 h-14">
        {bars.map((h,i) => (
          <div
            key={i}
            className="w-2 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400"
            style={{height:`${h * 5}px`, opacity: 0.7 + (i%3)*0.1,
              animation:`scaleY ${0.6 + i*0.07}s ease-in-out infinite alternate`,
              animationDelay:`${i*0.06}s`, transformOrigin:'center'}}
          />
        ))}
      </div>
      <div className="relative flex items-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 text-sm font-semibold px-4 py-2 rounded-xl">
        🔊 Speaking in Arabic…
      </div>
    </div>
  )
}

/** Gallery app-screen cards */
function GalleryScreens() {
  const screens = [
    {
      title: 'Live Detection',
      wide: true,
      content: (
        <div className="flex gap-2 p-3">
          <div className="flex-1 aspect-video bg-gray-800 rounded-lg relative flex items-center justify-center overflow-hidden">
            <HandSkeleton className="w-28 h-28" />
            <div className="absolute top-2 left-2 bg-black/60 text-red-400 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"/>LIVE
            </div>
          </div>
          <div className="w-24 flex flex-col gap-1.5">
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-2xl font-black text-indigo-300">ش</div>
              <div className="h-1 bg-indigo-500 rounded-full mt-1"/>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 flex-1">
              <div className="text-xs text-gray-500 mb-1">Words</div>
              <div className="font-mono text-indigo-200 text-sm" dir="rtl">شمس</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Practice Mode',
      content: (
        <div className="p-3 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Sign This →</span><span className="text-green-400 font-bold">6 / 8</span>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div className="text-3xl font-black text-sky-300">ن</div>
            <div className="text-xs text-gray-500">nun</div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl font-black text-green-300">ن</div>
          </div>
          <div className="bg-green-500/20 text-green-400 text-xs text-center py-1 rounded-lg font-semibold">✓ Correct!</div>
        </div>
      ),
    },
    {
      title: 'Sign Dictionary',
      content: (
        <div className="p-3 grid grid-cols-4 gap-1.5">
          {['ا','ب','ت','ث','ج','ح','خ','د'].map(l => (
            <div key={l} className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-lg font-black text-indigo-300">
              {l}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Autocomplete',
      content: (
        <div className="p-3 flex flex-col gap-2">
          <div className="bg-gray-800 rounded-lg px-3 py-2 font-mono text-indigo-200 text-base" dir="rtl">
            ب<span className="border-r border-indigo-400 animate-pulse"/>
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-widest">Suggestions</div>
          <div className="flex flex-wrap gap-1">
            {['بيت','باب','بنت','بحر'].map(w => (
              <span key={w} className="bg-indigo-600/25 text-indigo-300 text-xs px-2 py-0.5 rounded-md">{w}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Hand Skeleton',
      content: (
        <div className="flex items-center justify-center p-3 h-full">
          <div className="relative w-28 h-28 bg-gray-800 rounded-xl flex items-center justify-center">
            <HandSkeleton className="w-24 h-24"/>
          </div>
          <div className="ml-3 flex flex-col gap-1 text-xs">
            {[['Thumb','#f97316'],['Index','#22c55e'],['Middle','#3b82f6'],['Ring','#a855f7'],['Pinky','#ec4899']].map(([n,c])=>(
              <div key={n} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{background:c}}/>
                <span className="text-gray-500">{n}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Text to Speech',
      content: (
        <div className="p-3 flex flex-col gap-2">
          <div className="bg-gray-800 rounded-lg px-3 py-2 font-mono text-indigo-200 text-sm" dir="rtl">بيت كبير جميل</div>
          <div className="flex gap-1.5 flex-wrap">
            {['Space','← Delete','🔊 Speak','Clear'].map(b=>(
              <span key={b} className={`text-xs px-2 py-1 rounded-md ${b==='🔊 Speak'?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400'}`}>{b}</span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[3,6,9,7,4,8,5,9,6,3,7,5].map((h,i)=>(
              <div key={i} className="w-1 rounded-full bg-emerald-500" style={{height:`${h*2}px`}}/>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {screens.map(({ title, content, wide }, i) => (
        <div
          key={title}
          className={`group hover:-translate-y-1 transition-all duration-300 ${wide ? 'md:col-span-2' : ''}`}
        >
          <BrowserFrame url={`SignEase — ${title}`} className="h-full">
            <div className="bg-gray-900 min-h-[160px] group-hover:bg-gray-800/50 transition-colors">
              {content}
            </div>
          </BrowserFrame>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled,      setScrolled]      = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen,      setMenuOpen]      = useState(false)
  const observerRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }),
      { rootMargin: '-40% 0px -55% 0px' }
    )
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* Floating Arabic letters */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {BG_LETTERS.map((l, i) => (
          <span key={i}
            className={`absolute font-black ${i % 2 === 0 ? 'animate-float' : 'animate-float2'}`}
            style={{
              color: `rgba(99,102,241,${0.03 + (i % 3) * 0.015})`,
              fontSize: `${4 + (i % 4) * 2}rem`,
              left: `${(i * 47 + 11) % 93}%`,
              top:  `${(i * 31 + 7) % 88}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >{l}</span>
        ))}
      </div>

      {/* ══ NAVBAR ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/8 shadow-xl shadow-black/30' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">

          <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/40 group-hover:shadow-indigo-600/70 transition-shadow">
              S
            </div>
            <div className="hidden sm:block leading-none">
              <div className="font-bold text-sm tracking-tight">SignEase</div>
              <div className="text-xs text-gray-500">Arabic Sign Language</div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === id ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 ml-auto">
            <Link to="/login"    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5">
              Get Started →
            </Link>
          </div>

          <button className="md:hidden ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(v => !v)}>
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-white rounded transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-white rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-white rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/8 bg-gray-950/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-left px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                {label}
              </button>
            ))}
            <div className="border-t border-white/8 mt-2 pt-3 flex gap-2">
              <Link to="/login"    className="flex-1 btn-secondary text-sm text-center py-2.5">Sign In</Link>
              <Link to="/register" className="flex-1 btn-primary  text-sm text-center py-2.5">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          <div className="flex flex-col gap-7">
            <div className="inline-flex items-center gap-2 bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3.5 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              98.5% Accuracy · 32 Arabic Signs · Real-time
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight animate-fade-up" style={{opacity:0}}>
              Read Hands.{' '}
              <br className="hidden sm:block"/>
              <span className="gradient-text animate-gradient">Build Words.</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-lg animate-fade-up animation-delay-200" style={{opacity:0}}>
              SignEase uses AI to translate Arabic sign language into text and speech — live in your browser.
              No app. No downloads. Just your hand and a camera.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up animation-delay-300" style={{opacity:0}}>
              <Link to="/register"
                className="btn-primary px-7 py-3.5 text-base shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:-translate-y-0.5">
                Join Us Today →
              </Link>
              <button onClick={() => scrollTo('how-it-works')}
                className="px-7 py-3.5 text-base font-semibold text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all hover:-translate-y-0.5">
                See How It Works
              </button>
            </div>

            <div className="flex gap-8 animate-fade-up animation-delay-400" style={{opacity:0}}>
              {[['32','Arabic Signs'],['98.5%','Accuracy'],['<1s','Response'],['54K','Images']].map(([v,l])=>(
                <div key={l}>
                  <div className="text-xl font-black gradient-text">{v}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — full app mockup */}
          <div className="hidden lg:block animate-fade-up animation-delay-200" style={{opacity:0}}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-indigo-600/15 to-violet-600/8 rounded-3xl blur-3xl" />
              <BrowserFrame url="localhost:5173 — SignEase" className="relative">
                <div className="p-4 flex gap-3 bg-gray-900">
                  {/* Webcam with real skeleton */}
                  <div className="flex-1 aspect-video bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-gray-900"/>
                    <HandSkeleton className="w-36 h-36 relative z-10"/>
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-red-400 text-xs px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE
                    </div>
                  </div>
                  {/* Side panel */}
                  <div className="w-32 flex flex-col gap-2">
                    <div className="bg-gray-800 rounded-xl p-3 text-center border border-indigo-600/30">
                      <div className="text-4xl font-black text-indigo-300 animate-float">ب</div>
                      <div className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full w-[92%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"/>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">92%</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3 flex-1 border border-gray-700/40">
                      <div className="text-xs text-gray-500 mb-2">Translation</div>
                      <div className="text-indigo-200 font-mono text-base" dir="rtl">بيت</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {['بيت','باب','بنت'].map(w=>(
                          <span key={w} className="text-xs bg-indigo-600/25 text-indigo-300 px-1.5 py-0.5 rounded-md">{w}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </BrowserFrame>
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('features')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors group">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <div className="w-5 h-8 border-2 border-gray-700 rounded-full flex items-start justify-center pt-1.5 group-hover:border-gray-500 transition-colors">
            <div className="w-1 h-2 bg-gray-600 rounded-full animate-bounce"/>
          </div>
        </button>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="relative z-10 py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">One tool. Full pipeline.</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg">
              From live sign detection to speech output — SignEase covers the complete Arabic sign language workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title:'Real-time Detection', desc:'MobileNetV2 CNN recognises 32 Arabic sign language letters live — 98.5% accuracy, trained on 54,000 images. Colour-coded hand skeleton renders on every frame.', visual:<DetectionVisual/> },
              { title:'Smart Autocomplete',  desc:'As you sign letters they stack up in real time. Intelligent word suggestions surface full Arabic words so you never have to spell everything out.', visual:<AutocompleteVisual/> },
              { title:'Practice Mode',       desc:'The app picks a random sign, shows you an example image from the dataset, and scores you in real time. Perfect for learning ArSL step by step.', visual:<PracticeVisual/> },
              { title:'Text to Speech',      desc:'Tap Speak and the full Arabic sentence is read aloud in natural pronunciation. Bridges signed and spoken language in a single tap.', visual:<SpeechVisual/> },
            ].map(({ title, desc, visual }) => (
              <div key={title} className="card overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="overflow-hidden border-b border-gray-800">
                  {visual}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="relative z-10 py-28 bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">Three steps. That's it.</h2>
          </div>

          <div className="flex flex-col gap-20">
            {[
              {
                n:'01', title:'Show Your Hand',
                desc:'Point your webcam at your hand and sign any Arabic letter. MediaPipe detects 21 hand landmarks, our CNN classifies the sign with colour-coded skeleton feedback in under a second.',
                visual: (
                  <BrowserFrame url="SignEase — Translate">
                    <div className="p-4 flex gap-3 bg-gray-900">
                      <div className="flex-1 aspect-video bg-gray-800 rounded-xl relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-gray-900"/>
                        <HandSkeleton className="w-40 h-40 relative z-10"/>
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-red-400 text-xs px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>LIVE
                        </div>
                      </div>
                      <div className="w-24 bg-gray-800 rounded-xl p-3 text-center border border-indigo-600/30">
                        <div className="text-3xl font-black text-indigo-300">ب</div>
                        <div className="h-1 bg-indigo-500 rounded-full mt-2"/>
                        <div className="text-xs text-gray-500 mt-1">92%</div>
                      </div>
                    </div>
                  </BrowserFrame>
                ),
              },
              {
                n:'02', title:'Build Words',
                desc:'Detected letters accumulate in the translation box. Intelligent autocomplete surfaces full Arabic words as you go — tap a suggestion to complete the word instantly.',
                visual: (
                  <BrowserFrame url="SignEase — Translate">
                    <div className="p-4 flex flex-col gap-3 bg-gray-900">
                      <div className="bg-gray-800 rounded-xl px-4 py-3 font-mono text-xl text-indigo-200" dir="rtl">
                        بيت كبير<span className="border-r-2 border-indigo-400 animate-pulse ml-1"/>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 uppercase tracking-widest">Suggestions</span>
                        {['كبير','كتاب','كلب','كرسي'].map(w=>(
                          <span key={w} className="bg-indigo-600/25 border border-indigo-600/30 text-indigo-300 text-sm px-3 py-1 rounded-lg">{w}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {['Space','← Delete','🔊 Speak','Clear'].map((b,i)=>(
                          <span key={b} className={`text-xs px-3 py-1.5 rounded-lg ${i===2?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400'}`}>{b}</span>
                        ))}
                      </div>
                    </div>
                  </BrowserFrame>
                ),
              },
              {
                n:'03', title:'Speak & Share',
                desc:'Tap Speak and the full Arabic sentence is read aloud using native browser TTS. Copy the text, clear and start over, or review your detection history.',
                visual: (
                  <BrowserFrame url="SignEase — Translate">
                    <div className="p-4 flex flex-col items-center gap-4 bg-gray-900">
                      <div className="bg-gray-800 rounded-xl px-6 py-3 font-mono text-xl text-indigo-200 w-full text-center" dir="rtl">
                        بيت كبير جميل
                      </div>
                      <div className="flex items-center gap-1 h-12">
                        {[2,5,8,6,3,7,4,9,5,2,6,4,8,3,5,7,4,6,3,8].map((h,i)=>(
                          <div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-300"
                            style={{height:`${h*4}px`}}/>
                        ))}
                      </div>
                      <div className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold px-5 py-2 rounded-xl">
                        🔊 Speaking in Arabic (ar-SA)…
                      </div>
                    </div>
                  </BrowserFrame>
                ),
              },
            ].map(({ n, title, desc, visual }, i) => (
              <div key={n} className={`grid lg:grid-cols-2 gap-12 items-center ${i%2===1?'[direction:rtl]':''}`}>
                <div className="relative group [direction:ltr]">
                  <div className="absolute -inset-3 bg-indigo-600/8 rounded-3xl blur-2xl group-hover:bg-indigo-600/12 transition-colors"/>
                  <div className="relative">{visual}</div>
                </div>
                <div className="flex flex-col gap-4 [direction:ltr]">
                  <div className="text-7xl font-black gradient-text opacity-20 leading-none">{n}</div>
                  <h3 className="text-3xl font-black -mt-4">{title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GALLERY ══ */}
      <section id="gallery" className="relative z-10 py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">In Action</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">Every feature, live</h2>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto">
              All six features of SignEase — rendered as real app screens.
            </p>
          </div>
          <GalleryScreens/>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" className="relative z-10 py-28 bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Visual — large hand skeleton + stats */}
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-600/8 rounded-3xl blur-3xl"/>
              <div className="relative card p-8 flex flex-col items-center gap-6">
                <HandSkeleton className="w-56 h-56"/>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[['32','Arabic Sign Classes'],['54K','Training Images'],['98.5%','Validation Accuracy'],['MobileNetV2','Model Architecture']].map(([v,l])=>(
                    <div key={l} className="bg-gray-800 rounded-xl p-3 text-center">
                      <div className="text-lg font-black gradient-text">{v}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-6">
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">About the Project</p>
              <h2 className="text-4xl font-black tracking-tight leading-tight">
                Bridging the gap for Arabic sign language speakers
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                SignEase is a graduation project that combines a fine-tuned MobileNetV2 vision model with MediaPipe hand tracking to classify 32 Arabic sign language letters in real time — all in the browser, no special hardware required.
              </p>
              <p className="text-gray-400 leading-relaxed">
                The full-stack system includes user authentication, detection history, a practice mode, and a sign dictionary — making it both a communication tool and a learning platform.
              </p>
              <div className="flex flex-wrap gap-2">
                {['React 18','Laravel 12','Python FastAPI','MobileNetV2','MediaPipe','SQLite','TailwindCSS'].map(t=>(
                  <span key={t} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-mono px-3 py-1.5 rounded-lg">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="relative z-10 py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none"/>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-8 bg-indigo-600/20 rounded-full blur-3xl"/>
            <HandSkeleton className="relative w-32 h-32 animate-float2"/>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-5">
            Start signing today.{' '}
            <span className="gradient-text">It's free.</span>
          </h2>
          <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Create a free account and translate Arabic sign language to text and speech in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="btn-primary px-10 py-4 text-lg shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:-translate-y-1">
              Join Us Today →
            </Link>
            <button onClick={() => scrollTo('features')}
              className="px-10 py-4 text-lg font-semibold text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all hover:-translate-y-0.5">
              Explore Features
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-6">Free · No credit card · Works in any modern browser</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative z-10 border-t border-white/5 py-10 bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-xs">S</div>
            <span className="font-semibold text-gray-400">SignEase</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-gray-400 transition-colors">{label}</button>
            ))}
          </div>
          <p className="text-xs text-gray-700">Arabic Sign Language Translator · Grad Project 2026</p>
        </div>
      </footer>
    </div>
  )
}
