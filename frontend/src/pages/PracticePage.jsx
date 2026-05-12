import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../context/AuthContext'
import { detectSign } from '../api/signApi'
import Header from '../components/Header'

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: 'user' }

export default function PracticePage() {
  const { user, logout } = useAuth()

  const [classes, setClasses]       = useState([])
  const [target, setTarget]         = useState(null)
  const [detected, setDetected]     = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [result, setResult]         = useState(null)  // 'correct' | 'wrong' | null
  const [score, setScore]           = useState({ correct: 0, total: 0 })
  const [isActive, setIsActive]     = useState(false)
  const [imgError, setImgError]     = useState(false)

  const webcamRef   = useRef(null)
  const intervalRef = useRef(null)
  const pendingRef  = useRef(false)

  // Load class list from Python service
  useEffect(() => {
    fetch('/python/classes')
      .then(r => r.json())
      .then(({ classes }) => {
        setClasses(classes)
        pickRandom(classes)
      })
      .catch(() => {})
  }, [])

  const pickRandom = (list = classes) => {
    if (!list.length) return
    const pick = list[Math.floor(Math.random() * list.length)]
    setTarget(pick)
    setDetected(null)
    setConfidence(0)
    setResult(null)
    setImgError(false)
    setIsActive(false)
  }

  const handleFrame = useCallback(async (img) => {
    if (pendingRef.current || result === 'correct') return
    pendingRef.current = true
    try {
      const { data } = await detectSign(img)
      if (data.detected) {
        setDetected(data.sign)
        setConfidence(data.confidence)

        if (target && data.sign === target.arabic && data.confidence >= 0.65) {
          setResult('correct')
          setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }))
          setIsActive(false)
          clearInterval(intervalRef.current)
        }
      }
    } catch {}
    finally { pendingRef.current = false }
  }, [result, target])

  // Webcam capture loop
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const img = webcamRef.current?.getScreenshot({ width: 320, height: 240 })
        if (img) handleFrame(img)
      }, 800)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, handleFrame])

  const skipTarget = () => {
    setScore(s => ({ ...s, total: s.total + 1 }))
    pickRandom()
  }

  const pct = Math.round(confidence * 100)
  const barColor = pct > 75 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Practice Mode</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sign the letter shown — get instant feedback</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-green-400">{score.correct}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">Correct</div>
            </div>
            <div className="text-gray-700 text-xl">/</div>
            <div className="text-center">
              <div className="text-2xl font-black text-gray-300">{score.total}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">Total</div>
            </div>
            <Link to="/app" className="btn-secondary text-sm">← App</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Target sign card */}
          <div className="card p-6 flex flex-col items-center gap-4">
            <p className="text-xs uppercase tracking-widest text-gray-500 self-start">Sign This Letter</p>

            {target ? (
              <>
                {/* Large Arabic letter */}
                <div className="w-32 h-32 rounded-2xl bg-gray-800 border-2 border-indigo-600/50 flex items-center justify-center">
                  <span className="text-7xl font-black text-indigo-300">{target.arabic}</span>
                </div>

                <p className="text-gray-400 text-sm">
                  Transliteration: <span className="text-white font-semibold">{target.name}</span>
                </p>

                {/* Sign example image from dataset */}
                {!imgError ? (
                  <div className="w-full rounded-xl overflow-hidden border border-gray-700 bg-gray-800 aspect-video flex items-center justify-center">
                    <img
                      src={`/python/sign/${target.name}`}
                      alt={`Sign for ${target.arabic}`}
                      className="max-h-full max-w-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-gray-700 bg-gray-800 aspect-video flex items-center justify-center text-gray-600 text-sm">
                    No example image
                  </div>
                )}

                {/* Result overlay */}
                {result === 'correct' && (
                  <div className="w-full text-center bg-green-500/20 border border-green-500/40 rounded-xl p-4 animate-fade-in">
                    <div className="text-3xl mb-1">✅</div>
                    <p className="text-green-400 font-bold">Correct!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                Loading signs...
              </div>
            )}
          </div>

          {/* Webcam + detection */}
          <div className="flex flex-col gap-4">
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={VIDEO_CONSTRAINTS}
                  className="w-full h-full object-cover"
                  mirrored
                />
                {isActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-red-400 text-xs px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </div>
                )}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-gray-400 text-sm">Camera paused</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detected sign */}
            <div className="card p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                {detected ? (
                  <span className="text-4xl font-black text-indigo-300">{detected}</span>
                ) : (
                  <span className="text-2xl text-gray-600">?</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Detected</p>
                {detected ? (
                  <>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Confidence</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm">Show your hand to the camera</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                className={`flex-1 font-semibold py-3 rounded-xl transition-all ${isActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsActive(v => !v)}
                disabled={result === 'correct'}
              >
                {isActive ? 'Pause' : 'Start Signing'}
              </button>
              <button
                className="btn-secondary px-4 py-3 rounded-xl"
                onClick={() => result === 'correct' ? pickRandom() : skipTarget()}
              >
                {result === 'correct' ? 'Next →' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
