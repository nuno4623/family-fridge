// 디자인 시스템 카드 생성기.
// design-system/ 아래에 카드별 독립 HTML(@dsCard 마커 포함, 클로드 디자인 업로드용)과
// 전체를 한 페이지로 보는 preview.html 갤러리를 만든다.
import { writeFileSync, mkdirSync } from 'node:fs'

const TOKENS = `
:root{--bg:#FBFAF7;--card:#FFFFFF;--ink:#4A4238;--peach:#FFD9C8;--butter:#FFF3C4;--mint:#CDEBDD;--rose:#F9CFD6;--lavender:#DDD6F3;--sky:#CFE5F4}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard Variable',Pretendard,-apple-system,system-ui,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:var(--bg);color:var(--ink);font-size:17px;line-height:1.5}
.card{background:var(--card);border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:10px 16px;font-size:15px;font-weight:700;border:none;min-width:88px;font-family:inherit;color:var(--ink)}
.btn{border:none;border-radius:12px;font-family:inherit;font-weight:700;font-size:16px;color:var(--ink);padding:14px 20px;cursor:pointer}
.dot{display:inline-block;width:12px;height:12px;border-radius:999px;flex-shrink:0}
.muted{color:rgba(74,66,56,.5)}
.row{display:flex;align-items:center;gap:12px}
.col{display:flex;flex-direction:column;gap:12px}
`

const FONT_LINK = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">'

const cards = [
  {
    file: 'foundations/colors.html',
    group: '파운데이션',
    title: '컬러 토큰',
    subtitle: '냉장고 문에 붙인 것들 — 웜 화이트 + 파스텔',
    width: 420,
    body: `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
  ${[
    ['--bg', '#FBFAF7', '배경 · 냉장고 문'],
    ['--card', '#FFFFFF', '카드 · 종이'],
    ['--ink', '#4A4238', '글자 (순검정 금지)'],
    ['--peach', '#FFD9C8', '주 액센트 · CTA'],
    ['--butter', '#FFF3C4', "포스트잇 · '곧 떨어짐'"],
    ['--mint', '#CDEBDD', "'충분' · 성공"],
    ['--rose', '#F9CFD6', "'떨어짐' · 멤버1"],
    ['--lavender', '#DDD6F3', '캘린더 · 멤버2'],
    ['--sky', '#CFE5F4', '멤버3']
  ].map(([name, hex, use]) => `
  <div class="card" style="overflow:hidden">
    <div style="height:56px;background:${hex};${hex === '#FFFFFF' ? 'border-bottom:1px solid rgba(74,66,56,.08)' : ''}"></div>
    <div style="padding:10px 12px">
      <div style="font-weight:700;font-size:14px">${name}</div>
      <div class="muted" style="font-size:12px">${hex} · ${use}</div>
    </div>
  </div>`).join('')}
</div>`
  },
  {
    file: 'foundations/type.html',
    group: '파운데이션',
    title: '타이포그래피',
    subtitle: 'Pretendard Variable · 본문 17px 이상 (시어머니 가독성)',
    width: 420,
    body: `
<div class="col" style="gap:20px">
  <div><div style="font-size:24px;font-weight:700">7월 3일 금요일</div><div class="muted" style="font-size:12px">화면 제목 · 24px · 700</div></div>
  <div><div style="font-size:19px;font-weight:700">바텀시트 제목</div><div class="muted" style="font-size:12px">19px · 700</div></div>
  <div><div style="font-size:17px;font-weight:500">항목 이름 · 본문은 17px 아래로 내려가지 않아요</div><div class="muted" style="font-size:12px">본문 · 17px · 500</div></div>
  <div><div style="font-size:15px;font-weight:700">버튼 · 상태 라벨</div><div class="muted" style="font-size:12px">15px · 700</div></div>
  <div><div style="font-size:13px;color:rgba(74,66,56,.5)">보조 설명 · 2시간 전</div><div class="muted" style="font-size:12px">캡션 · 13px</div></div>
</div>`
  },
  {
    file: 'components/status-pills.html',
    group: '냉장고',
    title: '상태 알약',
    subtitle: '탭 한 번으로 순환: 충분 → 곧 떨어짐 → 떨어짐',
    width: 420,
    body: `
<div class="row" style="flex-wrap:wrap">
  <button class="pill" style="background:var(--mint)">충분</button>
  <button class="pill" style="background:var(--butter)">곧 떨어짐</button>
  <button class="pill" style="background:var(--rose)">떨어짐</button>
  <button class="pill" style="background:var(--peach)">장바구니</button>
</div>
<p class="muted" style="font-size:13px;margin-top:14px">누르면 scale(0.96)으로 살짝 눌립니다</p>`
  },
  {
    file: 'components/item-rows.html',
    group: '냉장고',
    title: '식재료 행',
    subtitle: '재고 목록 / 사야 할 것 (담기 버튼)',
    width: 420,
    body: `
<div class="col">
  <div class="card row" style="padding:12px 16px;min-height:56px">
    <div style="flex:1"><div style="font-weight:500">계란</div><div class="muted" style="font-size:13px">30구짜리로</div></div>
    <button class="pill" style="background:var(--rose)">떨어짐</button>
  </div>
  <div class="card row" style="padding:12px 16px;min-height:56px">
    <div style="flex:1;font-weight:500">우유</div>
    <button class="pill" style="background:var(--butter)">곧 떨어짐</button>
    <button class="pill" style="background:var(--peach);min-width:0">담기</button>
  </div>
</div>`
  },
  {
    file: 'components/shopping-check.html',
    group: '냉장고',
    title: '장보기 모드',
    subtitle: '마트에서 쓰는 큰 체크박스 + 일괄 완료',
    width: 420,
    body: `
<div class="col">
  <div class="card row" style="padding:16px;min-height:64px;gap:16px">
    <span style="width:32px;height:32px;border-radius:10px;background:var(--mint);display:flex;align-items:center;justify-content:center;font-size:18px">✓</span>
    <span style="font-size:19px;font-weight:500;text-decoration:line-through;color:rgba(74,66,56,.35);flex:1">두부</span>
  </div>
  <div class="card row" style="padding:16px;min-height:64px;gap:16px">
    <span style="width:32px;height:32px;border-radius:10px;border:2px solid rgba(74,66,56,.25)"></span>
    <span style="font-size:19px;font-weight:500;flex:1">참기름</span>
    <span class="muted" style="font-size:14px">작은 병</span>
  </div>
  <button class="btn" style="background:var(--peach);font-size:18px;margin-top:8px">장보기 완료 (1개 냉장고에 넣기)</button>
</div>`
  },
  {
    file: 'components/segment-tabs.html',
    group: '냉장고',
    title: '세그먼트 탭',
    subtitle: '재고 / 사야 할 것 / 장보기 모드 (+뱃지)',
    width: 420,
    body: `
<div style="display:flex;background:rgba(74,66,56,.05);border-radius:12px;padding:4px;gap:4px">
  <div style="flex:1;text-align:center;padding:10px;border-radius:9px;background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,.06);font-weight:700;font-size:15px">재고</div>
  <div style="flex:1;text-align:center;padding:10px;font-weight:700;font-size:15px;color:rgba(74,66,56,.45)">사야 할 것</div>
  <div style="flex:1;text-align:center;padding:10px;font-weight:700;font-size:15px;color:rgba(74,66,56,.45);position:relative">장보기 모드
    <span style="position:absolute;top:4px;right:6px;min-width:18px;height:18px;background:var(--peach);border-radius:999px;font-size:11px;display:inline-flex;align-items:center;justify-content:center;color:var(--ink)">2</span>
  </div>
</div>`
  },
  {
    file: 'components/event-cards.html',
    group: '캘린더 · 메모',
    title: '일정 카드',
    subtitle: '멤버 색상 점으로 누구 일정인지 구분',
    width: 420,
    body: `
<div class="col">
  <div class="card row" style="padding:14px 16px">
    <span class="dot" style="background:var(--mint)"></span>
    <div style="flex:1"><div style="font-weight:700">병원 예약</div><div class="muted" style="font-size:14px">오늘 · 14:00 · 어머님</div></div>
  </div>
  <div class="card row" style="padding:14px 16px">
    <span class="dot" style="background:var(--rose)"></span>
    <div style="flex:1"><div style="font-weight:700">마트 같이 가기</div><div class="muted" style="font-size:14px">내일 · 10:30 · 지선</div></div>
  </div>
</div>`
  },
  {
    file: 'components/memo-cards.html',
    group: '캘린더 · 메모',
    title: '포스트잇 메모',
    subtitle: '자석 도트(멤버 색) + 4색 + 고정 핀',
    width: 420,
    body: `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
  ${[
    ['var(--butter)', 'var(--rose)', '분리수거는 목요일 아침! 🗑', '지선 · 3일 전', true],
    ['var(--rose)', 'var(--mint)', '고등어 손질해서 냉동칸에', '어머님 · 6시간 전', false],
    ['var(--mint)', 'var(--rose)', '주말에 다 같이 장보러 가요~', '지선 · 1일 전', false],
    ['var(--lavender)', 'var(--sky)', '정수기 필터 교체 예약함', '준호 · 1일 전', false]
  ].map(([bg, dot, text, meta, pinned]) => `
  <div style="background:${bg};border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:20px 16px 12px;position:relative">
    <span style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:999px;background:${dot};border:2px solid rgba(255,255,255,.8);box-shadow:0 1px 2px rgba(0,0,0,.15)"></span>
    ${pinned ? '<span style="position:absolute;top:6px;right:8px;font-size:14px">📌</span>' : ''}
    <div style="font-size:16px">${text}</div>
    <div class="muted" style="font-size:12px;margin-top:8px">${meta}</div>
  </div>`).join('')}
</div>`
  },
  {
    file: 'components/summary-cards.html',
    group: '홈',
    title: '홈 요약 카드',
    subtitle: '장보기 요약(피치) · 새 소식(버터)',
    width: 420,
    body: `
<div class="col">
  <div style="background:var(--peach);border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px">
    <div style="font-weight:700">🛒 사야 할 것 3개</div>
    <div style="font-size:15px;color:rgba(74,66,56,.7);margin-top:2px">계란, 우유, 두부</div>
  </div>
  <div style="background:var(--butter);border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px">
    <div style="font-weight:700;font-size:16px">🔔 그동안 새 소식</div>
    <div style="font-size:15px;color:rgba(74,66,56,.7);margin-top:2px">식재료 변경 2건 · 새 메모 1개</div>
  </div>
</div>`
  },
  {
    file: 'components/buttons-inputs.html',
    group: '공통 UI',
    title: '버튼 · 입력 · 토글',
    subtitle: 'CTA / 보조 / 다크 버튼, 입력창, 스위치',
    width: 420,
    body: `
<div class="col" style="gap:16px">
  <div class="row" style="flex-wrap:wrap">
    <button class="btn" style="background:var(--peach)">일정 추가</button>
    <button class="btn" style="background:var(--card);border:1px solid rgba(74,66,56,.15)">뒤로</button>
    <button class="btn" style="background:var(--ink);color:var(--bg)">알겠어요</button>
    <button class="btn" style="background:var(--peach);opacity:.4">비활성</button>
  </div>
  <div class="row">
    <input placeholder="식재료 이름 (예: 계란)" style="flex:1;background:var(--card);border:1px solid rgba(74,66,56,.15);border-radius:12px;padding:12px 16px;font-size:16px;font-family:inherit;color:var(--ink)">
    <button class="btn" style="background:var(--peach);padding:12px 20px">추가</button>
  </div>
  <div class="row" style="gap:24px">
    <span class="row" style="gap:8px"><span style="width:52px;height:32px;border-radius:999px;background:var(--mint);position:relative;display:inline-block"><span style="position:absolute;top:4px;left:24px;width:24px;height:24px;background:var(--card);border-radius:999px;box-shadow:0 1px 2px rgba(0,0,0,.15)"></span></span><span style="font-size:15px">켜짐</span></span>
    <span class="row" style="gap:8px"><span style="width:52px;height:32px;border-radius:999px;background:rgba(74,66,56,.15);position:relative;display:inline-block"><span style="position:absolute;top:4px;left:4px;width:24px;height:24px;background:var(--card);border-radius:999px;box-shadow:0 1px 2px rgba(0,0,0,.15)"></span></span><span style="font-size:15px">꺼짐</span></span>
  </div>
</div>`
  },
  {
    file: 'components/tabbar.html',
    group: '공통 UI',
    title: '하단 탭바',
    subtitle: '아이콘 + 한글 라벨 항상 표시 · 뱃지 도트',
    width: 420,
    body: `
<div class="card" style="border-radius:0;border-top:1px solid rgba(74,66,56,.1);display:flex">
  ${[
    ['🏠', '홈', true, false],
    ['🥕', '냉장고', false, true],
    ['📅', '캘린더', false, false],
    ['📝', '메모', false, false]
  ].map(([icon, label, active, badge]) => `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;min-height:56px;${active ? '' : 'opacity:.4'}">
    <span style="font-size:22px;position:relative">${icon}${badge ? '<span style="position:absolute;top:-4px;right:-8px;width:10px;height:10px;background:#F87171;border-radius:999px"></span>' : ''}</span>
    <span style="font-size:12px;font-weight:${active ? 700 : 500}">${label}</span>
  </div>`).join('')}
</div>`
  },
  {
    file: 'components/toast-sheet.html',
    group: '공통 UI',
    title: '토스트 · 바텀시트',
    subtitle: '실시간 알림 토스트, 시트 그랩바',
    width: 420,
    body: `
<div class="col" style="gap:20px;align-items:center">
  <div style="background:var(--ink);color:var(--bg);font-size:16px;font-weight:500;padding:12px 20px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.15)">방금 준호님이 '우유' 담았어요 🛒</div>
  <div style="background:var(--ink);color:var(--bg);font-size:16px;font-weight:500;padding:12px 20px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.15)">냉장고 채웠어요 🎉</div>
  <div class="card" style="width:100%;border-radius:24px 24px 0 0;padding:20px;box-shadow:0 -4px 20px rgba(0,0,0,.08)">
    <div style="width:40px;height:4px;background:rgba(74,66,56,.15);border-radius:999px;margin:0 auto 16px"></div>
    <div style="font-size:19px;font-weight:700">7월 10일 (금)</div>
    <div class="muted" style="font-size:15px;margin-top:4px">바텀시트 — 날짜 탭 시 일정 목록</div>
  </div>
</div>`
  }
]

function cardDoc(card) {
  return `<!-- @dsCard group="${card.group}" -->
<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.title}</title>
${FONT_LINK}
<style>${TOKENS}body{padding:24px}</style>
</head>
<body>
${card.body}
</body>
</html>
`
}

mkdirSync('design-system/foundations', { recursive: true })
mkdirSync('design-system/components', { recursive: true })

for (const card of cards) {
  writeFileSync(`design-system/${card.file}`, cardDoc(card))
  console.log(`design-system/${card.file}`)
}

// 한 페이지 갤러리 (아티팩트 게시용 — head/body 없이 프래그먼트)
const groups = [...new Set(cards.map((c) => c.group))]
const gallery = `<title>우리집 냉장고 — 디자인 시스템</title>
<style>${TOKENS}
body{padding:32px 20px;max-width:960px;margin:0 auto}
h1{font-size:26px;font-weight:700}
h2{font-size:15px;font-weight:700;color:rgba(74,66,56,.5);margin:36px 0 14px;letter-spacing:.04em}
.ds-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.ds-card{background:var(--card);border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;border:1px solid rgba(74,66,56,.06)}
.ds-card-head{padding:14px 18px;border-bottom:1px solid rgba(74,66,56,.08)}
.ds-card-head b{font-size:15px}
.ds-card-head span{display:block;font-size:12px;color:rgba(74,66,56,.5);margin-top:2px}
.ds-card-body{padding:20px 18px;background:var(--bg)}
</style>
<h1>🧊 우리집 냉장고 — 디자인 시스템</h1>
<p class="muted" style="font-size:14px;margin-top:6px">컨셉: 냉장고 문에 자석으로 붙여둔 메모지 · Pretendard · 본문 17px+ · 터치 48px+ · 라이트 전용</p>
${groups.map((g) => `
<h2>${g.toUpperCase()}</h2>
<div class="ds-grid">
${cards.filter((c) => c.group === g).map((c) => `
<div class="ds-card">
  <div class="ds-card-head"><b>${c.title}</b><span>${c.subtitle}</span></div>
  <div class="ds-card-body">${c.body}</div>
</div>`).join('')}
</div>`).join('')}
`
writeFileSync('design-system/preview.html', gallery)
console.log('design-system/preview.html (갤러리)')
