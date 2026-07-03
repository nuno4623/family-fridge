import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((text) => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-2), { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed left-0 right-0 bottom-24 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-ink text-white text-[14.5px] font-semibold px-5 py-3 rounded-full shadow-lg animate-toast-in max-w-full"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
