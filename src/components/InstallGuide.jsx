import BottomSheet from './BottomSheet'

export default function InstallGuide({ open, onClose }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="📲 홈 화면에 추가하기">
      <ol className="flex flex-col gap-4 text-[17px]">
        <li className="flex gap-3 items-start">
          <span className="bg-peach w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-[15px]">1</span>
          <span>Safari 하단의 <b>공유 버튼</b> <span className="inline-block border border-ink/30 rounded px-1.5 text-[14px]">↑</span> 을 눌러요</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="bg-peach w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-[15px]">2</span>
          <span>아래로 내려서 <b>"홈 화면에 추가"</b>를 눌러요</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="bg-peach w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-[15px]">3</span>
          <span>오른쪽 위 <b>"추가"</b>를 누르면 끝!</span>
        </li>
      </ol>
      <p className="mt-5 text-[15px] text-ink/50 bg-bg rounded-btn p-3">
        홈 화면에서 열어야 푸시 알림을 받을 수 있어요 (iOS 16.4 이상).
        알림은 설정 ⚙️ 에서 켤 수 있어요.
      </p>
      <button onClick={onClose} className="w-full mt-5 bg-ink text-bg rounded-btn py-3.5 text-[16px] font-bold press">
        알겠어요
      </button>
    </BottomSheet>
  )
}
