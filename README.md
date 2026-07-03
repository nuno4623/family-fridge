# 🧊 식구들

가족 3명이 함께 쓰는 식재료 · 캘린더 · 메모 PWA.
냉장고 문에 자석으로 붙여둔 메모지 같은 앱입니다.

- 🥕 **냉장고**: 재고 관리 (충분 → 곧 떨어짐 → 떨어짐 탭 한 번으로 순환) → 사야 할 것 → 장보기 모드
- 📅 **캘린더**: 가족 공유 월간 캘린더, 멤버별 색상 점
- 📝 **메모**: 포스트잇 메모 보드 (고정/삭제)
- 🔔 **실시간 동기화 + 푸시 알림** (Firestore onSnapshot + FCM)

## 기술 스택

Vite + React + Tailwind CSS / Firebase (Auth · Firestore · FCM · Hosting) / vite-plugin-pwa

## 시작하기

### 1. Firebase 프로젝트 준비 (콘솔에서)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 → **웹 앱 등록** → config 키 복사
2. **Authentication** → 로그인 방법에서 **Google** 활성화
3. **Firestore Database** 생성 (프로덕션 모드)
4. 푸시를 쓰려면: 프로젝트 설정 → 클라우드 메시징 → **웹 푸시 인증서(VAPID) 키** 생성
   (Cloud Functions 배포에는 Blaze 요금제 필요 — 무료 한도 내면 과금 거의 없음)

### 2. 로컬 설정

```bash
cp .env.example .env   # Firebase config 값 채우기
npm install
npm run gen-icons      # PWA 아이콘 생성 (이미 커밋돼 있으면 생략 가능)
npm run dev
```

### 3. 배포

```bash
npm install -g firebase-tools
firebase login
firebase init  # 기존 firebase.json / firestore.rules 사용 선택

npm run build
firebase deploy --only hosting,firestore:rules   # 앱 + 보안 규칙
cd functions && npm install && cd ..
firebase deploy --only functions                  # 푸시 알림 (Blaze 필요)
```

### 4. 가족 초대

1. 첫 사용자가 구글 로그인 → **가족 만들기** → 6자리 초대코드 생성
2. 나머지 가족은 로그인 후 **초대코드 입력**으로 참여
3. 초대코드는 설정 ⚙️ 에서 언제든 확인 가능

## 📱 아이폰 사용자 안내

iOS는 Safari에서 **공유 → 홈 화면에 추가**로 설치한 PWA에서만 푸시 알림이 동작합니다 (iOS 16.4+).
앱이 자동으로 설치 안내 배너를 보여주며, 푸시를 켜지 않아도 앱 내 새 소식 요약(홈 화면)으로 변경사항을 확인할 수 있습니다.

## 프로젝트 구조

```
src/
  firebase.js            Firebase 초기화 (.env 기반)
  notifications.js       FCM 토큰 발급/해제
  sw.js                  서비스워커 (프리캐시 + FCM 백그라운드 알림)
  contexts/AuthContext   로그인 + 프로필 + 가족 + 멤버 실시간 구독
  hooks/useFamilyCollection  가족 서브컬렉션 onSnapshot 구독 (+ 변경 토스트)
  screens/               홈 · 냉장고 · 캘린더 · 메모 · 설정 · 로그인 · 가족설정
functions/index.js       Firestore 트리거 3개 → FCM 푸시 (본인 제외, 개인별 알림 설정 반영)
firestore.rules          가족 멤버만 읽기/쓰기 + 초대코드 참여 허용
```

## v1 범위 제외

유통기한/바코드/레시피, 반복 일정, 구글 캘린더 연동, 이미지 메모 → v2
