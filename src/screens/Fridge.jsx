import { useMemo, useRef, useState } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { CATEGORIES, STATUS } from '../utils'

const SEGMENTS = [
  { key: 'stock', label: '재고' },
  { key: 'buy', label: '사야 할 것' },
  { key: 'cart', label: '장보기 모드' }
]

export default function Fridge({ items }) {
  const { user, familyId } = useAuth()
  const showToast = useToast()
  const [seg, setSeg] = useState('stock')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('냉장')
  const inputRef = useRef(null)
  const pressTimer = useRef(null)

  const itemsCol = collection(db, 'families', familyId, 'items')

  const byCategory = useMemo(() => {
    const map = {}
    for (const c of CATEGORIES) map[c] = []
    for (const it of items || []) {
      (map[it.category] || map['기타']).push(it)
    }
    return map
  }, [items])

  const buyList = useMemo(
    () => (items || []).filter((i) => i.status === 'low' || i.status === 'out'),
    [items]
  )
  const cartList = useMemo(
    () => (items || []).filter((i) => i.status === 'buying'),
    [items]
  )

  async function addItem() {
    const n = name.trim()
    if (!n) return
    setName('')
    inputRef.current?.focus()
    await addDoc(itemsCol, {
      name: n,
      category,
      // 재고 탭에서 추가하면 '충분', 사야 할 것/장보기 탭에서 추가하면 바로 목록에 뜨게
      status: seg === 'stock' ? 'stocked' : seg === 'cart' ? 'buying' : 'out',
      memo: '',
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
        className="rounded-full px-4 py-2.5 text-[15px] font-bold press shrink-0 min-w-[88px]"
        style={{ background: s.color }}
      >
        {s.label}
      </button>
    )
  }

  function ItemRow({ item, right }) {
    return (
      <div
        className="flex items-center gap-3 bg-card rounded-card shadow-card px-4 py-2.5 min-h-[56px] select-none"
        onTouchStart={() => startPress(item)}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onMouseDown={() => startPress(item)}
        onMouseUp={endPress}
        onMouseLeave={endPress}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-medium truncate">{item.name}</p>
          {item.memo && <p className="text-[13px] text-ink/50 truncate">{item.memo}</p>}
        </div>
        {right}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-full">
      <div className="px-5 pt-6 pb-3 sticky top-0 bg-bg z-10">
        <h1 className="text-[24px] font-bold mb-3">🥕 냉장고</h1>
        <div className="flex bg-ink/5 rounded-btn p-1 gap-1">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeg(s.key)}
              className={`flex-1 py-2.5 rounded-[9px] text-[15px] font-bold press relative ${
                seg === s.key ? 'bg-card shadow-card' : 'text-ink/45'
              }`}
            >
              {s.label}
              {s.key === 'cart' && cartList.length > 0 && (
                <span className="absolute top-1 right-1.5 min-w-[18px] h-[18px] px-1 bg-peach rounded-full text-[11px] flex items-center justify-center font-bold">
                  {cartList.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-40 flex-1">
        {seg === 'stock' && (
          <div className="flex flex-col gap-5">
            {(items || []).length === 0 && (
              <p className="text-center text-[16px] text-ink/40 py-10">
                아직 등록된 식재료가 없어요.<br />아래에서 첫 항목을 추가해 보세요!
              </p>
            )}
            {CATEGORIES.map((cat) =>
              byCategory[cat].length > 0 ? (
                <section key={cat}>
                  <h2 className="text-[15px] font-bold text-ink/50 mb-2">{cat}</h2>
                  <div className="flex flex-col gap-2">
                    {byCategory[cat].map((item) => (
                      <ItemRow key={item.id} item={item} right={<StatusPill item={item} />} />
                    ))}
                  </div>
                </section>
              ) : null
            )}
            <p className="text-[13px] text-ink/35 text-center">
              상태 버튼을 누르면 충분 → 곧 떨어짐 → 떨어짐 순으로 바뀌어요 · 길게 누르면 삭제
            </p>
          </div>
        )}

        {seg === 'buy' && (
          <div className="flex flex-col gap-2">
            {buyList.length === 0 && cartList.length === 0 && (
              <p className="text-center text-[16px] text-ink/40 py-10">사야 할 게 없어요 ✅</p>
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
                      className="bg-peach rounded-full px-4 py-2.5 text-[15px] font-bold press shrink-0"
                    >
                      담기
                    </button>
                  </div>
                }
              />
            ))}
            {cartList.length > 0 && (
              <button onClick={() => setSeg('cart')} className="mt-3 bg-peach/50 rounded-card px-4 py-3.5 text-[15px] font-medium press text-left">
                🛒 장바구니에 {cartList.length}개 담겨 있어요 → 장보기 모드로
              </button>
            )}
          </div>
        )}

        {seg === 'cart' && (
          <div className="flex flex-col gap-2">
            {cartList.length === 0 && (
              <p className="text-center text-[16px] text-ink/40 py-10">
                장바구니가 비어 있어요.<br />"사야 할 것"에서 담아 주세요.
              </p>
            )}
            {cartList.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecked(item)}
                className="flex items-center gap-4 bg-card rounded-card shadow-card px-4 py-4 min-h-[64px] press text-left"
              >
                <span
                  className={`w-8 h-8 rounded-[10px] border-2 flex items-center justify-center text-[18px] shrink-0 transition-colors ${
                    item.checkedInCart ? 'bg-mint border-mint' : 'border-ink/25'
                  }`}
                >
                  {item.checkedInCart ? '✓' : ''}
                </span>
                <span className={`text-[19px] font-medium flex-1 ${item.checkedInCart ? 'line-through text-ink/35' : ''}`}>
                  {item.name}
                </span>
                {item.memo && <span className="text-[14px] text-ink/45">{item.memo}</span>}
              </button>
            ))}
            {cartList.length > 0 && (
              <button
                onClick={finishShopping}
                disabled={!cartList.some((i) => i.checkedInCart)}
                className="mt-4 bg-peach rounded-card py-4 text-[18px] font-bold shadow-card press disabled:opacity-40"
              >
                장보기 완료 ({cartList.filter((i) => i.checkedInCart).length}개 냉장고에 넣기)
              </button>
            )}
          </div>
        )}
      </div>

      {seg !== 'cart' && (
        <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 bg-bg/95 backdrop-blur border-t border-ink/10 px-4 py-3 z-30">
          <div className="max-w-lg mx-auto flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-card border border-ink/15 rounded-btn px-2 py-3 text-[15px] font-medium shrink-0"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={seg === 'stock' ? '식재료 이름 (예: 계란)' : '살 것 추가 (예: 두부)'}
              className="flex-1 min-w-0 bg-card border border-ink/15 rounded-btn px-4 py-3 text-[16px]"
            />
            <button onClick={addItem} className="bg-peach rounded-btn px-5 text-[16px] font-bold press shrink-0">
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
