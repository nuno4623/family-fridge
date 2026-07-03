export default function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null
  return (
    // touch-none: 시트 밖(어두운 영역)에서 브라우저의 당겨서-새로고침·스크롤 제스처 차단 → 탭이 항상 닫기로 동작
    <div className="fixed inset-0 z-50 touch-none" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0c12]/40 animate-fade-in" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] px-5 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto overscroll-contain touch-pan-y animate-sheet-up"
        style={{ boxShadow: '0 -20px 50px rgba(0,0,0,.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-[5px] bg-line rounded-full mx-auto mb-4" />
        {title && <h2 className="text-[21px] font-extrabold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
