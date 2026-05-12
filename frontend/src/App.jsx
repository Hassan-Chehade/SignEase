import { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header.jsx'
import WebcamCapture from './components/WebcamCapture.jsx'
import SignDisplay from './components/SignDisplay.jsx'
import Autocomplete from './components/Autocomplete.jsx'
import { detectSign } from './api/signApi.js'
import { useAuth } from './context/AuthContext.jsx'

/* ── Icons ── */
const IconMic = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
  </svg>
)

const IconSend = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/>
  </svg>
)

const IconSpeaker = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

/* ── Chat bubble ── */
function ChatMessage({ msg }) {
  const isSigner = msg.role === 'signer'
  return (
    <div className={`flex flex-col gap-1 ${isSigner ? 'items-start' : 'items-end'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-widest ${isSigner ? 'text-indigo-400' : 'text-emerald-400'}`}>
          {isSigner ? 'Signing' : 'Doctor'}
        </span>
        <span className="text-xs text-gray-700">{msg.time}</span>
      </div>
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isSigner
          ? 'bg-indigo-600/20 border border-indigo-600/30 text-indigo-100 rounded-tl-sm'
          : 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-100 rounded-tr-sm'
      }`}
        dir={isSigner ? 'rtl' : 'auto'}
      >
        {msg.text}
      </div>
    </div>
  )
}

/* ── Main app ── */
export default function App() {
  const { user, logout } = useAuth()

  /* Mode: 'sign' = deaf person signs, 'voice' = doctor speaks */
  const [mode, setMode] = useState('sign')

  /* Conversation */
  const [messages,    setMessages]    = useState([])
  const chatEndRef = useRef(null)

  /* Sign mode state */
  const [isActive,     setIsActive]     = useState(false)
  const [currentSign,  setCurrentSign]  = useState(null)
  const [confidence,   setConfidence]   = useState(0)
  const [isLoading,    setIsLoading]    = useState(false)
  const [landmarks,    setLandmarks]    = useState([])
  const [signerText,   setSignerText]   = useState('')
  const [error,        setError]        = useState(null)
  const lastSignRef = useRef(null)
  const pendingRef  = useRef(false)

  /* Voice mode state */
  const [isListening,  setIsListening]  = useState(false)
  const [interimText,  setInterimText]  = useState('')
  const [voiceText,    setVoiceText]    = useState('')
  const recognitionRef = useRef(null)
  const voiceAccumRef  = useRef('')

  /* Scroll chat to bottom on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimText])

  /* Stop active inputs when switching mode */
  useEffect(() => {
    if (mode === 'voice') {
      setIsActive(false)
      setCurrentSign(null)
      setLandmarks([])
    } else {
      stopListening()
    }
  }, [mode])

  /* ── Sign detection ── */
  const handleFrame = useCallback(async (imageBase64) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await detectSign(imageBase64)
      setLandmarks(data.landmarks || [])
      if (data.detected && data.sign) {
        setCurrentSign(data.sign)
        setConfidence(data.confidence)
        if (data.sign !== lastSignRef.current && data.confidence > 0.6) {
          setSignerText(t => t + data.sign)
          lastSignRef.current = data.sign
          setTimeout(() => { lastSignRef.current = null }, 1500)
        }
      } else {
        setCurrentSign(null)
        setConfidence(0)
        setLandmarks([])
        lastSignRef.current = null
      }
    } catch (err) {
      setError('Detection failed')
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }, [])

  /* ── TTS helper ── */
  const speakText = (text, lang = 'ar-SA') => {
    window.speechSynthesis.cancel()
    const doSpeak = () => {
      const utt    = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const voice  = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
      if (voice) utt.voice = voice
      utt.lang = lang
      window.speechSynthesis.speak(utt)
    }
    window.speechSynthesis.getVoices().length === 0
      ? window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
      : doSpeak()
  }

  /* ── Send signed message → speak for doctor ── */
  const sendSigned = () => {
    if (!signerText.trim()) return
    const text = signerText.trim()
    setMessages(m => [...m, { id: Date.now(), role: 'signer', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    speakText(text, 'ar-SA')
    setSignerText('')
    setIsActive(false)
    lastSignRef.current = null
  }

  /* ── Voice recognition ── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Speech recognition not supported in this browser'); return }

    voiceAccumRef.current = ''
    setVoiceText('')
    setInterimText('')

    const rec = new SR()
    rec.lang             = 'ar-SA'
    rec.continuous       = true
    rec.interimResults   = true
    recognitionRef.current = rec

    rec.onresult = (e) => {
      let interim = ''
      let final   = ''
      for (const result of e.results) {
        if (result.isFinal) final   += result[0].transcript
        else                interim += result[0].transcript
      }
      if (final) {
        voiceAccumRef.current += final
        setVoiceText(voiceAccumRef.current)
      }
      setInterimText(interim)
    }

    rec.onerror = () => setIsListening(false)
    rec.onend   = () => setIsListening(false)

    rec.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }

  /* ── Send doctor voice message ── */
  const sendVoice = () => {
    const text = voiceText.trim()
    if (!text) return
    setMessages(m => [...m, { id: Date.now(), role: 'speaker', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setVoiceText('')
    setInterimText('')
    voiceAccumRef.current = ''
    stopListening()
  }

  const SR_SUPPORTED = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* ── Mode toggle ── */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode('sign')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'sign'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Language
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'voice'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Doctor Voice
            </button>
          </div>

          <p className="text-sm text-gray-600">
            {mode === 'sign'
              ? 'Sign → the app builds text → Send & Speak → doctor hears it'
              : 'Doctor speaks Arabic → text appears → deaf person reads it'}
          </p>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="flex-1 grid lg:grid-cols-5 gap-4">

          {/* ── Left: input panel (3 cols) ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* ─── SIGN MODE ─── */}
            {mode === 'sign' && (
              <>
                <WebcamCapture
                  onFrame={handleFrame}
                  isActive={isActive}
                  captureIntervalMs={900}
                  landmarks={landmarks}
                />

                <div className="flex gap-3">
                  <button
                    className={`flex-1 font-semibold py-2.5 rounded-xl transition-all ${isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => {
                      setIsActive(v => !v)
                      if (isActive) { setCurrentSign(null); setConfidence(0); setLandmarks([]) }
                    }}
                  >
                    {isActive ? 'Stop Detection' : 'Start Detection'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-2.5 text-sm">
                    {error}
                  </div>
                )}

                <SignDisplay sign={currentSign} confidence={confidence} isLoading={isLoading && isActive} />
              </>
            )}

            {/* ─── VOICE MODE ─── */}
            {mode === 'voice' && (
              <div className="card p-6 flex flex-col items-center gap-6 flex-1">
                <p className="text-xs uppercase tracking-widest text-gray-500 self-start">Doctor Voice Input</p>

                {/* Big mic button */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={!SR_SUPPORTED}
                    className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/40 scale-110'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40 hover:scale-105'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <IconMic className={`w-10 h-10 text-white ${isListening ? 'animate-pulse' : ''}`} />
                  </button>

                  <div className="text-center">
                    {isListening ? (
                      <div className="flex items-center gap-2 text-red-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Listening… speak in Arabic
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        {SR_SUPPORTED ? 'Tap to start listening' : 'Speech recognition not supported'}
                      </p>
                    )}
                  </div>

                  {/* Waveform animation while listening */}
                  {isListening && (
                    <div className="flex items-center gap-1 h-10">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i}
                          className="w-1.5 bg-emerald-500 rounded-full"
                          style={{
                            height: `${8 + Math.sin(i * 0.8) * 12}px`,
                            animation: `scaleY ${0.5 + i * 0.05}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.04}s`,
                            transformOrigin: 'center',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recognized text preview */}
                <div className="w-full flex-1 flex flex-col gap-2">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Recognized text</p>
                  <div className="min-h-24 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white leading-relaxed flex-1" dir="auto">
                    {voiceText && <span>{voiceText}</span>}
                    {interimText && <span className="text-gray-500 italic"> {interimText}</span>}
                    {!voiceText && !interimText && (
                      <span className="text-gray-600">Recognized speech will appear here…</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={sendVoice}
                    disabled={!voiceText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                  >
                    <IconSend className="w-4 h-4" />
                    Send to Screen
                  </button>
                  {voiceText && (
                    <button
                      onClick={() => { setVoiceText(''); setInterimText(''); voiceAccumRef.current = '' }}
                      className="btn-secondary px-4 py-3 rounded-xl"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: panels (2 cols) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Sign text builder (only in sign mode) */}
            {mode === 'sign' && (
              <div className="card p-4 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-widest text-gray-500">Translation</p>

                <div
                  dir="rtl"
                  className="min-h-14 bg-gray-800 rounded-xl px-4 py-3 font-mono text-lg text-indigo-200 break-all select-all text-right"
                >
                  {signerText || (
                    <span className="text-gray-600 font-sans text-sm font-normal tracking-normal">
                      Sign letters to build text…
                    </span>
                  )}
                </div>

                {signerText && <Autocomplete text={signerText} onSelect={setSignerText} />}

                <div className="flex gap-2 flex-wrap">
                  <button className="btn-secondary text-sm py-1.5" onClick={() => setSignerText(t => t + ' ')}>Space</button>
                  <button className="btn-secondary text-sm py-1.5" onClick={() => setSignerText(t => t.slice(0, -1))} disabled={!signerText}>← Delete</button>
                  <button className="btn-secondary text-sm py-1.5" onClick={() => setSignerText('')} disabled={!signerText}>Clear</button>
                </div>

                {/* Send & Speak — the main action */}
                <button
                  onClick={sendSigned}
                  disabled={!signerText.trim()}
                  className="w-full flex items-center justify-center gap-2 btn-primary py-3 rounded-xl text-base font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  <IconSpeaker className="w-4 h-4" />
                  Send &amp; Speak
                </button>
              </div>
            )}

            {/* Conversation panel */}
            <div className="card flex flex-col flex-1 overflow-hidden" style={{ minHeight: '320px' }}>
              <div className="px-4 pt-4 pb-2 border-b border-gray-800 flex items-center justify-between shrink-0">
                <p className="text-xs uppercase tracking-widest text-gray-500">Conversation</p>
                {messages.length > 0 && (
                  <span className="text-xs text-gray-600">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <IconSpeaker className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      Conversation will appear here.<br />
                      Sign a message or have the doctor speak.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Legend */}
              <div className="px-4 py-2.5 border-t border-gray-800 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Signed (spoken aloud)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Doctor (displayed)
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
