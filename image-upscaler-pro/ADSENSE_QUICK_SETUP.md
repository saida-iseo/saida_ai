# AdSense 빠른 설정 가이드 (유튜브 계정 연결된 경우)

유튜브 계정이 이미 연결되어 있다면, AdSense Publisher ID를 바로 사용할 수 있습니다.

## 1️⃣ Publisher ID 확인 방법

### 방법 1: AdSense 대시보드에서 확인
1. [Google AdSense](https://www.google.com/adsense/)에 접속
2. 로그인 후 대시보드 상단 또는 설정에서 **Publisher ID** 확인
   - 형식: `ca-pub-XXXXXXXXXXXXXXXX`

### 방법 2: 기존 사이트 코드에서 확인
- 이미 다른 사이트에 AdSense가 설정되어 있다면, 그 코드에서 `ca-pub-`로 시작하는 ID를 찾을 수 있습니다.

### 방법 3: 유튜브 스튜디오에서 확인
1. [유튜브 스튜디오](https://studio.youtube.com/) 접속
2. **수익 창출** 메뉴 확인
3. AdSense 계정 정보에서 Publisher ID 확인 가능

## 2️⃣ 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음을 추가하세요:

```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-여기에실제ID입력
```

예시:
```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-1234567890123456
```

## 3️⃣ 개발 서버 재시작

```bash
npm run dev
```

## 4️⃣ 확인

- 브라우저 개발자 도구 콘솔에서 AdSense 스크립트가 로드되는지 확인
- 프로덕션 환경에서 광고가 표시되는지 확인 (로컬에서는 보이지 않을 수 있음)

## 주의사항

- Publisher ID는 `ca-pub-`로 시작해야 합니다
- 환경 변수 이름은 정확히 `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`여야 합니다
- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
