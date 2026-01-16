# 🖼️ Image Batch Editor

Windows와 macOS에서 동작하는 프로덕션급 이미지 일괄 편집 데스크톱 앱입니다.

## ✨ 주요 기능

### 1. 파일/폴더 선택
- 이미지 다중 선택
- 폴더 선택 (하위 폴더 포함 옵션)
- 지원 포맷: JPEG, PNG, WebP, BMP, GIF

### 2. 편집 기능 (일괄 적용)
- **리사이즈**: 
  - Longest-side 모드 (가장 긴 변 기준)
  - Fixed 모드 (고정 크기, 비율 유지 옵션)
- **압축**: 
  - 품질 슬라이더 (1-100%)
  - 목표 용량(KB) 옵션 (이진 탐색으로 근사)
- **크롭**: 
  - 프리셋 (1:1, 4:3, 16:9, 자유)
  - 좌표 기반 크롭
- **포맷 변환**: JPEG, PNG, WebP
- **회전**: 0°, 90°, 180°, 270°
- **메타데이터 제거**: EXIF 제거 옵션
- **PNG→JPG 변환**: 배경색 선택 (흰색/검정/커스텀)

### 3. 출력 설정
- 출력 폴더 선택
- 원본 덮어쓰기 옵션
- 파일명 규칙: prefix/suffix, numbering, 원본명 유지
- 진행률 표시 (전체/개별)
- 처리 결과 요약

### 4. 미리보기
- 파일 리스트 (썸네일, 원본 크기/용량, 예상 출력 크기/용량)
- Before/After 비교
- 실시간 설정 미리보기

### 5. 기타
- 다크모드
- 로컬 처리 (외부 업로드 없음)
- 실시간 로그

## 🚀 설치 및 실행

### 사전 요구사항

1. **Node.js** (v18 이상)
2. **Rust** (최신 stable 버전)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **pnpm** (선택사항, npm도 가능)
   ```bash
   npm install -g pnpm
   ```

### 개발 모드 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (Hot-reload)
pnpm tauri:dev
```

### 프로덕션 빌드

```bash
# 빌드 (실행 파일 생성)
pnpm tauri:build
```

빌드된 파일 위치:
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/` 또는 `nsis/`

## 📁 프로젝트 구조

```
image-batch-editor/
├── src/                          # React 프론트엔드
│   ├── App.tsx                   # 메인 앱
│   ├── components/               # UI 컴포넌트
│   ├── hooks/                    # Custom hooks
│   └── types.ts                  # TypeScript 타입
├── src-tauri/                    # Rust 백엔드
│   ├── src/
│   │   ├── main.rs              # 엔트리 포인트
│   │   ├── commands.rs          # Tauri 커맨드
│   │   └── processor.rs         # 이미지 처리 로직
│   ├── Cargo.toml               # Rust 의존성
│   └── tauri.conf.json          # Tauri 설정
└── package.json                  # Node.js 의존성
```

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **Lucide React** (아이콘)
- **Tauri API** (프론트-백 통신)

### Backend
- **Tauri v2** (데스크톱 프레임워크)
- **Rust** (백엔드 로직)
- **image crate** (이미지 처리)
- **webp crate** (WebP 인코딩)
- **tokio** (비동기 런타임)

## 📝 사용 방법

1. **파일 추가**: "Add Files" 또는 "Add Folder" 버튼 클릭
2. **출력 폴더 선택**: "Output Folder" 버튼 클릭
3. **설정 조정**: 우측 패널에서 리사이즈, 압축, 포맷 등 설정
4. **미리보기**: 좌측 파일 리스트에서 파일 선택하여 미리보기
5. **처리 시작**: "Start" 버튼 클릭
6. **진행률 확인**: 하단 진행률 바 및 로그 확인

## 🧪 테스트 체크리스트

### 기본 기능
- [ ] 파일 선택 (단일/다중)
- [ ] 폴더 선택 (재귀/비재귀)
- [ ] 출력 폴더 선택
- [ ] 파일 리스트 표시

### 이미지 처리
- [ ] 리사이즈 (Longest-side 모드)
- [ ] 리사이즈 (Fixed 모드)
- [ ] 압축 (품질 조정)
- [ ] 압축 (목표 용량)
- [ ] 크롭 (1:1, 4:3, 16:9)
- [ ] 회전 (90°, 180°, 270°)
- [ ] 포맷 변환 (JPEG, PNG, WebP)
- [ ] PNG→JPEG 배경색 변환
- [ ] 메타데이터 제거

### 출력
- [ ] 원본 덮어쓰기
- [ ] 새 폴더에 저장
- [ ] 파일명 규칙 (prefix/suffix)
- [ ] 파일명 충돌 처리

### UI/UX
- [ ] 진행률 표시
- [ ] 취소 기능
- [ ] 로그 표시
- [ ] 다크모드
- [ ] 미리보기 (Before/After)

### 에러 처리
- [ ] 지원하지 않는 포맷 스킵
- [ ] 파일 읽기 실패 처리
- [ ] 출력 폴더 생성 실패 처리
- [ ] 디스크 공간 부족 처리

## 🔒 보안 및 프라이버시

- ✅ 모든 처리는 로컬에서 수행
- ✅ 외부 서버로 이미지 업로드 없음
- ✅ 최소 권한으로 구성
- ✅ 파일 시스템 접근만 허용

## 🐛 알려진 이슈

- 아이콘이 없는 경우 빌드 실패 가능 (아이콘 생성 필요)
- 매우 큰 이미지 (50MB+)는 메모리 사용량 증가

## 📄 라이선스

MIT License

## 👤 작성자

Image Batch Editor Team

## 🙏 감사

- [Tauri](https://tauri.app/)
- [image-rs](https://github.com/image-rs/image)
- [React](https://react.dev/)
