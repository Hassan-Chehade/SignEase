import { useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: 'user' }

// MediaPipe hand skeleton connections
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],           // thumb
  [0,5],[5,6],[6,7],[7,8],           // index
  [0,9],[9,10],[10,11],[11,12],      // middle
  [0,13],[13,14],[14,15],[15,16],    // ring
  [0,17],[17,18],[18,19],[19,20],    // pinky
  [5,9],[9,13],[13,17],              // palm
]

// Finger colour palette
const FINGER_COLORS = {
  thumb:  '#f97316',
  index:  '#22c55e',
  middle: '#3b82f6',
  ring:   '#a855f7',
  pinky:  '#ec4899',
  palm:   '#6366f1',
}

function connColor(a, b) {
  if (a <= 4  || b <= 4)  return FINGER_COLORS.thumb
  if (a <= 8  || b <= 8)  return FINGER_COLORS.index
  if (a <= 12 || b <= 12) return FINGER_COLORS.middle
  if (a <= 16 || b <= 16) return FINGER_COLORS.ring
  if (a <= 20 || b <= 20) return FINGER_COLORS.pinky
  return FINGER_COLORS.palm
}

function drawSkeleton(canvas, landmarks) {
  const ctx = canvas.getContext('2d')
  const W   = canvas.width
  const H   = canvas.height
  ctx.clearRect(0, 0, W, H)

  if (!landmarks || landmarks.length === 0) return

  // Connections
  ctx.lineWidth = 2
  CONNECTIONS.forEach(([a, b]) => {
    const [ax, ay] = landmarks[a]
    const [bx, by] = landmarks[b]
    ctx.strokeStyle = connColor(a, b) + 'cc'
    ctx.beginPath()
    ctx.moveTo(ax * W, ay * H)
    ctx.lineTo(bx * W, by * H)
    ctx.stroke()
  })

  // Dots
  landmarks.forEach(([x, y], i) => {
    const isTip = [4, 8, 12, 16, 20].includes(i)
    ctx.fillStyle = isTip ? '#ffffff' : '#94a3b8'
    ctx.beginPath()
    ctx.arc(x * W, y * H, isTip ? 4 : 2.5, 0, Math.PI * 2)
    ctx.fill()
  })
}

export default function WebcamCapture({ onFrame, isActive, captureIntervalMs = 800, landmarks = [] }) {
  const webcamRef   = useRef(null)
  const canvasRef   = useRef(null)
  const intervalRef = useRef(null)

  const capture = useCallback(() => {
    const img = webcamRef.current?.getScreenshot({ width: 320, height: 240 })
    if (img) onFrame(img)
  }, [onFrame])

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(capture, captureIntervalMs)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, capture, captureIntervalMs])

  // Draw skeleton whenever landmarks update
  useEffect(() => {
    if (canvasRef.current) {
      drawSkeleton(canvasRef.current, landmarks)
    }
  }, [landmarks])

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={VIDEO_CONSTRAINTS}
        className="w-full h-full object-cover"
        mirrored
      />

      {/* Skeleton overlay — same mirror transform as video */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
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
  )
}
