import { useEffect, useRef } from 'react'
import { CircleHelp, PartyPopper, X } from 'lucide-react'
import type { Story } from '../types/story'

export type TruthDialogMode =
  | 'confirm'
  | 'revealed'
  | 'limit'
  | 'limitRevealed'
  | 'hintConfirm'

export function TruthRevealDialog({
  mode,
  story,
  hintCost,
  questionLimit,
  onClose,
  onContinue,
  onConfirm,
  onConfirmHint,
  onRevealAfterLimit,
}: {
  mode: TruthDialogMode
  story: Story
  hintCost: number
  questionLimit: number
  onClose: () => void
  onContinue: () => void
  onConfirm: () => void
  onConfirmHint: () => void
  onRevealAfterLimit: () => void
}) {
  const isRevealed = mode === 'revealed' || mode === 'limitRevealed'
  const isLimit = mode === 'limit'
  const isHintConfirm = mode === 'hintConfirm'
  const shouldShowConfetti = mode === 'revealed'
  const title = isRevealed
    ? story.title
    : isLimit
      ? '提问次数已用完'
      : isHintConfirm
        ? '打开这条提示？'
        : '确定要查看汤底吗？'
  const body = isRevealed
    ? story.truth
    : isLimit
      ? `本题的 ${questionLimit} 次提问额度已经用完。你可以继续提问自由探索，也可以直接进入结局查看汤底。`
      : isHintConfirm
        ? `打开后会消耗 ${hintCost} 次提问机会。`
        : '这会直接揭开完整真相，并把当前题目标记为已揭晓。'

  return (
    <div
      className="truth-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (!isLimit && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      {shouldShowConfetti ? <CanvasConfetti /> : null}
      <div
        aria-describedby="truth-dialog-body"
        aria-labelledby="truth-dialog-title"
        aria-modal="true"
        className={
          isRevealed ? 'truth-dialog revealed' : 'truth-dialog confirm'
        }
        role="dialog"
      >
        {!isLimit ? (
          <button
            aria-label={isRevealed ? '关闭汤底' : '取消查看汤底'}
            className="truth-dialog-close"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        ) : null}
        <div className="truth-dialog-icon" aria-hidden="true">
          {isLimit || isHintConfirm ? (
            <CircleHelp size={28} />
          ) : (
            <PartyPopper size={28} />
          )}
        </div>
        <p className="truth-dialog-kicker">
          {isRevealed
            ? '汤底揭晓'
            : isLimit
              ? '额度提醒'
              : isHintConfirm
                ? '提示确认'
                : '剧透确认'}
        </p>
        <h2 id="truth-dialog-title">{title}</h2>
        <p className="truth-dialog-body" id="truth-dialog-body">
          {body}
        </p>
        <div className="truth-dialog-actions">
          {isLimit ? (
            <button
              className="truth-dialog-action secondary"
              type="button"
              onClick={onRevealAfterLimit}
            >
              进入结局
            </button>
          ) : null}
          {!isRevealed && !isLimit ? (
            <button
              className="truth-dialog-action secondary"
              type="button"
              onClick={onClose}
            >
              {isHintConfirm ? '取消' : '先不看'}
            </button>
          ) : null}
          <button
            className="truth-dialog-action"
            type="button"
            onClick={
              isRevealed
                ? onClose
                : isLimit
                  ? onContinue
                  : isHintConfirm
                    ? onConfirmHint
                    : onConfirm
            }
          >
            {isRevealed
              ? '收下真相'
              : isLimit
                ? '继续提问'
                : isHintConfirm
                  ? '继续打开提示'
                  : '查看汤底'}
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfettiPiece = {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  rotation: number
  spin: number
  gravity: number
  drag: number
  life: number
  ttl: number
  shape: 'circle' | 'rect'
}

function CanvasConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const confettiCanvas = canvas
    const confettiContext = context

    let frameId = 0
    let lastTime = performance.now()
    let isRunning = true
    const colors = ['#c9851e', '#9d382c', '#2f6f62', '#5aa7a6', '#f1c84c']
    const pieces: ConfettiPiece[] = []
    const timers: number[] = []

    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      confettiCanvas.width = Math.floor(window.innerWidth * ratio)
      confettiCanvas.height = Math.floor(window.innerHeight * ratio)
      confettiCanvas.style.width = window.innerWidth + 'px'
      confettiCanvas.style.height = window.innerHeight + 'px'
      confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function addBurst(originX: number, originY: number, count: number) {
      for (let index = 0; index < count; index += 1) {
        const angle = -Math.PI + Math.random() * Math.PI
        const speed = 8 + Math.random() * 13
        const size = 7 + Math.random() * 10

        pieces.push({
          x: originX + (Math.random() - 0.5) * 26,
          y: originY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5,
          width: size * (0.7 + Math.random() * 0.7),
          height: size * (1.4 + Math.random() * 1.4),
          color: colors[index % colors.length],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.42,
          gravity: 0.26 + Math.random() * 0.11,
          drag: 0.986 + Math.random() * 0.007,
          life: 0,
          ttl: 165 + Math.random() * 72,
          shape: Math.random() > 0.78 ? 'circle' : 'rect',
        })
      }
    }

    function drawPiece(piece: ConfettiPiece) {
      const opacity = Math.max(0, 1 - piece.life / piece.ttl)
      confettiContext.save()
      confettiContext.globalAlpha = opacity
      confettiContext.translate(piece.x, piece.y)
      confettiContext.rotate(piece.rotation)
      confettiContext.fillStyle = piece.color

      if (piece.shape === 'circle') {
        confettiContext.beginPath()
        confettiContext.ellipse(
          0,
          0,
          piece.width * 0.55,
          piece.width * 0.55,
          0,
          0,
          Math.PI * 2,
        )
        confettiContext.fill()
      } else {
        confettiContext.fillRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height,
        )
      }

      confettiContext.globalAlpha = opacity * 0.32
      confettiContext.strokeStyle = '#fffdf7'
      confettiContext.lineWidth = 1
      if (piece.shape === 'rect') {
        confettiContext.strokeRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height,
        )
      }

      confettiContext.restore()
    }

    function animate(now: number) {
      if (!isRunning) {
        return
      }

      const step = Math.min((now - lastTime) / 16.67, 2)
      lastTime = now
      confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let index = pieces.length - 1; index >= 0; index -= 1) {
        const piece = pieces[index]
        piece.life += step
        piece.vx *= piece.drag
        piece.vy = piece.vy * piece.drag + piece.gravity * step
        piece.x += piece.vx * step
        piece.y += piece.vy * step
        piece.rotation += piece.spin * step
        drawPiece(piece)

        if (
          piece.life >= piece.ttl ||
          piece.y > window.innerHeight + 80 ||
          piece.x < -80 ||
          piece.x > window.innerWidth + 80
        ) {
          pieces.splice(index, 1)
        }
      }

      if (pieces.length > 0) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    resizeCanvas()
    addBurst(window.innerWidth * 0.5, window.innerHeight * 0.22, 150)
    addBurst(window.innerWidth * 0.3, window.innerHeight * 0.28, 44)
    addBurst(window.innerWidth * 0.7, window.innerHeight * 0.28, 44)
    timers.push(
      window.setTimeout(() => {
        addBurst(window.innerWidth * 0.42, window.innerHeight * 0.2, 76)
        frameId = window.requestAnimationFrame(animate)
      }, 220),
      window.setTimeout(() => {
        addBurst(window.innerWidth * 0.58, window.innerHeight * 0.22, 76)
        frameId = window.requestAnimationFrame(animate)
      }, 520),
    )
    frameId = window.requestAnimationFrame(animate)
    window.addEventListener('resize', resizeCanvas)

    return () => {
      isRunning = false
      window.cancelAnimationFrame(frameId)
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas aria-hidden="true" className="confetti-canvas" ref={canvasRef} />
  )
}
