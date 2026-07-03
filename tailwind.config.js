/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FBFAF7',
        card: '#FFFFFF',
        ink: '#4A4238',
        peach: '#FFD9C8',
        butter: '#FFF3C4',
        mint: '#CDEBDD',
        rose: '#F9CFD6',
        lavender: '#DDD6F3',
        sky: '#CFE5F4'
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '16px',
        btn: '12px'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06)'
      }
    }
  },
  plugins: []
}
