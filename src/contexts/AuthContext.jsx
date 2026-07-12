import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import {
  doc, onSnapshot, setDoc, getDoc, collection, query, where, serverTimestamp
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { MEMBER_COLORS } from '../utils'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = 로딩 중
  const [profile, setProfile] = useState(null)
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState({}) // uid -> { name, color }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // users 문서가 없으면 생성
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            name: u.displayName || '이름 없음',
            color: MEMBER_COLORS[0],
            familyId: null,
            fcmTokens: [],
            notify: { shopping: true, event: true, memo: true },
            createdAt: serverTimestamp()
          })
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!user) { setProfile(null); return }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
  }, [user?.uid])

  const familyId = profile?.familyId || null

  useEffect(() => {
    if (!familyId) { setFamily(null); return }
    return onSnapshot(doc(db, 'families', familyId), (snap) => {
      setFamily(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
  }, [familyId])

  useEffect(() => {
    if (!familyId) { setMembers({}); return }
    const q = query(collection(db, 'users'), where('familyId', '==', familyId))
    return onSnapshot(q, (snap) => {
      const map = {}
      snap.forEach((d) => { map[d.id] = { id: d.id, ...d.data() } })
      setMembers(map)
    })
  }, [familyId])

  async function login() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // 설치형 PWA 등 팝업이 막히는 환경은 리다이렉트로 대체
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider)
      } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        throw e
      }
    }
  }

  function logout() {
    return signOut(auth)
  }

  const value = { user, profile, family, familyId, members, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
