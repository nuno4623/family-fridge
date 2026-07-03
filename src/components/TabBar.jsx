const TABS = [
  { key: 'home', icon: '🏠', label: '홈' },
  { key: 'fridge', icon: '🥕', label: '냉장고' },
  { key: 'calendar', icon: '📅', label: '캘린더' },
  { key: 'memo', icon: '📝', label: '메모' }
]

export default function TabBar({ tab, onChange, badges = {} }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-ink/10 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[56px] press relative ${
              tab === t.key ? 'text-ink' : 'text-ink/40'
            }`}
          >
            <span className="text-[22px] leading-none relative">
              {t.icon}
              {badges[t.key] > 0 && (
                <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-400 rounded-full" />
              )}
            </span>
            <span className={`text-[12px] ${tab === t.key ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
