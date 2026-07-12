// 디자인 시스템 카드 생성기 — "디자인 테마 및 폰트 개선" 핸드오프 기준.
// design-system/ 아래에 카드별 독립 HTML(@dsCard 마커 포함, 클로드 디자인 업로드용)과
// 전체를 한 페이지로 보는 preview.html 갤러리를 만든다.
import { writeFileSync, mkdirSync } from 'node:fs'

const THEMES = [
  ['오렌지 (기본)', '#FF6B35', '#FBF3EE', '#F5EDE7', '#E8551F', '#FFE2D4', '#F0E6DE'],
  ['옐로', '#F5B21C', '#FDF8EB', '#F7F0DE', '#E09A05', '#FCEAC0', '#F1E7CE'],
  ['그린', '#2E9E5B', '#EFF6F1', '#E4F0E8', '#1F7E45', '#D4EDDD', '#DDECE2'],
  ['핑크', '#FF5C8A', '#FDF0F4', '#F7E4EB', '#E83E6E', '#FFD9E4', '#F5DCE4'],
  ['네이비', '#1F3A5F', '#EEF1F6', '#E3E8F0', '#152A47', '#D6DEEA', '#E1E6EF']
]

// 미리보기는 기본(오렌지) 테마로 렌더
const TOKENS = `
:root{--bg:#FBF3EE;--alt:#F5EDE7;--surface:#FFFFFF;--text:#1B2740;--muted:#8C96A8;
--accent:#FF6B35;--accent-deep:#E8551F;--accent-soft:#FFE2D4;--line:#F0E6DE;
--good:#2E9E5B;--warn:#F2A81D;--danger:#F0524B;
--shadow:0 12px 30px rgba(255,107,53,.14)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Gothic A1',-apple-system,system-ui,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:var(--bg);color:var(--text);font-size:15px;line-height:1.5}
.card{background:var(--surface);border-radius:18px;border:1px solid var(--line);box-shadow:var(--shadow)}
.badge{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:5px 10px;font-size:12px;font-weight:800;color:#fff;border:none;white-space:nowrap}
.btn{border:none;border-radius:16px;font-family:inherit;font-weight:800;font-size:15.5px;color:#fff;background:var(--accent);padding:15px 20px;cursor:pointer;box-shadow:0 8px 20px rgba(255,107,53,.4)}
.tile{width:44px;height:44px;border-radius:13px;background:var(--alt);display:grid;place-items:center;font-size:23px;flex-shrink:0}
.muted{color:var(--muted)}
.row{display:flex;align-items:center;gap:12px}
.col{display:flex;flex-direction:column;gap:10px}
`

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;800&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">'

const cards = [
  {
    file: 'foundations/themes.html',
    group: '파운데이션',
    title: '테마 5종',
    subtitle: '설정에서 선택 — 배경·액센트·그림자가 함께 바뀜',
    body: `
<div class="col" style="gap:12px">
  ${THEMES.map(([name, accent, bg, alt, deep, soft, border]) => `
  <div style="display:flex;align-items:center;gap:12px;background:${bg};border:1px solid ${border};border-radius:16px;padding:12px 14px">
    <span style="width:34px;height:34px;border-radius:99px;background:linear-gradient(140deg,${accent},${deep});flex-shrink:0;box-shadow:0 4px 10px ${accent}55"></span>
    <div style="flex:1"><div style="font-weight:800;font-size:14px">${name}</div>
    <div class="muted" style="font-size:11.5px">accent ${accent} · bg ${bg}</div></div>
    <span style="width:22px;height:22px;border-radius:7px;background:${soft};border:1px solid ${border}"></span>
    <span style="width:22px;height:22px;border-radius:7px;background:${alt};border:1px solid ${border}"></span>
  </div>`).join('')}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
    ${[['텍스트', '#1B2740'], ['보조', '#8C96A8'], ['성공', '#2E9E5B'], ['경고', '#F2A81D'], ['위험', '#F0524B']].map(([n, c]) => `
    <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:6px 12px 6px 7px">
      <span style="width:16px;height:16px;border-radius:99px;background:${c}"></span>${n} ${c}</span>`).join('')}
  </div>
</div>`
  },
  {
    file: 'foundations/type.html',
    group: '파운데이션',
    title: '타이포그래피',
    subtitle: 'Gothic A1 / Noto Sans KR / IBM Plex Sans KR · 크기 3단계 (보통/크게/아주 크게)',
    body: `
<div class="col" style="gap:18px">
  <div><div style="font-size:25px;font-weight:800;letter-spacing:-.5px">우리 집 냉장고</div><div class="muted" style="font-size:11.5px">화면 제목 · 25px · 800</div></div>
  <div><div style="font-size:21px;font-weight:800">식재료 추가 🧺</div><div class="muted" style="font-size:11.5px">시트 제목 · 21px · 800</div></div>
  <div><div style="font-size:16px;font-weight:800">챙겨야 할 것 ⏰</div><div class="muted" style="font-size:11.5px">섹션 · 16px · 800</div></div>
  <div><div style="font-size:15px;font-weight:700">항목 이름 · 본문</div><div class="muted" style="font-size:11.5px">본문 · 15px · 700 (크기 설정 시 ×1.12 / ×1.24)</div></div>
  <div><div style="font-size:12px;font-weight:600;color:var(--muted)">준호 · 30구짜리로 · 2시간 전</div><div class="muted" style="font-size:11.5px">메타 · 12px · 600</div></div>
  <div style="display:flex;gap:14px;margin-top:2px">
    <span style="font-family:'Gothic A1';font-weight:700;font-size:14px">고딕</span>
    <span style="font-family:'Noto Sans KR';font-weight:700;font-size:14px">노토</span>
    <span style="font-family:'IBM Plex Sans KR';font-weight:600;font-size:14px">플렉스</span>
  </div>
</div>`
  },
  {
    file: 'components/hero-card.html',
    group: '홈',
    title: '히어로 카드',
    subtitle: '그라디언트 + 재고 현황 3스탯',
    body: `
<div style="border-radius:26px;padding:22px;color:#fff;background:linear-gradient(140deg,var(--accent) 0%,var(--accent-deep) 100%);box-shadow:var(--shadow)">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:12.5px;font-weight:700;opacity:.85">우리 집 냉장고 현황</div>
      <div style="font-size:35px;font-weight:800;letter-spacing:-1px;margin-top:4px">10<span style="font-size:17px;font-weight:600;opacity:.7"> 개 재고</span></div>
    </div>
    <div style="width:62px;height:62px;border-radius:99px;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:26px">🧊</div>
  </div>
  <div style="display:flex;gap:10px;margin-top:18px">
    ${[['3', '곧 떨어짐'], ['1', '떨어짐'], ['6', '살 것']].map(([n, l]) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;padding:9px 0;border-radius:14px;background:rgba(255,255,255,.18);font-size:11.5px;font-weight:600"><b style="font-size:16px">${n}</b><span style="opacity:.8">${l}</span></div>`).join('')}
  </div>
</div>`
  },
  {
    file: 'components/status-badges.html',
    group: '냉장고',
    title: '상태 배지',
    subtitle: '탭 한 번으로 순환: 충분 → 곧 떨어짐 → 떨어짐',
    body: `
<div class="row" style="flex-wrap:wrap;gap:10px">
  <button class="badge" style="background:var(--good);padding:8px 14px">충분</button>
  <button class="badge" style="background:var(--warn);padding:8px 14px">곧 떨어짐</button>
  <button class="badge" style="background:var(--danger);padding:8px 14px">떨어짐</button>
  <button class="badge" style="background:var(--accent);padding:8px 14px">장바구니</button>
</div>
<p class="muted" style="font-size:12px;margin-top:14px">흰 글씨 + 시맨틱 컬러 · 누르면 scale(0.96)</p>`
  },
  {
    file: 'components/item-rows.html',
    group: '냉장고',
    title: '식재료 행',
    subtitle: '카테고리 이모지 타일 + 상태 배지 (+담기)',
    body: `
<div class="col">
  <div class="card row" style="padding:10px 14px;min-height:56px">
    <span class="tile">🥬</span>
    <div style="flex:1"><div style="font-size:15px;font-weight:700">계란</div><div class="muted" style="font-size:12px;font-weight:600">준호 · 30구짜리로</div></div>
    <span class="badge" style="background:var(--danger)">떨어짐</span>
  </div>
  <div class="card row" style="padding:10px 14px;min-height:56px">
    <span class="tile">🧊</span>
    <div style="flex:1"><div style="font-size:15px;font-weight:700">국거리 소고기</div><div class="muted" style="font-size:12px;font-weight:600">어머님</div></div>
    <span class="badge" style="background:var(--warn)">곧 떨어짐</span>
    <span class="badge" style="background:var(--accent);box-shadow:0 4px 10px rgba(255,107,53,.4)">담기</span>
  </div>
</div>
<p class="muted" style="font-size:12px;margin-top:12px">카테고리: 냉장 🥬 · 냉동 🧊 · 실온 🥫 · 기타 🧺</p>`
  },
  {
    file: 'components/segment-pills.html',
    group: '냉장고',
    title: '세그먼트 필',
    subtitle: '활성 = 액센트 배경 + 흰 글씨 (+뱃지)',
    body: `
<div class="row" style="gap:8px;flex-wrap:wrap">
  <span style="padding:10px 16px;border-radius:99px;font-size:13.5px;font-weight:800;color:#fff;background:var(--accent);box-shadow:0 6px 16px rgba(255,107,53,.35)">재고</span>
  <span style="padding:10px 16px;border-radius:99px;font-size:13.5px;font-weight:800;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow)">사야 할 것</span>
  <span style="padding:10px 16px;border-radius:99px;font-size:13.5px;font-weight:800;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow)">장보기 모드
    <span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;margin-left:6px;border-radius:99px;font-size:11px;color:#fff;background:var(--accent)">2</span>
  </span>
</div>`
  },
  {
    file: 'components/shopping-check.html',
    group: '냉장고',
    title: '장보기 모드',
    subtitle: '체크박스 + 일괄 완료 CTA',
    body: `
<div class="col">
  <div class="row" style="padding:14px;min-height:60px;border-radius:18px;background:var(--alt);border:1px solid var(--line);opacity:.6;gap:14px">
    <span style="width:24px;height:24px;border-radius:8px;background:var(--accent);display:grid;place-items:center;font-size:14px;font-weight:800;color:#fff">✓</span>
    <span style="font-size:22px">🥬</span>
    <span style="font-size:15px;font-weight:700;text-decoration:line-through;flex:1">두부</span>
  </div>
  <div class="card row" style="padding:14px;min-height:60px;gap:14px">
    <span style="width:24px;height:24px;border-radius:8px;border:2px solid var(--line)"></span>
    <span style="font-size:22px">🥫</span>
    <span style="font-size:15px;font-weight:700;flex:1">참기름</span>
    <span class="muted" style="font-size:12px;font-weight:600">작은 병</span>
  </div>
  <button class="btn" style="margin-top:8px">장보기 완료 (1개 냉장고에 넣기)</button>
</div>`
  },
  {
    file: 'components/calendar-cells.html',
    group: '캘린더',
    title: '캘린더 셀 · 일정 행',
    subtitle: '일정 있는 날 = 멤버 색 원 · 오늘 = 액센트 링',
    body: `
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;max-width:320px">
  ${[
    ['1', '', ''], ['2', '', ''], ['3', '#FF6B35', 'ring'], ['4', '#E08A5B', ''], ['5', '', ''], ['6', '#2E6BFF', ''], ['7', '', ''],
    ['8', '#2E6BFF', ''], ['9', '', ''], ['10', '', ''], ['11', '', ''], ['12', '#16A97A', ''], ['13', '', ''], ['14', '', '']
  ].map(([n, c, ring]) => `
  <span style="aspect-ratio:1;border-radius:99px;display:flex;align-items:center;justify-content:center;font-size:14px;
    ${c ? `background:${c};color:#fff;font-weight:800;box-shadow:0 6px 14px ${c}66;` : 'font-weight:600;'}
    ${ring ? 'outline:2px solid var(--accent);outline-offset:2px;' : ''}">${n}</span>`).join('')}
</div>
<div class="card row" style="padding:12px 14px;margin-top:16px">
  <span style="font-size:11.5px;font-weight:800;color:#fff;padding:5px 10px;border-radius:99px;background:#16A97A;white-space:nowrap">오늘 14:00</span>
  <div style="flex:1"><div style="font-size:14.5px;font-weight:700">병원 예약</div><div class="muted" style="font-size:12px;font-weight:600">어머님 · 내과</div></div>
</div>`
  },
  {
    file: 'components/memo-cards.html',
    group: '메모',
    title: '포스트잇 메모',
    subtitle: '파스텔 4색 유지 + 멤버 색 자석 도트',
    body: `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
  ${[
    ['#FFF3C4', '#E08A5B', '분리수거는 목요일 아침! 🗑', '지선 · 3일 전', true],
    ['#F9CFD6', '#16A97A', '고등어 손질해서 냉동칸에', '어머님 · 6시간 전', false],
    ['#CDEBDD', '#E08A5B', '주말에 다 같이 장보러 가요~', '지선 · 1일 전', false],
    ['#DDD6F3', '#2E6BFF', '정수기 필터 교체 예약함', '준호 · 1일 전', false]
  ].map(([bg, dot, text, meta, pinned]) => `
  <div style="background:${bg};border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:20px 16px 12px;position:relative;color:#4A4238">
    <span style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:99px;background:${dot};border:2px solid rgba(255,255,255,.8);box-shadow:0 1px 2px rgba(0,0,0,.15)"></span>
    ${pinned ? '<span style="position:absolute;top:6px;right:8px;font-size:14px">📌</span>' : ''}
    <div style="font-size:14.5px;font-weight:600">${text}</div>
    <div style="font-size:11.5px;font-weight:600;opacity:.5;margin-top:8px">${meta}</div>
  </div>`).join('')}
</div>`
  },
  {
    file: 'components/buttons-inputs.html',
    group: '공통 UI',
    title: '버튼 · 입력 · 토글',
    subtitle: 'CTA(액센트+그림자) / 고스트 / 입력 / 스위치',
    body: `
<div class="col" style="gap:16px">
  <div class="row" style="flex-wrap:wrap">
    <button class="btn" style="padding:13px 20px">일정 추가</button>
    <button style="padding:13px 20px;border-radius:16px;border:1.5px solid var(--line);background:transparent;color:var(--text);font-size:14.5px;font-weight:700;font-family:inherit;cursor:pointer">취소</button>
    <button class="btn" style="padding:13px 20px;opacity:.4;box-shadow:none">비활성</button>
  </div>
  <div class="row" style="gap:8px;padding:6px;border-radius:16px;background:var(--surface);border:1px solid var(--line)">
    <input placeholder="살 것을 입력하세요…" style="flex:1;border:none;outline:none;background:transparent;font-size:14.5px;font-weight:600;color:var(--text);padding:8px 10px;font-family:inherit">
    <button style="border:none;cursor:pointer;border-radius:11px;padding:10px 18px;font-size:14px;font-weight:800;color:#fff;background:var(--accent);font-family:inherit">추가</button>
  </div>
  <input placeholder="예: 우유, 계란, 사과" style="width:100%;border:1.5px solid var(--line);border-radius:14px;padding:13px 15px;font-size:15px;font-weight:600;color:var(--text);background:var(--alt);outline:none;font-family:inherit">
  <div class="row" style="gap:24px">
    <span class="row" style="gap:8px"><span style="width:52px;height:32px;border-radius:99px;background:var(--accent);position:relative;display:inline-block"><span style="position:absolute;top:4px;left:24px;width:24px;height:24px;background:#fff;border-radius:99px;box-shadow:0 1px 2px rgba(0,0,0,.15)"></span></span><span style="font-size:13.5px;font-weight:700">켜짐</span></span>
    <span class="row" style="gap:8px"><span style="width:52px;height:32px;border-radius:99px;background:var(--line);position:relative;display:inline-block"><span style="position:absolute;top:4px;left:4px;width:24px;height:24px;background:#fff;border-radius:99px;box-shadow:0 1px 2px rgba(0,0,0,.15)"></span></span><span style="font-size:13.5px;font-weight:700">꺼짐</span></span>
  </div>
</div>`
  },
  {
    file: 'components/tabbar-fab.html',
    group: '공통 UI',
    title: '탭바 + 중앙 FAB',
    subtitle: '반투명 블러 · 비활성 탭 흐림 · 그라디언트 FAB',
    body: `
<div style="position:relative;padding-top:30px">
  <div style="background:rgba(255,255,255,.86);border-top:1px solid var(--line);display:flex;padding:6px 8px 8px;border-radius:4px">
    ${[['🏠', '홈', true, false, ''], ['🥕', '냉장고', false, true, 'margin-right:32px'], ['📅', '캘린더', false, false, 'margin-left:32px'], ['📝', '메모', false, false, '']].map(([icon, label, active, badge, m]) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;${m};${active ? '' : 'opacity:.5;filter:grayscale(.5)'}">
      <span style="font-size:21px;position:relative">${icon}${badge ? '<span style="position:absolute;top:-4px;right:-8px;width:10px;height:10px;background:var(--danger);border-radius:99px"></span>' : ''}</span>
      <span style="font-size:11px;font-weight:800;color:${active ? 'var(--accent)' : 'var(--muted)'}">${label}</span>
    </div>`).join('')}
  </div>
  <span style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:58px;height:58px;border-radius:99px;border:4px solid var(--bg);background:linear-gradient(145deg,var(--accent),var(--accent-deep));color:#fff;font-size:28px;font-weight:300;display:grid;place-items:center;box-shadow:0 8px 22px rgba(255,107,53,.5)">＋</span>
</div>
<p class="muted" style="font-size:12px;margin-top:12px">FAB: 홈·냉장고 → 식재료 추가 / 캘린더 → 오늘 일정 / 메모 → 새 메모</p>`
  },
  {
    file: 'components/toast-sheet.html',
    group: '공통 UI',
    title: '토스트 · 바텀시트',
    subtitle: '네이비 토스트 · 28px 라운드 시트 + 그랩바',
    body: `
<div class="col" style="gap:16px;align-items:center">
  <div style="background:#1B2740;color:#fff;font-size:14.5px;font-weight:600;padding:12px 20px;border-radius:99px;box-shadow:0 4px 12px rgba(0,0,0,.15)">방금 준호님이 '우유' 담았어요 🛒</div>
  <div style="width:100%;background:var(--surface);border-radius:28px 28px 0 0;padding:12px 22px 24px;box-shadow:0 -20px 50px rgba(0,0,0,.15)">
    <div style="width:40px;height:5px;background:var(--line);border-radius:99px;margin:0 auto 16px"></div>
    <div style="font-size:21px;font-weight:800">식재료 추가 🧺</div>
    <div style="font-size:12.5px;font-weight:700;color:var(--muted);margin:14px 0 8px">종류</div>
    <div style="display:flex;gap:8px">
      <span style="flex:1;text-align:center;padding:10px 0;border-radius:13px;font-size:13.5px;font-weight:700;color:#fff;background:var(--accent);border:1.5px solid var(--accent)">🥬 냉장</span>
      <span style="flex:1;text-align:center;padding:10px 0;border-radius:13px;font-size:13.5px;font-weight:700;background:var(--alt);border:1.5px solid var(--line)">🧊 냉동</span>
      <span style="flex:1;text-align:center;padding:10px 0;border-radius:13px;font-size:13.5px;font-weight:700;background:var(--alt);border:1.5px solid var(--line)">🥫 실온</span>
    </div>
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
const gallery = `<title>우리집 냉장고 — 디자인 시스템 v2</title>
<style>${TOKENS}
body{padding:32px 20px;max-width:960px;margin:0 auto}
h1{font-size:26px;font-weight:800;letter-spacing:-.5px}
h2{font-size:14px;font-weight:800;color:var(--muted);margin:36px 0 14px;letter-spacing:.06em}
.ds-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.ds-card{background:var(--surface);border-radius:18px;box-shadow:var(--shadow);overflow:hidden;border:1px solid var(--line)}
.ds-card-head{padding:14px 18px;border-bottom:1px solid var(--line)}
.ds-card-head b{font-size:15px}
.ds-card-head span{display:block;font-size:12px;color:var(--muted);margin-top:2px}
.ds-card-body{padding:20px 18px;background:var(--bg)}
</style>
<h1>🧊 우리집 냉장고 — 디자인 시스템 v2</h1>
<p class="muted" style="font-size:13px;font-weight:600;margin-top:6px">"디자인 테마 및 폰트 개선" 핸드오프 기준 · 테마 5종 · Gothic A1/Noto/Plex · 글씨 크기 3단계 · 미리보기는 오렌지 테마</p>
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
