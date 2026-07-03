import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
}

export const isConfigured = !!firebaseConfig.apiKey

export const app = isConfigured ? initializeApp(firebaseConfig) : null
export const auth = isConfigured ? getAuth(app) : null
export const db = isConfigured ? getFirestore(app) : null
export const googleProvider = new GoogleAuthProvider()
