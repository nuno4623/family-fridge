import { useCallback, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './theme'
import { useFamilyCollection } from './hooks/useFamilyCollection'
import { useToast } from './components/Toast'
import TabBar from './components/TabBar'
import AddItemSheet from './components/AddItemSheet'
import Login from './screens/Login'
import FamilySetup from './screens/FamilySetup'
import Home from './screens/Home'
import Fridge from './screens/Fridge'
import Calendar from './screens/Calendar'
import Memos from './screens/Memos'
import Settings from './screens/Settings'
import { STATUS } from './utils'

export default function App() {
  const { user, profile, familyId, members } = useAuth()
  const { scale } = useTheme()
  const showToast = useToast()
  const [tab, setTab] = useState('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [fabTick, setFabTick] = useState(0) // 캘린더·메모 탭 FAB 신호

  // 다른 가족의 식재료 변경 → 실시간 토스트
  const onItemChange = useCallback((change) => {
    const data = change.doc.data()
    if (!user || data.updatedBy === user.uid) return
    const who = members[data.updatedBy]?.name || '가족'
    if (change.type === 'added') {
      showToast(`방금 ${who}님이 '${data.name}' 추가했어요`)
    } else if (change.type === 'modified') {
      if (data.status === 'buying') showToast(`방금 ${who}님이 '${data.name}' 담았어요 🛒`)
      else if (data.status === 'out') showToast(`${who}님이 '${data.name}' 떨어짐 표시했어요`)
      else if (data.status === 'stocked') showToast(`${who}님이 '${data.name}' 채웠어요 ✅`)
    }
  }, [user?.uid, members, showToast])

  const onEventChange = useCallback((change) => {
    const data = change.doc.data()
    if (!user || change.type !== 'added' || data.owner === user.uid) return
    const who = members[data.owner]?.name || '가족'
    showToast(`📅 ${who}님이 '${data.title}' 일정을 추가했어요`)
  }, [user?.uid, members, showToast])

  const onMemoChange = useCallback((change) => {
    const data = change.doc.data()
    if (!user || change.type !== 'added' || data.author === user.uid) return
    const who = members[data.author]?.name || '가족'
    showToast(`📝 ${who}님이 새 메모를 붙였어요`)
  }, [user?.uid, members, showToast])

  const items = useFamilyCollection(familyId, 'items', 'updatedAt', onItemChange)
  const events = useFamilyCollection(familyId, 'events', 'date', onEventChange)
  const memos = useFamilyCollection(familyId, 'memos', 'createdAt', onMemoChange)

  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-[48px] animate-pulse">🧊</div>
      </div>
    )
  }

  if (!user) return <Login />
  if (profile && !profile.familyId) return <FamilySetup />
  if (!profile || !familyId) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-[48px] animate-pulse">🧊</div>
      </div>
    )
  }

  const buyCount = (items || []).filter((i) => i.status !== 'stocked' && STATUS[i.status]).length

  function onFab() {
    if (tab === 'home' || tab === 'fridge') setAddOpen(true)
    else setFabTick((t) => t + 1) // 캘린더 → 오늘 일정 추가 / 메모 → 새 메모
  }

  return (
    <div className="min-h-dvh bg-bg pb-[calc(72px+env(safe-area-inset-bottom))]" style={{ zoom: scale }}>
      {tab === 'home' && (
        <Home
          items={items} events={events} memos={memos}
          onGoTab={setTab}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {tab === 'fridge' && <Fridge items={items} />}
      {tab === 'calendar' && <Calendar events={events} fabTick={fabTick} />}
      {tab === 'memo' && <Memos memos={memos} fabTick={fabTick} />}

      <TabBar tab={tab} onChange={setTab} badges={{ fridge: buyCount }} onFab={onFab} />
      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} />
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
