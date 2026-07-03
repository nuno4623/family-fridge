export default function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0c12]/40 animate-fade-in" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] px-5 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-sheet-up"
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
