// 데모 빌드: Firebase 모듈을 전부 인메모리 목으로 바꿔치기해서
// 백엔드 없이 UI/인터랙션을 그대로 체험할 수 있는 번들을 만든다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const mock = fileURLToPath(new URL('./src/demo/firebase-mock.js', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^firebase\/(app|auth|firestore|messaging)$/, replacement: mock }]
  },
  define: {
    'import.meta.env.VITE_FB_API_KEY': '"demo"',
    'import.meta.env.VITE_FB_AUTH_DOMAIN': '"demo"',
    'import.meta.env.VITE_FB_PROJECT_ID': '"demo"',
    'import.meta.env.VITE_FB_STORAGE_BUCKET': '"demo"',
    'import.meta.env.VITE_FB_MSG_SENDER_ID': '"demo"',
    'import.meta.env.VITE_FB_APP_ID': '"demo"',
    'import.meta.env.VITE_FB_VAPID_KEY': '"demo"',
    'import.meta.env.VITE_DEMO': 'true'
  },
  build: {
    outDir: 'demo-dist',
    rollupOptions: { input: 'demo.html' }
  }
})
