/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 테마 시스템 (src/theme.jsx가 CSS 변수로 주입)
        bg: 'rgb(var(--ff-bg) / <alpha-value>)',
        alt: 'rgb(var(--ff-alt) / <alpha-value>)',
        card: 'rgb(var(--ff-surface) / <alpha-value>)',
        ink: 'rgb(var(--ff-text) / <alpha-value>)',
        muted: 'rgb(var(--ff-muted) / <alpha-value>)',
        accent: 'rgb(var(--ff-accent) / <alpha-value>)',
        'accent-deep': 'rgb(var(--ff-accent-deep) / <alpha-value>)',
        'accent-soft': 'rgb(var(--ff-accent-soft) / <alpha-value>)',
        line: 'rgb(var(--ff-line) / <alpha-value>)',
        good: 'rgb(var(--ff-good) / <alpha-value>)',
        warn: 'rgb(var(--ff-warn) / <alpha-value>)',
        danger: 'rgb(var(--ff-danger) / <alpha-value>)',
        // peach는 기존 코드 호환용 별칭 → 액센트
        peach: 'rgb(var(--ff-accent) / <alpha-value>)',
        // 포스트잇 색 (데이터 값이라 테마와 무관하게 유지)
        butter: '#FFF3C4',
        mint: '#CDEBDD',
        rose: '#F9CFD6',
        lavender: '#DDD6F3',
        sky: '#CFE5F4'
      },
      fontFamily: {
        sans: ['var(--ff-font)', '-apple-system', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '18px',
        tile: '22px',
        btn: '14px',
        hero: '26px'
      },
      boxShadow: {
        card: 'var(--ff-shadow)',
        soft: '0 1px 3px rgba(0,0,0,.06)'
      }
    }
  },
  plugins: []
}
