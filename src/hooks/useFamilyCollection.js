import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * families/{familyId}/{name} 서브컬렉션 실시간 구독.
 * onRemoteChange(change): 첫 스냅샷 이후 다른 사람이 만든 변경에 대한 콜백 (토스트용).
 */
export function useFamilyCollection(familyId, name, orderField, onRemoteChange) {
  const [docs, setDocs] = useState(null) // null = 로딩 중
  const firstLoad = useRef(true)
  const callbackRef = useRef(onRemoteChange)
  callbackRef.current = onRemoteChange

  useEffect(() => {
    if (!familyId) { setDocs(null); return }
    firstLoad.current = true
    const q = orderField
      ? query(collection(db, 'families', familyId, name), orderBy(orderField, 'desc'))
      : collection(db, 'families', familyId, name)
    return onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setDocs(list)
      if (!firstLoad.current && callbackRef.current) {
        snap.docChanges().forEach((change) => {
          if (!change.doc.metadata.hasPendingWrites) {
            callbackRef.current(change)
          }
        })
      }
      firstLoad.current = false
    })
  }, [familyId, name, orderField])

  return docs
}
