export default function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/30" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-5 pb-[calc(20px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-4" />
        {title && <h2 className="text-[19px] font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
