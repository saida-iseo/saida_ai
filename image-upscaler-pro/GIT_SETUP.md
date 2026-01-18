# Git 저장소 설정 가이드

## 1. GitHub에 새 저장소 생성
1. GitHub.com에 로그인
2. 우측 상단의 "+" 버튼 클릭 → "New repository" 선택
3. 저장소 이름 입력 (예: `image-upscaler-pro`)
4. Public 또는 Private 선택
5. "Create repository" 클릭
6. **중요**: README, .gitignore, license는 추가하지 마세요 (이미 있음)

## 2. 원격 저장소 연결 및 푸시

GitHub에서 생성한 저장소의 URL을 복사한 후 아래 명령어를 실행하세요:

```bash
cd /Users/iseo/Downloads/saida_ai/image-upscaler-pro

# 원격 저장소 추가 (YOUR_USERNAME과 REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 또는 SSH를 사용하는 경우:
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 메인 브랜치 이름 확인 및 설정
git branch -M main

# 코드 푸시
git push -u origin main
```

## 3. 이후 변경사항 푸시 방법

```bash
# 변경된 파일 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "변경사항 설명"

# 푸시
git push
```

## 4. 주의사항

- `.env` 파일은 절대 커밋하지 마세요 (이미 .gitignore에 포함됨)
- `node_modules` 폴더는 자동으로 제외됩니다
- `.next` 빌드 폴더도 자동으로 제외됩니다
