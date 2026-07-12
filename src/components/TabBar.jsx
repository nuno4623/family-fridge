const TABS = [
  { key: 'home', icon: '🏠', label: '홈' },
  { key: 'fridge', icon: '🥕', label: '냉장고' },
  { key: 'calendar', icon: '📅', label: '캘린더' },
  { key: 'memo', icon: '📝', label: '메모' }
]

export default function TabBar({ tab, onChange, badges = {}, onFab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/85 backdrop-blur-xl border-t border-line z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-lg mx-auto relative px-2 pt-1">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[56px] press relative transition-all ${
              tab === t.key ? '-translate-y-px' : 'opacity-50 grayscale-[.5]'
            } ${i === 1 ? 'mr-8' : ''} ${i === 2 ? 'ml-8' : ''}`}
          >
            <span className="text-[21px] leading-none relative">
              {t.icon}
              {badges[t.key] > 0 && (
                <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-danger rounded-full" />
              )}
            </span>
            <span className={`text-[11px] font-bold ${tab === t.key ? 'text-accent' : 'text-muted'}`}>
              {t.label}
            </span>
          </button>
        ))}
        <button
          onClick={onFab}
          aria-label="추가"
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-[58px] h-[58px] rounded-full border-4 border-bg text-white text-[28px] font-light leading-none press z-10"
          style={{
            background: 'linear-gradient(145deg, rgb(var(--ff-accent)), rgb(var(--ff-accent-deep)))',
            boxShadow: '0 8px 22px rgb(var(--ff-accent) / .5)'
          }}
        >
          ＋
        </button>
      </div>
    </nav>
  )
}
