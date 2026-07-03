import { useRef } from 'react'

export default function BottomSheet({ open, onClose, children, title }) {
  const dragY = useRef(null)
  if (!open) return null

  return (
    // touch-none: 시트 밖(어두운 영역)에서 브라우저의 당겨서-새로고침·스크롤 제스처 차단 → 탭이 항상 닫기로 동작
    <div className="fixed inset-0 z-50 touch-none" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0c12]/40 animate-fade-in" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] px-5 pb-[calc(28px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto overscroll-contain touch-pan-y animate-sheet-up"
        style={{ boxShadow: '0 -20px 50px rgba(0,0,0,.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 그랩바: 탭하거나 아래로 끌면 닫힘 */}
        <button
          aria-label="닫기"
          className="block w-full pt-3 pb-4 touch-none cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClose() }}
          onPointerDown={(e) => { dragY.current = e.clientY }}
          onPointerMove={(e) => {
            if (dragY.current !== null && e.clientY - dragY.current > 50) {
              dragY.current = null
              onClose()
            }
          }}
          onPointerUp={() => { dragY.current = null }}
          onPointerCancel={() => { dragY.current = null }}
        >
          <span className="block w-12 h-[5px] bg-line rounded-full mx-auto" />
        </button>
        {title && <h2 className="text-[21px] font-extrabold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
