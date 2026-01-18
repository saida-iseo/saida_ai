# GitHub 푸시 가이드

## 현재 상태
✅ 커밋 완료: `image-upscaler-pro` 프로젝트가 로컬에 커밋되었습니다.
⏳ 푸시 대기: GitHub 인증이 필요합니다.

## 푸시 방법

### 방법 1: GitHub Personal Access Token 사용 (권장)

1. **Personal Access Token 생성**
   - GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" 클릭
   - Note: "saida_ai push" 입력
   - Expiration: 원하는 기간 선택
   - Scopes: `repo` 체크
   - "Generate token" 클릭
   - **토큰을 복사해두세요** (한 번만 보여줍니다!)

2. **터미널에서 푸시**
   ```bash
   cd /Users/iseo/Downloads/saida_ai
   git push origin main
   ```
   - Username: `saida-iseo` 입력
   - Password: **Personal Access Token** 입력 (일반 비밀번호가 아님!)

### 방법 2: GitHub CLI 사용

```bash
# GitHub CLI 설치 (없는 경우)
brew install gh

# 로그인
gh auth login

# 푸시
cd /Users/iseo/Downloads/saida_ai
git push origin main
```

### 방법 3: SSH 키 설정 (장기적으로 권장)

```bash
# SSH 키 생성 (없는 경우)
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub에 SSH 키 추가
# GitHub.com → Settings → SSH and GPG keys → New SSH key
# 위에서 복사한 키를 붙여넣기

# 원격 저장소 URL 변경
cd /Users/iseo/Downloads/saida_ai
git remote set-url origin git@github.com:saida-iseo/saida_ai.git

# 푸시
git push origin main
```

## 확인

푸시가 성공하면 다음 URL에서 확인할 수 있습니다:
https://github.com/saida-iseo/saida_ai

`image-upscaler-pro/` 폴더가 추가된 것을 확인하세요!
