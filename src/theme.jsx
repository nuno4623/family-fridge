// 디자인 핸드오프("디자인 테마 및 폰트 개선")의 테마/글꼴/크기 시스템.
// CSS 변수(RGB 트리플렛)로 주입해서 Tailwind 토큰과 인라인 스타일 양쪽에서 쓴다.
import { createContext, useContext, useEffect, useState } from 'react'
import { storage } from './utils'

export const THEMES = {
  orange: {
    label: '오렌지', dot: '#FF6B35',
    bg: '#FBF3EE', alt: '#F5EDE7', accent: '#FF6B35', accentDeep: '#E8551F',
    accentSoft: '#FFE2D4', border: '#F0E6DE', shadow: '0 12px 30px rgba(255,107,53,.14)'
  },
  yellow: {
    label: '옐로', dot: '#F5B21C',
    bg: '#FDF8EB', alt: '#F7F0DE', accent: '#F5B21C', accentDeep: '#E09A05',
    accentSoft: '#FCEAC0', border: '#F1E7CE', shadow: '0 12px 30px rgba(240,170,20,.16)'
  },
  green: {
    label: '그린', dot: '#2E9E5B',
    bg: '#EFF6F1', alt: '#E4F0E8', accent: '#2E9E5B', accentDeep: '#1F7E45',
    accentSoft: '#D4EDDD', border: '#DDECE2', shadow: '0 12px 30px rgba(46,158,91,.15)'
  },
  pink: {
    label: '핑크', dot: '#FF5C8A',
    bg: '#FDF0F4', alt: '#F7E4EB', accent: '#FF5C8A', accentDeep: '#E83E6E',
    accentSoft: '#FFD9E4', border: '#F5DCE4', shadow: '0 12px 30px rgba(255,92,138,.16)'
  },
  navy: {
    label: '네이비', dot: '#1F3A5F',
    bg: '#EEF1F6', alt: '#E3E8F0', accent: '#1F3A5F', accentDeep: '#152A47',
    accentSoft: '#D6DEEA', border: '#E1E6EF', shadow: '0 12px 30px rgba(31,58,95,.16)'
  }
}

// 테마와 무관한 공통 색 (프로토타입의 N 토큰)
export const NEUTRALS = {
  text: '#1B2740', muted: '#8C96A8', surface: '#FFFFFF',
  good: '#2E9E5B', warn: '#F2A81D', danger: '#F0524B'
}

export const FONTS = {
  gothic: { label: '고딕', stack: "'Gothic A1', sans-serif" },
  noto: { label: '노토', stack: "'Noto Sans KR', sans-serif" },
  plex: { label: '플렉스', stack: "'IBM Plex Sans KR', sans-serif" }
}

export const SIZES = {
  md: { label: '보통', scale: 1 },
  lg: { label: '크게', scale: 1.12 },
  xl: { label: '아주 크게', scale: 1.24 }
}

const DEFAULT_PREFS = { theme: 'orange', font: 'gothic', size: 'md' }
const PREFS_KEY = 'fridge:prefs'

function hexToTriplet(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

export function applyThemeVars(prefs) {
  const t = THEMES[prefs.theme] || THEMES.orange
  const f = FONTS[prefs.font] || FONTS.gothic
  const root = document.documentElement
  const set = (k, v) => root.style.setProperty(k, v)
  set('--ff-bg', hexToTriplet(t.bg))
  set('--ff-alt', hexToTriplet(t.alt))
  set('--ff-accent', hexToTriplet(t.accent))
  set('--ff-accent-deep', hexToTriplet(t.accentDeep))
  set('--ff-accent-soft', hexToTriplet(t.accentSoft))
  set('--ff-line', hexToTriplet(t.border))
  set('--ff-shadow', t.shadow)
  set('--ff-text', hexToTriplet(NEUTRALS.text))
  set('--ff-muted', hexToTriplet(NEUTRALS.muted))
  set('--ff-surface', hexToTriplet(NEUTRALS.surface))
  set('--ff-good', hexToTriplet(NEUTRALS.good))
  set('--ff-warn', hexToTriplet(NEUTRALS.warn))
  set('--ff-danger', hexToTriplet(NEUTRALS.danger))
  set('--ff-font', f.stack)
}

const ThemeContext = createContext({ prefs: DEFAULT_PREFS, setPrefs: () => {}, scale: 1 })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [prefs, setPrefsState] = useState(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(storage.get(PREFS_KEY) || '{}') }
    } catch {
      return DEFAULT_PREFS
    }
  })

  useEffect(() => {
    applyThemeVars(prefs)
  }, [prefs])

  function setPrefs(patch) {
    setPrefsState((p) => {
      const next = { ...p, ...patch }
      storage.set(PREFS_KEY, JSON.stringify(next))
      return next
    })
  }

  const scale = (SIZES[prefs.size] || SIZES.md).scale
  return (
    <ThemeContext.Provider value={{ prefs, setPrefs, scale }}>
      {children}
    </ThemeContext.Provider>
  )
}
