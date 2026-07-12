import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import { toDateStr, todayStr, formatShortDate, occursOn, eventExtraLabel, REPEATS } from '../utils'
import { getHoliday } from '../holidays'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MAX_LANES = 4 // 한 주에 겹쳐 보여줄 일정 막대 수
const NUM_ROW = 30 // 날짜 숫자 영역 높이(px)
const BAR_H = 23 // 일정 막대 한 줄 높이(px)
const MIN_WEEK_H = 92 // 타임트리처럼 넉넉한 주 높이

export default function Calendar({ events, fabTick }) {
  const { user, profile, members, familyId } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'
  const [adding, setAdding] = useState(false)
  const [rangeMode, setRangeMode] = useState(null) // null | 'start' | 'end' — 캘린더에서 기간 잡는 중
  const [armDelete, setArmDelete] = useState(null) // 두 번 탭 삭제 확인용 일정 id
  const [editingId, setEditingId] = useState(null) // 수정 중인 일정 id (null이면 새로 추가)
  const [copySrc, setCopySrc] = useState(null) // 복사할 원본 일정 (날짜 고르는 중)
  const [form, setForm] = useState({ title: '', time: '', memo: '', startDate: '', endDate: '', repeat: 'none' })
  const today = todayStr()
  const lastTick = useRef(fabTick)

  // 좌우 스와이프로 달 넘기기
  const swipe = useRef({ x: 0, y: 0, dir: null, dragging: false, suppress: false })
  const [panX, setPanX] = useState(0)
  const [panAnim, setPanAnim] = useState(false)

  function panDown(e) {
    swipe.current = { x: e.clientX, y: e.clientY, dir: null, dragging: true, suppress: false }
    setPanAnim(false)
  }
  function panMove(e) {
    const s = swipe.current
    if (!s.dragging) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (s.dir === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      s.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (s.dir === 'h') {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
      }
    }
    if (s.dir !== 'h') return
    s.panX = Math.max(-120, Math.min(120, dx))
    setPanX(s.panX)
  }
  function panUp() {
    const s = swipe.current
    if (!s.dragging) return
    s.dragging = false
    setPanAnim(true)
    if (s.dir === 'h') {
      s.suppress = true
      setTimeout(() => { swipe.current.suppress = false }, 300)
    }
    const cur = s.panX || 0
    s.panX = 0
    if (cur < -60) moveMonth(1)
    else if (cur > 60) moveMonth(-1)
    setPanX(0)
  }

  // 중앙 FAB → 오늘 날짜 일정 추가
  useEffect(() => {
    if (fabTick !== lastTick.current) {
      lastTick.current = fabTick
      setSelected(today)
      setForm((f) => ({ ...f, startDate: today }))
      setAdding(true)
    }
  }, [fabTick, today])

  // 달력을 주 단위로 (앞뒤 빈 칸 포함)
  const weeks = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const cells = []
    const first = new Date(year, month, 1)
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cursor])

  // 주별 일정 막대(span) 계산 — 타임트리처럼 날짜를 가로지르는 색 막대
  const weekSpans = useMemo(() => {
    return weeks.map((week) => {
      const spans = []
      // 공휴일은 빨간 막대로 (같은 이름이 이어지면 하나로 합침)
      week.forEach((cell, i) => {
        if (!cell) return
        const name = getHoliday(toDateStr(cell))
        if (!name) return
        const prev = spans[spans.length - 1]
        if (prev && prev.holiday === name && prev.e === i - 1) prev.e = i
        else spans.push({ holiday: name, s: i, e: i, lane: 0 })
      })
      for (const ev of events || []) {
        let s = -1
        let e = -1
        week.forEach((cell, i) => {
          if (cell && occursOn(ev, toDateStr(cell))) {
            if (s < 0) s = i
            e = i
          }
        })
        if (s >= 0) spans.push({ ev, s, e, lane: 0 })
      }
      // 공휴일 먼저, 그다음 먼저 시작하고 긴 일정부터 위 줄(lane)에 배치
      spans.sort((a, b) => ((b.holiday ? 1 : 0) - (a.holiday ? 1 : 0)) || (a.s - b.s) || ((b.e - b.s) - (a.e - a.s)))
      const lanes = []
      for (const sp of spans) {
        let l = 0
        while ((lanes[l] || []).some((o) => !(sp.s > o.e || sp.e < o.s))) l++
        if (!lanes[l]) lanes[l] = []
        lanes[l].push(sp)
        sp.lane = l
      }
      return spans
    })
  }, [weeks, events])

  function moveMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  function openAddForm() {
    setEditingId(null)
    setForm({ title: '', time: '', memo: '', startDate: selected || today, endDate: '', repeat: 'none' })
    setAdding(true)
  }

  function startEdit(ev) {
    setEditingId(ev.id)
    setForm({
      title: ev.title || '',
      time: ev.time || '',
      memo: ev.memo || '',
      startDate: ev.date || selected || today,
      endDate: ev.endDate || '',
      repeat: ev.repeat || 'none'
    })
    setAdding(true)
  }

  // 캘린더에서 기간 잡기: 첫날 탭 → 마지막 날 탭
  function handleRangeTap(ds) {
    if (rangeMode === 'start') {
      setForm((f) => ({ ...f, startDate: ds, endDate: '' }))
      setRangeMode('end')
      return
    }
    const start = form.startDate
    if (!start || ds < start) {
      // 시작일보다 앞을 탭하면 시작일을 다시 잡는다
      setForm((f) => ({ ...f, startDate: ds, endDate: '' }))
      return
    }
    setForm((f) => ({ ...f, endDate: ds === start ? '' : ds, repeat: 'none' }))
    setSelected(start)
    setRangeMode(null)
  }

  async function saveEvent() {
    if (!form.title.trim()) return
    const start = form.startDate || selected || today
    const multiEnd = form.repeat === 'none' && form.endDate && form.endDate > start ? form.endDate : null
    const payload = {
      title: form.title.trim(),
      date: start,
      endDate: multiEnd,
      repeat: form.repeat,
      time: form.time || null,
      memo: form.memo.trim()
    }
    if (editingId) {
      await updateDoc(doc(db, 'families', familyId, 'events', editingId), payload)
    } else {
      await addDoc(collection(db, 'families', familyId, 'events'), {
        ...payload,
        owner: user.uid,
        ownerName: profile?.name || '',
        createdAt: serverTimestamp()
      })
    }
    setForm({ title: '', time: '', memo: '', startDate: '', endDate: '', repeat: 'none' })
    setEditingId(null)
    setAdding(false)
  }

  // 복사 시작: 시트를 닫고 대상 날짜를 캘린더에서 탭
  function startCopy(ev) {
    setCopySrc(ev)
    setSelected(null)
    setAdding(false)
  }

  async function doCopy(ds) {
    const src = copySrc
    setCopySrc(null)
    await addDoc(collection(db, 'families', familyId, 'events'), {
      title: src.title,
      date: ds,
      endDate: null, // 복사본은 하루짜리로 (원하면 옮긴 뒤 수정)
      repeat: 'none',
      time: src.time || null,
      memo: src.memo || '',
      owner: user.uid,
      ownerName: profile?.name || '',
      createdAt: serverTimestamp()
    })
    setSelected(ds)
  }

  // 브라우저 확인 창 대신 두 번 탭 방식 (카톡 인앱 브라우저에서도 동작)
  function removeEvent(ev) {
    if (armDelete !== ev.id) {
      setArmDelete(ev.id)
      setTimeout(() => setArmDelete((a) => (a === ev.id ? null : a)), 4000)
      return
    }
    deleteDoc(doc(db, 'families', familyId, 'events', ev.id))
    setArmDelete(null)
  }

  const selectedEvents = useMemo(() => {
    if (!selected) return []
    return (events || [])
      .filter((e) => occursOn(e, selected))
      .sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1))
  }, [events, selected])

  return (
    <div className="pt-5 pb-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4 px-4">
        <div>
          <h1 className="text-[25px] font-extrabold tracking-tight">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h1>
          <p className="text-[13.5px] font-semibold text-muted">가족 일정</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => moveMonth(-1)} aria-label="이전 달"
            className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line grid place-items-center text-[18px] font-bold press">‹</button>
          <button onClick={() => moveMonth(1)} aria-label="다음 달"
            className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line grid place-items-center text-[18px] font-bold press">›</button>
        </div>
      </div>

      {rangeMode && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-accent-soft rounded-card px-3.5 py-3">
          <span className="flex-1 text-[13.5px] font-bold leading-snug">
            {rangeMode === 'start'
              ? '📅 일정의 첫날을 탭하세요'
              : `${formatShortDate(form.startDate)}부터 — 마지막 날을 탭하세요 (같은 날 = 하루)`}
          </span>
          <button onClick={() => setRangeMode(null)} className="text-[13px] font-extrabold text-accent press shrink-0">취소</button>
        </div>
      )}

      {copySrc && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-accent-soft rounded-card px-3.5 py-3">
          <span className="flex-1 text-[13.5px] font-bold leading-snug">
            📋 '{copySrc.title}'을(를) 복사할 날짜를 탭하세요
          </span>
          <button onClick={() => setCopySrc(null)} className="text-[13px] font-extrabold text-accent press shrink-0">취소</button>
        </div>
      )}

      <div
        className="bg-card border-y border-line overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={panDown}
        onPointerMove={panMove}
        onPointerUp={panUp}
        onPointerCancel={panUp}
        onClickCapture={(e) => {
          if (swipe.current.suppress) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        <div style={{ transform: `translateX(${panX}px)`, transition: panAnim ? 'transform .18s ease' : 'none' }}>
        <div className="grid grid-cols-7 border-b border-line">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[11.5px] font-bold py-1.5 ${
              i === 0 ? 'text-danger' : i === 6 ? 'text-[#3B82F6]' : 'text-muted'
            }`}>{d}</div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const spans = weekSpans[wi]
          const laneCount = Math.min(MAX_LANES, spans.reduce((m, sp) => Math.max(m, sp.lane + 1), 0))
          const height = Math.max(NUM_ROW + laneCount * BAR_H + 6, MIN_WEEK_H)
          return (
            <div key={wi} className="relative border-b border-line last:border-b-0" style={{ height }}>
              <div className="grid grid-cols-7 h-full">
                {week.map((cell, ci) => {
                  if (!cell) return <div key={ci} />
                  const ds = toDateStr(cell)
                  const isToday = ds === today
                  const isSelected = ds === selected && !rangeMode
                  const isHoliday = !!getHoliday(ds)
                  const inRange = rangeMode && form.startDate &&
                    ds >= form.startDate && ds <= (form.endDate || form.startDate)
                  return (
                    <button
                      key={ci}
                      onClick={() => (copySrc ? doCopy(ds) : rangeMode ? handleRangeTap(ds) : setSelected(ds))}
                      className={`relative h-full ${isSelected || inRange ? 'bg-accent-soft/60' : ''}`}
                    >
                      <span
                        className={`absolute top-1 left-1/2 -translate-x-1/2 grid place-items-center w-[24px] h-[24px] rounded-full text-[14px] ${
                          isToday
                            ? 'bg-accent text-white font-extrabold'
                            : isHoliday || ci === 0 ? 'text-danger font-semibold' : ci === 6 ? 'text-[#3B82F6] font-semibold' : 'font-semibold'
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>
              {spans.filter((sp) => sp.lane < MAX_LANES).map((sp, si) => (
                <div
                  key={si}
                  className="absolute pointer-events-none text-white text-[11.5px] font-bold truncate px-1.5"
                  style={{
                    left: `calc(${(sp.s / 7) * 100}% + 1.5px)`,
                    width: `calc(${((sp.e - sp.s + 1) / 7) * 100}% - 3px)`,
                    top: NUM_ROW + sp.lane * BAR_H,
                    height: BAR_H - 3,
                    lineHeight: `${BAR_H - 3}px`,
                    borderRadius: 6,
                    background: sp.holiday ? 'rgb(var(--ff-danger))' : (members[sp.ev.owner]?.color || 'rgb(var(--ff-accent))')
                  }}
                >
                  {sp.holiday || sp.ev.title}
                </div>
              ))}
            </div>
          )
        })}
        </div>
      </div>

      <p className="text-[12px] font-semibold text-muted/70 text-center mt-3 px-4">
        옆으로 밀면 달 이동 · 날짜를 누르면 일정 보기 · 막대 색은 등록한 가족
      </p>

      <BottomSheet open={!!selected && !rangeMode} onClose={() => { setSelected(null); setAdding(false); setEditingId(null) }} title={selected ? `${formatShortDate(selected)} 📌` : ''}>
        <div className="flex flex-col gap-2.5 mb-4">
          {selected && getHoliday(selected) && (
            <div className="flex items-center gap-2.5 rounded-card px-3.5 py-3 bg-danger/10">
              <span className="text-[18px]">🎌</span>
              <span className="text-[14.5px] font-extrabold text-danger">{getHoliday(selected)}</span>
            </div>
          )}
          {selectedEvents.length === 0 && !adding && (
            <p className="text-[14.5px] font-semibold text-muted text-center py-4">일정이 없어요</p>
          )}
          {selectedEvents.map((ev) => {
            const owner = members[ev.owner]
            const mine = ev.owner === user.uid
            return (
              <div key={ev.id} className="bg-alt rounded-card px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11.5px] font-extrabold text-white px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
                    style={{ background: owner?.color || 'rgb(var(--ff-accent))' }}
                  >
                    {ev.time || '종일'}
                  </span>
                  {mine ? (
                    <button onClick={() => startEdit(ev)} className="flex-1 min-w-0 text-left press">
                      <p className="text-[14.5px] font-bold truncate">{ev.title} <span className="text-accent text-[12px] font-bold">수정 ›</span></p>
                      <p className="text-[12px] font-semibold text-muted mt-0.5 truncate">
                        {owner?.name || '가족'}
                        {eventExtraLabel(ev) && ` · ${eventExtraLabel(ev)}`}
                        {ev.memo && ` · ${ev.memo}`}
                      </p>
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold truncate">{ev.title}</p>
                      <p className="text-[12px] font-semibold text-muted mt-0.5 truncate">
                        {owner?.name || '가족'}
                        {eventExtraLabel(ev) && ` · ${eventExtraLabel(ev)}`}
                        {ev.memo && ` · ${ev.memo}`}
                      </p>
                    </div>
                  )}
                  {mine && (
                    <button
                      onClick={() => removeEvent(ev)}
                      className={`text-[13px] font-bold px-2 py-2 press whitespace-nowrap shrink-0 ${
                        armDelete === ev.id ? 'text-white bg-danger rounded-btn font-extrabold' : 'text-muted'
                      }`}
                    >
                      {armDelete === ev.id ? '한 번 더 탭!' : '삭제'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => startCopy(ev)} className="text-[12.5px] font-bold text-accent bg-card border border-line rounded-full px-3 py-1.5 press">
                    📋 다른 날로 복사
                  </button>
                  {mine && (
                    <span className="text-[11.5px] font-semibold text-muted self-center">일정을 눌러 날짜·내용 수정</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="flex flex-col gap-3">
            {editingId && <p className="text-[13px] font-extrabold text-accent">✏️ 일정 수정</p>}
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="일정 제목 (예: 병원 예약)"
              className="bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold outline-none focus:border-accent"
            />
            <div>
              <p className="text-[12.5px] font-bold text-muted mb-1.5">기간</p>
              <button
                onClick={() => {
                  setForm((f) => ({ ...f, startDate: f.startDate || selected || today }))
                  setRangeMode('start')
                }}
                disabled={form.repeat !== 'none'}
                className="w-full flex items-center justify-between gap-2 bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[14px] font-bold press disabled:opacity-40"
              >
                <span className="truncate">
                  📅 {formatShortDate(form.startDate || selected || today)}
                  {form.endDate ? ` → ${formatShortDate(form.endDate)}` : ' · 하루'}
                </span>
                <span className="text-accent text-[12.5px] font-extrabold whitespace-nowrap shrink-0">캘린더에서 잡기</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[13px] font-bold text-muted shrink-0">시간 (비우면 종일)</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-alt border-[1.5px] border-line rounded-btn px-3 py-2.5 text-[15px] font-semibold flex-1 outline-none focus:border-accent"
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-muted mb-2">반복</p>
              <div className="flex gap-1.5 flex-wrap">
                {REPEATS.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, repeat: key, endDate: key === 'none' ? form.endDate : '' })}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-bold press border-[1.5px] ${
                      form.repeat === key ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="메모 (선택)"
              className="bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button onClick={() => { setAdding(false); setEditingId(null) }} className="w-[90px] py-3.5 rounded-2xl border-[1.5px] border-line text-[14.5px] font-bold press">취소</button>
              <button
                onClick={saveEvent}
                disabled={!form.title.trim()}
                className="flex-1 py-3.5 rounded-2xl text-[15px] font-extrabold text-white bg-accent press disabled:opacity-40"
                style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
              >
                {editingId ? '저장' : '일정 추가'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAddForm}
            className="w-full py-4 rounded-2xl text-[15.5px] font-extrabold text-white bg-accent press"
            style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
          >
            ＋ 일정 추가
          </button>
        )}
      </BottomSheet>
    </div>
  )
}
