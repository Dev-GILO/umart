'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Camera, Eye, Hand, CheckCircle2,
  Loader2, AlertCircle, Lock, ShieldCheck,
} from 'lucide-react'
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import { SectionShell } from './SectionShell'

interface PassportSectionProps {
  token:      string
  initial?:   any
  onComplete: (done: boolean) => void
}

type Stage =
  | 'idle'
  | 'face'
  | 'face_captured'
  | 'hand'
  | 'hand_captured'
  | 'done'

// ─── MediaPipe loaders ────────────────────────────────────────────────────────
// Use the versioned npm CDN path — this is the correct WASM location for
// @mediapipe/tasks-vision installed from npm
async function buildFaceLandmarker() {
  const vision = await import('@mediapipe/tasks-vision')
  const { FaceLandmarker, FilesetResolver } = vision

  const resolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  )
  return FaceLandmarker.createFromOptions(resolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'CPU', // CPU is safer across devices; GPU can fail silently on some browsers
    },
    runningMode:           'VIDEO',
    numFaces:              1,
    outputFaceBlendshapes: true,
  })
}

async function buildHandLandmarker() {
  const vision = await import('@mediapipe/tasks-vision')
  const { HandLandmarker, FilesetResolver } = vision

  const resolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  )
  return HandLandmarker.createFromOptions(resolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numHands:    1,
  })
}

// ─── Finger count from landmarks ─────────────────────────────────────────────
type LM = { x: number; y: number; z: number }

function countExtendedFingers(lm: LM[]): number {
  // Tip / PIP landmark indices per finger
  const pairs = [
    [4, 3],   // thumb  (use x-axis)
    [8, 6],   // index
    [12, 10], // middle
    [16, 14], // ring
    [20, 18], // pinky
  ]
  let n = 0
  for (let i = 0; i < pairs.length; i++) {
    const [tip, pip] = pairs[i]
    if (i === 0) {
      // Thumb extends sideways
      if (Math.abs(lm[tip].x - lm[pip].x) > 0.04) n++
    } else {
      // Finger is up when tip.y < pip.y (y grows downward in image space)
      if (lm[tip].y < lm[pip].y) n++
    }
  }
  return n
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PassportSection({ token, initial, onComplete }: PassportSectionProps) {
  const alreadyDone = Boolean(initial?.faceImageUrl) && Boolean(initial?.faceWithHandImageUrl)

  const [stage,        setStage]        = useState<Stage>(alreadyDone ? 'done' : 'idle')
  const [faceBlob,     setFaceBlob]     = useState<Blob | null>(null)
  const [handBlob,     setHandBlob]     = useState<Blob | null>(null)
  const [facePreview,  setFacePreview]  = useState(initial?.faceImageUrl         ?? '')
  const [handPreview,  setHandPreview]  = useState(initial?.faceWithHandImageUrl ?? '')
  const [blinkCount,   setBlinkCount]   = useState(0)
  const [fingerCount,  setFingerCount]  = useState(0)
  const [statusMsg,    setStatusMsg]    = useState('')
  const [modelLoading, setModelLoading] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const rafRef     = useRef<number>(0)
  const faceLMRef  = useRef<any>(null)
  const handLMRef  = useRef<any>(null)
  const blinkRef   = useRef({ wasOpen: true, count: 0 })
  const captureRef = useRef(false) // prevents double-capture

  const isDone = stage === 'done'
  useEffect(() => { onComplete(isDone) }, [isDone, onComplete])
  useEffect(() => () => { killStream() }, [])

  // ── Camera ──────────────────────────────────────────────────────────────────
  async function startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
    streamRef.current = stream

    const v = videoRef.current
    if (!v) throw new Error('Video element not ready')

    v.srcObject = stream

    // Wait for video to actually have dimensions before resolving
    await new Promise<void>((resolve, reject) => {
      v.onloadedmetadata = () => {
        v.play()
          .then(() => resolve())
          .catch(reject)
      }
      v.onerror = reject
    })
  }

  function killStream() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function captureToBlob(cb: (b: Blob) => void) {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width  = v.videoWidth  || 640
    c.height = v.videoHeight || 480
    const ctx = c.getContext('2d')!
    // Un-mirror the capture so the stored image is natural orientation
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(v, -c.width, 0)
    ctx.restore()
    c.toBlob((b) => { if (b) cb(b) }, 'image/jpeg', 0.92)
  }

  // ── Face detection rAF loop ─────────────────────────────────────────────────
  // Defined as useCallback so the rAF self-reference is stable
  const runFaceLoop = useCallback(() => {
    const v = videoRef.current
    if (!v || !faceLMRef.current) {
      rafRef.current = requestAnimationFrame(runFaceLoop)
      return
    }
    // Video must be playing and have real dimensions
    if (v.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA || v.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(runFaceLoop)
      return
    }

    let result: any
    try {
      result = faceLMRef.current.detectForVideo(v, performance.now())
    } catch {
      rafRef.current = requestAnimationFrame(runFaceLoop)
      return
    }

    const cats: any[]  = result?.faceBlendshapes?.[0]?.categories ?? []
    const lScore       = cats.find((c: any) => c.categoryName === 'eyeBlinkLeft')?.score  ?? 0
    const rScore       = cats.find((c: any) => c.categoryName === 'eyeBlinkRight')?.score ?? 0
    const eyesClosed   = (lScore + rScore) / 2 > 0.45
    const hasFace      = (result?.faceLandmarks?.length ?? 0) > 0

    const bs = blinkRef.current
    if (eyesClosed && bs.wasOpen) {
      // Eyes just closed
      bs.wasOpen = false
    } else if (!eyesClosed && !bs.wasOpen) {
      // Eyes just re-opened → full blink completed
      bs.wasOpen = true
      bs.count  += 1
      setBlinkCount(bs.count)
      setStatusMsg(`Blink ${bs.count} detected ✓`)
    }

    if (bs.count >= 2 && hasFace && !captureRef.current) {
      captureRef.current = true
      cancelAnimationFrame(rafRef.current)
      captureToBlob((blob) => {
        setFaceBlob(blob)
        setFacePreview(URL.createObjectURL(blob))
        killStream()
        setStage('face_captured')
        setStatusMsg('')
      })
      return
    }

    if (!hasFace) {
      setStatusMsg('No face detected — look straight at the camera')
    } else if (bs.count < 2) {
      const left = 2 - bs.count
      setStatusMsg(`Blink slowly ${left} more time${left === 1 ? '' : 's'}`)
    }

    rafRef.current = requestAnimationFrame(runFaceLoop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hand detection rAF loop ─────────────────────────────────────────────────
  const runHandLoop = useCallback(() => {
    const v = videoRef.current
    if (!v || !handLMRef.current) {
      rafRef.current = requestAnimationFrame(runHandLoop)
      return
    }
    if (v.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA || v.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(runHandLoop)
      return
    }

    let result: any
    try {
      result = handLMRef.current.detectForVideo(v, performance.now())
    } catch {
      rafRef.current = requestAnimationFrame(runHandLoop)
      return
    }

    const lm = result?.landmarks?.[0] as LM[] | undefined

    if (lm) {
      const fingers = countExtendedFingers(lm)
      setFingerCount(fingers)

      if (fingers >= 5 && !captureRef.current) {
        captureRef.current = true
        cancelAnimationFrame(rafRef.current)
        captureToBlob((blob) => {
          setHandBlob(blob)
          setHandPreview(URL.createObjectURL(blob))
          killStream()
          setStage('hand_captured')
          setStatusMsg('')
        })
        return
      }

      setStatusMsg(
        fingers > 0
          ? `${fingers}/5 fingers — spread your hand wider`
          : 'Show your open palm to the camera'
      )
    } else {
      setFingerCount(0)
      setStatusMsg('No hand detected — hold your palm up clearly')
    }

    rafRef.current = requestAnimationFrame(runHandLoop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleStartFace() {
    setError(null)
    setModelLoading(true)
    captureRef.current   = false
    blinkRef.current     = { wasOpen: true, count: 0 }
    setBlinkCount(0)
    setStatusMsg('Loading face detection model…')
    // Show the video element before starting so the ref is attached
    setStage('face')
    try {
      if (!faceLMRef.current) {
        faceLMRef.current = await buildFaceLandmarker()
      }
      await startCamera()
      setStatusMsg('Look at the camera — blink slowly twice')
      rafRef.current = requestAnimationFrame(runFaceLoop)
    } catch (err: any) {
      setError(err.message ?? 'Failed to open camera or load model')
      setStage('idle')
    } finally {
      setModelLoading(false)
    }
  }

  async function handleStartHand() {
    setError(null)
    setModelLoading(true)
    captureRef.current = false
    setFingerCount(0)
    setStatusMsg('Loading hand detection model…')
    setStage('hand')
    try {
      if (!handLMRef.current) {
        handLMRef.current = await buildHandLandmarker()
      }
      await startCamera()
      setStatusMsg('Hold up all 5 fingers clearly')
      rafRef.current = requestAnimationFrame(runHandLoop)
    } catch (err: any) {
      setError(err.message ?? 'Failed to open camera or load model')
      setStage('face_captured')
    } finally {
      setModelLoading(false)
    }
  }

  async function handleUpload() {
    if (!faceBlob || !handBlob) return
    setSaving(true)
    setError(null)
    try {
      const [faceRes, handRes] = await Promise.all([
        uploadImageToCloudinary(new File([faceBlob], 'face.jpg',      { type: 'image/jpeg' })),
        uploadImageToCloudinary(new File([handBlob], 'face-hand.jpg', { type: 'image/jpeg' })),
      ])
      const res = await fetch('/api/users/compliance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          section:                   'passport',
          faceImageUrl:              faceRes.secure_url,
          faceImagePublicId:         faceRes.public_id,
          faceWithHandImageUrl:      handRes.secure_url,
          faceWithHandImagePublicId: handRes.public_id,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Save failed')
      setStage('done')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleRetake() {
    killStream()
    captureRef.current   = false
    blinkRef.current     = { wasOpen: true, count: 0 }
    setStage('idle')
    setFaceBlob(null);   setHandBlob(null)
    setFacePreview('');  setHandPreview('')
    setBlinkCount(0);    setFingerCount(0)
    setStatusMsg('');    setError(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const cameraActive = stage === 'face' || stage === 'hand'

  return (
    <SectionShell icon={<Camera size={16} />} title="Live Passport Capture" complete={isDone}>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <Lock size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Your privacy is protected.</span>{' '}
          These photos will <span className="font-semibold">never appear publicly</span> on U Mart.
          Encrypted and used solely for identity verification.
        </p>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/*
        The video element is ALWAYS in the DOM once camera stages begin.
        Conditional unmounting would detach the ref before srcObject is assigned.
        We show/hide it via CSS based on whether the camera is active.
      */}
      <div className={cameraActive ? 'space-y-3' : 'hidden'}>
        <div className="relative overflow-hidden rounded-xl border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full scale-x-[-1]"
          />

          {/* Face oval guide */}
          {stage === 'face' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-40 rounded-full border-2 border-dashed border-primary opacity-80" />
            </div>
          )}

          {/* Hand rectangle guide */}
          {stage === 'hand' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-36 rounded-2xl border-2 border-dashed border-amber-400 opacity-80" />
            </div>
          )}

          {/* Blink badge */}
          {stage === 'face' && blinkCount > 0 && (
            <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
              {blinkCount} / 2 blinks
            </div>
          )}

          {/* Finger badge */}
          {stage === 'hand' && fingerCount > 0 && (
            <div className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">
              {fingerCount} / 5 fingers
            </div>
          )}

          {/* Model loading overlay */}
          {modelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <Loader2 size={28} className="animate-spin text-white" />
              <p className="text-xs font-medium text-white">{statusMsg}</p>
            </div>
          )}
        </div>

        {/* Status bar below video */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
          {stage === 'face'
            ? <Eye  size={13} className="shrink-0 animate-pulse text-primary" />
            : <Hand size={13} className={`shrink-0 ${fingerCount >= 5 ? 'text-emerald-500' : 'animate-pulse text-amber-500'}`} />}
          <p className="text-xs font-medium text-foreground">{statusMsg}</p>
        </div>
      </div>

      {/* ── DONE ── */}
      {isDone && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Face capture', src: facePreview || initial?.faceImageUrl },
            { label: 'Face + Hand',  src: handPreview || initial?.faceWithHandImageUrl },
          ].map(({ label, src }) => (
            <div key={label} className="overflow-hidden rounded-xl border border-border">
              {src && <img src={src} alt={label} className="h-32 w-full object-cover" />}
              <p className="border-t border-border bg-muted/40 px-2 py-1 text-center text-[10px] text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── IDLE ── */}
      {stage === 'idle' && (
        <button
          onClick={handleStartFace}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Camera size={18} />
          Open Secure Camera
        </button>
      )}

      {/* ── FACE CAPTURED ── */}
      {stage === 'face_captured' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-emerald-500/30">
            <img src={facePreview} alt="Face captured" className="h-36 w-full object-cover" />
            <div className="flex items-center justify-center gap-1.5 border-t border-border bg-emerald-500/5 py-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Face captured!</p>
            </div>
          </div>
          <button
            onClick={handleStartHand}
            disabled={modelLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            {modelLoading
              ? <Loader2 size={18} className="animate-spin" />
              : <Hand size={18} />}
            {modelLoading ? 'Loading model…' : 'Now show your open hand'}
          </button>
          {error && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle size={12} />{error}
            </p>
          )}
        </div>
      )}

      {/* ── HAND CAPTURED ── */}
      {stage === 'hand_captured' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{ src: facePreview, label: 'Face' }, { src: handPreview, label: 'Face + Hand' }]
              .map(({ src, label }) => (
                <div key={label} className="overflow-hidden rounded-xl border border-border">
                  <img src={src} alt={label} className="h-28 w-full object-cover" />
                  <p className="bg-muted/40 py-1 text-center text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
          </div>
          {error && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle size={12} />{error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleRetake}
              disabled={saving}
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Retake
            </button>
            <button
              onClick={handleUpload}
              disabled={saving}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? 'Uploading…' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}

      {/* Global error (idle / face_captured) */}
      {error && (stage === 'idle') && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle size={12} />{error}
        </p>
      )}

      {/* Branding */}
      <p className="text-center text-[10px] text-muted-foreground/50">
        <ShieldCheck size={10} className="inline mr-1" />
        Developed by <span className="font-semibold">Drexx T3ch</span> · Encrypted and secure
      </p>
    </SectionShell>
  )
}