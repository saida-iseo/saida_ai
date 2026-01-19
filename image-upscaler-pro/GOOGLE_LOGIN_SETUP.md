# Google 로그인 설정 가이드

이 가이드는 Google OAuth를 사용한 로그인 기능을 무료로 설정하는 방법을 안내합니다.

## 1️⃣ Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. Google 계정으로 로그인합니다.
3. 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.

## 2️⃣ OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"**로 이동합니다.
2. 상단의 **"+ 사용자 인증 정보 만들기"** 버튼을 클릭합니다.
3. **"OAuth 클라이언트 ID"**를 선택합니다.
4. 동의 화면을 아직 설정하지 않았다면 먼저 설정해야 합니다:
   - **"OAuth 동의 화면 구성"** 클릭
   - 사용자 유형 선택 (외부 또는 내부)
   - 앱 이름, 사용자 지원 이메일, 개발자 연락처 정보 입력
   - 범위는 기본값으로 두고 저장
   - 테스트 사용자 추가 (필요시)

5. OAuth 클라이언트 ID 생성:
   - 애플리케이션 유형: **"웹 애플리케이션"** 선택
   - 이름: 원하는 이름 입력 (예: "Saida Image Maker")
   - 승인된 자바스크립트 원본:
     - 개발 환경: `http://localhost:3000`
     - 프로덕션 환경: `https://yourdomain.com`
   - 승인된 리디렉션 URI:
     - 개발 환경: `http://localhost:3000/api/auth/callback/google`
     - 프로덕션 환경: `https://yourdomain.com/api/auth/callback/google`

6. **"만들기"** 버튼을 클릭합니다.
7. 생성된 **클라이언트 ID**와 **클라이언트 보안 비밀**을 복사합니다.

## 3️⃣ 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일을 생성합니다.
2. 다음 내용을 추가합니다:

```env
# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### NEXTAUTH_SECRET 생성 방법

터미널에서 다음 명령어를 실행하여 시크릿 키를 생성합니다:

```bash
openssl rand -base64 32
```

생성된 값을 `NEXTAUTH_SECRET`에 입력합니다.

### 프로덕션 환경 설정

배포 시에는 다음을 변경해야 합니다:

```env
NEXTAUTH_URL=https://yourdomain.com
```

그리고 Google Cloud Console에서 프로덕션 도메인을 추가해야 합니다.

## 4️⃣ 개발 서버 재시작

환경 변수를 설정한 후 개발 서버를 재시작합니다:

```bash
npm run dev
```

## 5️⃣ 테스트

1. 브라우저에서 `http://localhost:3000/login`으로 이동합니다.
2. **"Google로 계속하기"** 버튼을 클릭합니다.
3. Google 계정으로 로그인합니다.
4. 로그인 후 메인 페이지로 리디렉션되고, Navbar에 사용자 정보가 표시됩니다.

## 비용 정보

✅ **완전 무료입니다!**
- Google OAuth는 무료로 제공됩니다.
- NextAuth.js는 오픈소스 라이브러리입니다.
- 추가 비용이 발생하지 않습니다.

## 문제 해결

### "redirect_uri_mismatch" 오류
- Google Cloud Console에서 리디렉션 URI가 정확히 일치하는지 확인하세요.
- 프로토콜(http/https), 도메인, 포트, 경로가 모두 일치해야 합니다.

### "invalid_client" 오류
- 클라이언트 ID와 클라이언트 보안 비밀이 올바른지 확인하세요.
- `.env.local` 파일이 프로젝트 루트에 있는지 확인하세요.

### 세션이 유지되지 않는 경우
- `NEXTAUTH_SECRET`이 설정되어 있는지 확인하세요.
- 브라우저 쿠키가 차단되지 않았는지 확인하세요.

## 추가 리소스

- [NextAuth.js 공식 문서](https://next-auth.js.org/)
- [Google OAuth 문서](https://developers.google.com/identity/protocols/oauth2)
