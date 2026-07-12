import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  // opts.action = { label, onClick } 이면 실행 취소 같은 버튼이 함께 뜬다
  const showToast = useCallback((text, opts = {}) => {
    const id = ++idRef.current
    const duration = opts.duration ?? (opts.action ? 5000 : 3000)
    setToasts((t) => [...t.slice(-2), { id, text, action: opts.action }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
    return id
  }, [])

  function dismiss(id) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed left-0 right-0 bottom-24 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-ink text-white text-[14.5px] font-semibold pl-5 pr-2 py-2.5 rounded-full shadow-lg animate-toast-in max-w-full"
          >
            <span className="py-0.5">{t.text}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id) }}
                className="shrink-0 font-extrabold text-white bg-white/20 rounded-full px-3.5 py-2 press whitespace-nowrap"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
