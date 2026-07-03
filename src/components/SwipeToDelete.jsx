import { useRef, useState } from 'react'

const OPEN_X = -76 // 삭제 버튼이 보이는 위치
const DELETE_X = -150 // 여기까지 밀면 바로 삭제

// 왼쪽으로 밀어서 삭제. 세로 스크롤과 충돌하지 않게 방향을 먼저 판별한다.
export default function SwipeToDelete({ onDelete, children }) {
  const [dx, setDx] = useState(0)
  const [anim, setAnim] = useState(true)
  const s = useRef({ x: 0, y: 0, base: 0, dragging: false, dir: null, suppress: false })

  function down(e) {
    s.current = { ...s.current, x: e.clientX, y: e.clientY, base: dx, dragging: true, dir: null }
    setAnim(false)
  }

  function move(e) {
    const st = s.current
    if (!st.dragging) return
    const ddx = e.clientX - st.x
    const ddy = e.clientY - st.y
    if (st.dir === null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return
      st.dir = Math.abs(ddx) > Math.abs(ddy) ? 'h' : 'v'
      if (st.dir === 'h') {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
      }
    }
    if (st.dir !== 'h') return
    setDx(Math.max(-170, Math.min(0, st.base + ddx)))
  }

  function up() {
    const st = s.current
    if (!st.dragging) return
    st.dragging = false
    setAnim(true)
    if (st.dir === 'h') {
      st.suppress = true
      setTimeout(() => { s.current.suppress = false }, 300)
    }
    setDx((cur) => {
      if (cur < DELETE_X) { onDelete(); return -400 }
      if (cur < OPEN_X / 2) return OPEN_X
      return 0
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => onDelete()}
        className="absolute inset-y-0 right-0 w-[68px] rounded-card bg-danger text-white text-[13px] font-extrabold"
        tabIndex={dx === OPEN_X ? 0 : -1}
        aria-label="삭제"
      >
        삭제
      </button>
      <div
        style={{ transform: `translateX(${dx}px)`, transition: anim ? 'transform .2s ease' : 'none', touchAction: 'pan-y' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          // 방금 민 직후의 클릭은 무시 (열린 상태 유지)
          if (s.current.suppress) {
            e.stopPropagation()
            e.preventDefault()
            return
          }
          // 열려 있는 상태에서 행을 탭하면 닫기만 한다
          if (dx !== 0) {
            e.stopPropagation()
            e.preventDefault()
            setDx(0)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
