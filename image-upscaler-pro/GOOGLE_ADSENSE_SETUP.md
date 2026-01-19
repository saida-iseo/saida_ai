# Google AdSense 설정 가이드

이 가이드는 Google AdSense를 사이트에 연결하는 방법을 안내합니다.

## 1️⃣ Google AdSense 계정 생성

1. [Google AdSense](https://www.google.com/adsense/)에 접속합니다.
2. Google 계정으로 로그인합니다.
3. **"시작하기"** 버튼을 클릭합니다.
4. 웹사이트 URL을 입력하고 계속 진행합니다.
5. 개인정보 보호 정책 및 이용약관에 동의합니다.

## 2️⃣ AdSense 코드 발급

1. AdSense 대시보드에서 **"사이트"** 메뉴로 이동합니다.
2. 사이트를 추가하거나 기존 사이트를 선택합니다.
3. **"사이트 설정"** > **"AdSense 코드"**로 이동합니다.
4. 발급받은 **Publisher ID**를 복사합니다.
   - 형식: `ca-pub-XXXXXXXXXXXXXXXX`

## 3️⃣ 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일을 생성하거나 수정합니다.
2. 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

`ca-pub-XXXXXXXXXXXXXXXX`를 실제 발급받은 Publisher ID로 교체하세요.

## 4️⃣ 개발 서버 재시작

환경 변수를 설정한 후 개발 서버를 재시작합니다:

```bash
npm run dev
```

## 5️⃣ AdSense 승인 대기

- Google AdSense는 사이트를 검토하고 승인하는 데 시간이 걸릴 수 있습니다 (보통 1-2주).
- 승인 전까지는 광고가 표시되지 않습니다.
- 사이트가 승인되면 자동으로 광고가 표시됩니다.

## 6️⃣ 광고 단위 추가 (선택사항)

특정 위치에 광고를 표시하려면 컴포넌트를 추가할 수 있습니다:

```tsx
'use client';

import { useEffect } from 'react';

export default function AdSenseBanner() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
      data-ad-slot="YOUR_AD_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
```

## 주의사항

- AdSense 정책을 준수해야 합니다.
- 클릭 유도나 허위 클릭은 금지됩니다.
- 사이트 콘텐츠가 AdSense 정책에 위배되지 않아야 합니다.

## 문제 해결

### 광고가 표시되지 않는 경우
- AdSense 승인 상태를 확인하세요.
- 환경 변수가 올바르게 설정되었는지 확인하세요.
- 브라우저 콘솔에서 오류 메시지를 확인하세요.

### 개발 환경에서 광고가 보이지 않는 경우
- AdSense는 일반적으로 프로덕션 도메인에서만 작동합니다.
- 로컬 개발 환경에서는 광고가 표시되지 않을 수 있습니다.

## 추가 리소스

- [Google AdSense 공식 문서](https://support.google.com/adsense/)
- [AdSense 정책](https://support.google.com/adsense/answer/48182)
