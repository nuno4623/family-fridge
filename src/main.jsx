import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './theme'
import { isConfigured } from './firebase'
import './index.css'

function ConfigMissing() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg text-center">
      <div className="text-[56px] mb-4">🔧</div>
      <h1 className="text-[22px] font-bold mb-3">Firebase 설정이 필요해요</h1>
      <p className="text-[16px] text-ink/60 leading-relaxed">
        프로젝트 루트에 <code className="bg-butter px-1.5 py-0.5 rounded">.env</code> 파일을 만들고
        Firebase 웹 앱 config 값을 넣어 주세요.<br />
        (<code className="bg-butter px-1.5 py-0.5 rounded">.env.example</code> 참고)
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      {isConfigured ? (
        <AuthProvider>
          <ToastProvider>
            {import.meta.env.VITE_DEMO && (
              <div className="bg-ink text-white text-center text-[13px] py-1.5 font-medium">
                🧪 데모 모드 — 샘플 데이터로 둘러보는 중이에요 (저장되지 않아요)
              </div>
            )}
            <App />
          </ToastProvider>
        </AuthProvider>
      ) : (
        <ConfigMissing />
      )}
    </ThemeProvider>
  </React.StrictMode>
)
