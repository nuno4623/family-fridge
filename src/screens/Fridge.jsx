import { useMemo, useRef, useState } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { CATEGORIES, CAT_EMOJI, KINDS, KIND_EMOJI, STATUS, itemEmoji, itemKind, guessKind, storage } from '../utils'

const SEGMENTS = [
  { key: 'stock', label: '재고' },
  { key: 'buy', label: '사야 할 것' },
  { key: 'cart', label: '장보기 모드' }
]

export default function Fridge({ items }) {
  const { user, familyId, members } = useAuth()
  const showToast = useToast()
  const [seg, setSeg] = useState('stock')
  const [view, setView] = useState(() => storage.get('fridge:view') || 'loc') // 재고 보기 방식
  const [draft, setDraft] = useState('')
  const pressTimer = useRef(null)

  const itemsCol = collection(db, 'families', familyId, 'items')

  function changeView(v) {
    setView(v)
    storage.set('fridge:view', v)
  }

  // 재고 그룹핑: 위치별 / 종류별 / 상태순
  const groups = useMemo(() => {
    const list = items || []
    if (view === 'kind') {
      return KINDS.map((k) => ({
        key: k, title: `${KIND_EMOJI[k]} ${k}`,
        items: list.filter((i) => itemKind(i) === k)
      }))
    }
    if (view === 'status') {
      return [
        ['out', '🔴 떨어짐'], ['low', '🟡 곧 떨어짐'], ['buying', '🛒 장바구니'], ['stocked', '🟢 충분']
      ].map(([s, title]) => ({ key: s, title, items: list.filter((i) => i.status === s) }))
    }
    const map = {}
    for (const c of CATEGORIES) map[c] = []
    for (const it of list) (map[it.category] || map['기타']).push(it)
    return CATEGORIES.map((c) => ({ key: c, title: `${CAT_EMOJI[c]} ${c}`, items: map[c] }))
  }, [items, view])

  const buyList = useMemo(
    () => (items || []).filter((i) => i.status === 'low' || i.status === 'out'),
    [items]
  )
  const cartList = useMemo(
    () => (items || []).filter((i) => i.status === 'buying'),
    [items]
  )

  async function addToBuy() {
    const n = draft.trim()
    if (!n) return
    setDraft('')
    await addDoc(itemsCol, {
      name: n,
      category: '기타',
      kind: guessKind(n) || '기타',
      status: 'out',
      memo: '',
      emoji: null,
      checkedInCart: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
  }

  function cycleStatus(item) {
    const next = STATUS[item.status]?.next || 'stocked'
    updateDoc(doc(itemsCol, item.id), {
      status: next,
      checkedInCart: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
  }

  function toCart(item) {
    updateDoc(doc(itemsCol, item.id), {
      status: 'buying',
      checkedInCart: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
  }

  function toggleChecked(item) {
    updateDoc(doc(itemsCol, item.id), {
      checkedInCart: !item.checkedInCart,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
  }

  async function finishShopping() {
    const checked = cartList.filter((i) => i.checkedInCart)
    if (checked.length === 0) return
    const batch = writeBatch(db)
    for (const it of checked) {
      batch.update(doc(itemsCol, it.id), {
        status: 'stocked',
        checkedInCart: false,
        updatedBy: user.uid,
        updatedAt: serverTimestamp()
      })
    }
    await batch.commit()
    showToast('냉장고 채웠어요 🎉')
  }

  function startPress(item) {
    pressTimer.current = setTimeout(() => {
      if (confirm(`'${item.name}' 항목을 삭제할까요?`)) {
        deleteDoc(doc(itemsCol, item.id))
      }
    }, 600)
  }
  function endPress() {
    clearTimeout(pressTimer.current)
  }

  function StatusPill({ item }) {
    const s = STATUS[item.status] || STATUS.stocked
    return (
      <button
        onClick={() => cycleStatus(item)}
        className="rounded-[10px] px-3 py-2 text-[12px] font-extrabold text-white press shrink-0 whitespace-nowrap min-w-[76px]"
        style={{ background: s.color }}
      >
        {s.label}
      </button>
    )
  }

  function ItemRow({ item, right }) {
    return (
      <div
        className="flex items-center gap-3 bg-card rounded-card border border-line shadow-card px-3.5 py-2.5 min-h-[56px] select-none"
        onTouchStart={() => startPress(item)}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onMouseDown={() => startPress(item)}
        onMouseUp={endPress}
        onMouseLeave={endPress}
      >
        <span className="w-11 h-11 rounded-[13px] bg-alt grid place-items-center text-[23px] shrink-0">
          {itemEmoji(item)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate">{item.name}</p>
          <p className="text-[12px] font-semibold text-muted truncate mt-0.5">
            {members[item.updatedBy]?.name || '가족'}{item.memo ? ` · ${item.memo}` : ''}
          </p>
        </div>
        {right}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-full">
      <div className="px-5 pt-5 pb-3 sticky top-0 bg-bg z-10">
        <h1 className="text-[25px] font-extrabold tracking-tight mb-1">냉장고 🥕</h1>
        <p className="text-[13.5px] font-semibold text-muted mb-4">가족과 실시간으로 공유 중</p>
        <div className="flex gap-2 overflow-x-auto ff-scroll -mx-5 px-5 pb-1">
          {SEGMENTS.map((s) => {
            const on = seg === s.key
            return (
              <button
                key={s.key}
                onClick={() => setSeg(s.key)}
                className={`shrink-0 px-4 py-2.5 rounded-full text-[13.5px] font-extrabold press relative whitespace-nowrap ${
                  on ? 'bg-accent text-white' : 'bg-card text-ink shadow-card border border-line'
                }`}
                style={on ? { boxShadow: '0 6px 16px rgb(var(--ff-accent) / .35)' } : undefined}
              >
                {s.label}
                {s.key === 'cart' && cartList.length > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-extrabold ${
                    on ? 'bg-white text-accent' : 'bg-accent text-white'
                  }`}>
                    {cartList.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 pb-32 flex-1">
        {seg === 'stock' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-muted mr-1">보기</span>
              {[['loc', '위치별'], ['kind', '종류별'], ['status', '상태순']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => changeView(v)}
                  className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold press border-[1.5px] ${
                    view === v ? 'bg-ink text-white border-ink' : 'bg-card text-muted border-line'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(items || []).length === 0 && (
              <p className="text-center text-[14.5px] font-semibold text-muted py-10">
                아직 등록된 식재료가 없어요.<br />아래 ＋ 버튼으로 첫 항목을 추가해 보세요!
              </p>
            )}
            {groups.map((group) =>
              group.items.length > 0 ? (
                <section key={group.key}>
                  <h2 className="text-[13px] font-extrabold text-muted mb-2">
                    {group.title} <span className="font-bold opacity-60">{group.items.length}</span>
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {group.items.map((item) => (
                      <ItemRow key={item.id} item={item} right={<StatusPill item={item} />} />
                    ))}
                  </div>
                </section>
              ) : null
            )}
            <p className="text-[12px] font-semibold text-muted/70 text-center">
              상태 버튼: 충분 → 곧 떨어짐 → 떨어짐 순환 · 길게 누르면 삭제
            </p>
          </div>
        )}

        {seg === 'buy' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2 p-1.5 rounded-2xl bg-card border border-line mb-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToBuy()}
                placeholder="살 것을 입력하세요…"
                className="flex-1 min-w-0 border-none outline-none bg-transparent text-[14.5px] font-semibold px-2.5 py-2"
              />
              <button
                onClick={addToBuy}
                className="rounded-[11px] px-4 text-[14px] font-extrabold text-white bg-accent press shrink-0"
              >
                추가
              </button>
            </div>
            {buyList.length === 0 && cartList.length === 0 && (
              <p className="text-center text-[14.5px] font-semibold text-muted py-10">사야 할 게 없어요 ✅</p>
            )}
            {buyList.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                right={
                  <div className="flex items-center gap-2">
                    <StatusPill item={item} />
                    <button
                      onClick={() => toCart(item)}
                      className="rounded-[10px] px-3 py-2 text-[12px] font-extrabold text-white bg-accent press shrink-0"
                      style={{ boxShadow: '0 4px 10px rgb(var(--ff-accent) / .4)' }}
                    >
                      담기
                    </button>
                  </div>
                }
              />
            ))}
            {cartList.length > 0 && (
              <button onClick={() => setSeg('cart')} className="mt-2 bg-accent-soft rounded-card px-4 py-3.5 text-[13.5px] font-bold press text-left">
                🛒 장바구니에 {cartList.length}개 담겨 있어요 → 장보기 모드로
              </button>
            )}
          </div>
        )}

        {seg === 'cart' && (
          <div className="flex flex-col gap-2.5">
            {cartList.length === 0 && (
              <p className="text-center text-[14.5px] font-semibold text-muted py-10">
                장바구니가 비어 있어요.<br />"사야 할 것"에서 담아 주세요.
              </p>
            )}
            {cartList.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecked(item)}
                className={`flex items-center gap-3.5 rounded-card border border-line px-3.5 py-3.5 min-h-[60px] press text-left ${
                  item.checkedInCart ? 'bg-alt opacity-60' : 'bg-card shadow-card'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg grid place-items-center text-[14px] font-extrabold text-white shrink-0 ${
                    item.checkedInCart ? 'bg-accent' : 'border-2 border-line bg-transparent'
                  }`}
                >
                  {item.checkedInCart ? '✓' : ''}
                </span>
                <span className="text-[22px]">{itemEmoji(item)}</span>
                <span className={`text-[15px] font-bold flex-1 ${item.checkedInCart ? 'line-through' : ''}`}>
                  {item.name}
                </span>
                {item.memo && <span className="text-[12px] font-semibold text-muted">{item.memo}</span>}
              </button>
            ))}
            {cartList.length > 0 && (
              <button
                onClick={finishShopping}
                disabled={!cartList.some((i) => i.checkedInCart)}
                className="mt-4 py-4 rounded-2xl text-[15.5px] font-extrabold text-white bg-accent press disabled:opacity-40"
                style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
              >
                장보기 완료 ({cartList.filter((i) => i.checkedInCart).length}개 냉장고에 넣기)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
