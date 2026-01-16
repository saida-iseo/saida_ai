# 📂 Image Batch Editor - 전체 파일 트리

```
image-batch-editor/
│
├── 📄 README.md                        # 프로젝트 소개 및 기능 설명
├── 📄 SETUP.md                         # 설치 및 실행 가이드
├── 📄 ARCHITECTURE.md                  # 아키텍처 문서
├── 📄 TEST_CHECKLIST.md                # 수동 테스트 체크리스트
├── 📄 SUMMARY.md                       # 프로젝트 요약
├── 📄 FILE_TREE.md                     # 파일 트리 (이 문서)
├── 📄 .gitignore                       # Git 무시 파일
│
├── 📦 package.json                     # Node.js 의존성
├── 📦 pnpm-lock.yaml                   # pnpm 락 파일 (자동 생성)
│
├── ⚙️ vite.config.ts                   # Vite 빌드 설정
├── ⚙️ tsconfig.json                    # TypeScript 설정
├── ⚙️ tsconfig.node.json               # Node용 TypeScript 설정
├── ⚙️ tailwind.config.js               # Tailwind CSS 설정
├── ⚙️ postcss.config.js                # PostCSS 설정
│
├── 🌐 index.html                       # HTML 엔트리
│
├── 📁 scripts/                         # 유틸리티 스크립트
│   └── 📜 install.sh                   # 자동 설치 스크립트
│
├── 📁 src/                             # React Frontend
│   │
│   ├── 📄 main.tsx                     # React 엔트리포인트
│   ├── 📄 App.tsx                      # 메인 앱 컴포넌트
│   ├── 📄 types.ts                     # TypeScript 타입 정의
│   │
│   ├── 📁 components/                  # UI 컴포넌트
│   │   ├── 📄 TopBar.tsx               # 상단 액션 바
│   │   ├── 📄 FileList.tsx             # 파일 리스트 (좌측)
│   │   ├── 📄 Preview.tsx              # 이미지 미리보기 (중앙)
│   │   ├── 📄 SettingsPanel.tsx        # 설정 패널 (우측)
│   │   ├── 📄 ProgressBar.tsx          # 진행률 바
│   │   └── 📄 LogPanel.tsx             # 로그 패널
│   │
│   ├── 📁 hooks/                       # Custom React Hooks
│   │   └── 📄 useImageProcessor.ts     # 이미지 처리 훅
│   │
│   └── 📁 styles/                      # 스타일
│       └── 📄 globals.css              # 글로벌 CSS (Tailwind 포함)
│
├── 📁 src-tauri/                       # Rust Backend
│   │
│   ├── 📦 Cargo.toml                   # Rust 의존성
│   ├── 📦 Cargo.lock                   # Rust 락 파일 (자동 생성)
│   ├── 📄 build.rs                     # Rust 빌드 스크립트
│   ├── ⚙️ tauri.conf.json              # Tauri 설정
│   │
│   ├── 📁 src/                         # Rust 소스 코드
│   │   ├── 📄 main.rs                  # Rust 엔트리포인트
│   │   ├── 📄 commands.rs              # Tauri 커맨드 핸들러
│   │   └── 📄 processor.rs             # 이미지 처리 로직
│   │
│   ├── 📁 capabilities/                # Tauri 권한 설정
│   │   └── ⚙️ default.json             # 기본 권한 정의
│   │
│   ├── 📁 icons/                       # 앱 아이콘 (빌드 전 생성 필요)
│   │   ├── 🖼️ icon.icns               # macOS 아이콘
│   │   ├── 🖼️ icon.ico                # Windows 아이콘
│   │   ├── 🖼️ 32x32.png               # 32x32 PNG
│   │   ├── 🖼️ 128x128.png             # 128x128 PNG
│   │   ├── 🖼️ 128x128@2x.png          # 128x128 Retina
│   │   └── 🖼️ icon.png                # 기본 PNG
│   │
│   └── 📁 target/                      # 빌드 결과물 (자동 생성, .gitignore)
│       ├── debug/                      # 개발 빌드
│       └── release/                    # 프로덕션 빌드
│           ├── bundle/                 # 최종 배포 파일
│           │   ├── macos/             # macOS .app, .dmg
│           │   ├── msi/               # Windows .msi
│           │   ├── nsis/              # Windows .exe
│           │   ├── deb/               # Linux .deb
│           │   └── appimage/          # Linux .AppImage
│           └── image-batch-editor     # 실행 바이너리
│
├── 📁 dist/                            # Vite 빌드 결과 (자동 생성, .gitignore)
│   ├── index.html
│   └── assets/
│
└── 📁 node_modules/                    # Node.js 의존성 (자동 생성, .gitignore)
```

---

## 📋 파일별 상세 설명

### 루트 디렉토리

| 파일 | 설명 | 중요도 |
|------|------|--------|
| `README.md` | 프로젝트 소개, 기능 설명, 사용법 | ⭐⭐⭐⭐⭐ |
| `SETUP.md` | 설치 및 실행 가이드, 문제 해결 | ⭐⭐⭐⭐⭐ |
| `ARCHITECTURE.md` | 아키텍처, 데이터 흐름, 기술 스택 | ⭐⭐⭐⭐ |
| `TEST_CHECKLIST.md` | 수동 테스트 체크리스트 | ⭐⭐⭐⭐ |
| `SUMMARY.md` | 프로젝트 전체 요약 | ⭐⭐⭐ |
| `package.json` | Node.js 의존성 및 스크립트 | ⭐⭐⭐⭐⭐ |
| `vite.config.ts` | Vite 빌드 설정 | ⭐⭐⭐⭐ |
| `tsconfig.json` | TypeScript 컴파일 설정 | ⭐⭐⭐⭐ |
| `tailwind.config.js` | Tailwind CSS 설정 | ⭐⭐⭐ |
| `index.html` | HTML 엔트리 포인트 | ⭐⭐⭐⭐ |

### src/ (React Frontend)

| 파일 | 라인 수 (예상) | 설명 |
|------|----------------|------|
| `main.tsx` | ~10 | React 엔트리, ReactDOM.render |
| `App.tsx` | ~240 | 메인 앱 컴포넌트, 상태 관리 |
| `types.ts` | ~111 | TypeScript 타입 정의 |
| `components/TopBar.tsx` | ~99 | 상단 액션 버튼들 |
| `components/FileList.tsx` | ~95 | 파일 리스트 + 상태 표시 |
| `components/Preview.tsx` | ~110 | 이미지 미리보기 (Before/After) |
| `components/SettingsPanel.tsx` | ~350 | 설정 패널 (리사이즈, 크롭 등) |
| `components/ProgressBar.tsx` | ~30 | 진행률 바 |
| `components/LogPanel.tsx` | ~45 | 로그 패널 |
| `hooks/useImageProcessor.ts` | ~130 | 이미지 처리 훅 |
| `styles/globals.css` | ~54 | 글로벌 CSS + Tailwind |

**Frontend 총 라인 수**: ~1,174 라인

### src-tauri/ (Rust Backend)

| 파일 | 라인 수 (예상) | 설명 |
|------|----------------|------|
| `Cargo.toml` | ~35 | Rust 의존성 정의 |
| `build.rs` | ~3 | Tauri 빌드 스크립트 |
| `tauri.conf.json` | ~55 | Tauri 설정 (창, 번들, 플러그인) |
| `src/main.rs` | ~25 | Rust 엔트리, Tauri 초기화 |
| `src/commands.rs` | ~190 | Tauri 커맨드 핸들러 |
| `src/processor.rs` | ~450 | 이미지 처리 로직 |
| `capabilities/default.json` | ~18 | 권한 설정 |

**Backend 총 라인 수**: ~776 라인

### 전체 프로젝트 통계

| 항목 | 개수 | 비고 |
|------|------|------|
| **총 파일 수** | ~30개 | 문서 제외 |
| **총 라인 수** | ~2,000+ | 코드 + 설정 |
| **React 컴포넌트** | 6개 | UI 컴포넌트 |
| **Custom Hooks** | 1개 | useImageProcessor |
| **Rust 모듈** | 3개 | main, commands, processor |
| **문서** | 6개 | README, SETUP, 등 |

---

## 🔍 주요 파일 상세

### 1. `src/App.tsx`
- **역할**: 메인 앱 컴포넌트, 전역 상태 관리
- **상태**: files, selectedFile, outputFolder, options, logs, darkMode
- **이벤트 핸들러**: 파일 추가, 폴더 추가, 처리 시작/취소

### 2. `src/components/SettingsPanel.tsx`
- **역할**: 우측 설정 패널
- **섹션**: Resize, Crop, Rotate, Output Format, Options, Naming
- **기능**: 모든 배치 옵션 UI

### 3. `src-tauri/src/commands.rs`
- **역할**: Tauri 커맨드 핸들러
- **커맨드**: pick_files, pick_folder, pick_output_folder, scan_images, start_batch_process, cancel_batch
- **기능**: 프론트엔드 요청 처리, 백엔드 로직 호출

### 4. `src-tauri/src/processor.rs`
- **역할**: 이미지 처리 핵심 로직
- **메서드**: process_batch, process_single_image, apply_crop, apply_rotate, apply_resize, save_image
- **기능**: 이미지 변환 파이프라인

### 5. `src/hooks/useImageProcessor.ts`
- **역할**: 이미지 처리 React Hook
- **기능**: Tauri 커맨드 호출, 이벤트 리스닝, 상태 관리
- **반환**: pickFiles, pickFolder, startBatch, cancelBatch, progress, isProcessing

---

## 🎯 핵심 파일 우선순위

### 이해 필수 (⭐⭐⭐⭐⭐)
1. `src/App.tsx` - 앱의 심장
2. `src-tauri/src/processor.rs` - 이미지 처리 핵심
3. `src-tauri/src/commands.rs` - 프론트-백 연결
4. `README.md` - 프로젝트 이해

### 중요 (⭐⭐⭐⭐)
5. `src/components/SettingsPanel.tsx` - 설정 UI
6. `src/hooks/useImageProcessor.ts` - 프론트 로직
7. `tauri.conf.json` - Tauri 설정
8. `SETUP.md` - 실행 가이드

### 참고 (⭐⭐⭐)
9. `src/components/Preview.tsx` - 미리보기
10. `ARCHITECTURE.md` - 아키텍처 이해

---

## 📊 의존성 트리

### Frontend 의존성
```
react (18.3.1)
├── react-dom (18.3.1)
└── @types/react (18.3.12)

@tauri-apps/api (2.0.0)
├── @tauri-apps/plugin-dialog (2.0.0)
├── @tauri-apps/plugin-fs (2.0.0)
└── @tauri-apps/plugin-shell (2.0.0)

tailwindcss (3.4.17)
├── autoprefixer (10.4.20)
└── postcss (8.4.49)

vite (5.4.11)
└── @vitejs/plugin-react (4.3.3)

lucide-react (0.460.0)
```

### Backend 의존성
```
tauri (2.0)
├── tauri-plugin-dialog (2.0)
├── tauri-plugin-fs (2.0)
└── tauri-plugin-shell (2.0)

image (0.25)
└── webp (0.3)

tokio (1.35)
serde (1.0)
├── serde_json (1.0)
└── anyhow (1.0)

walkdir (2.4)
once_cell (1.19)
```

---

## 🚀 빌드 프로세스 파일 흐름

### 개발 모드 (pnpm tauri:dev)
```
1. vite.config.ts → Vite Dev Server 시작
2. src/main.tsx → React 앱 로드
3. Cargo.toml → Rust 의존성 빌드
4. src-tauri/src/main.rs → Tauri 앱 실행
5. tauri.conf.json → 창 설정 적용
```

### 프로덕션 빌드 (pnpm tauri:build)
```
1. tsconfig.json → TypeScript 컴파일
2. vite.config.ts → Vite 빌드 (dist/)
3. Cargo.toml → Rust 릴리스 빌드
4. tauri.conf.json → 번들 설정
5. src-tauri/target/release/bundle/ → 최종 산출물
```

---

## 📝 파일 수정 가이드

### UI 변경 시
- `src/components/*.tsx` - 컴포넌트 수정
- `src/styles/globals.css` - 스타일 수정
- `tailwind.config.js` - Tailwind 테마 수정

### 기능 추가 시
- `src/types.ts` - 타입 추가
- `src-tauri/src/commands.rs` - 커맨드 추가
- `src-tauri/src/processor.rs` - 처리 로직 추가
- `src/hooks/useImageProcessor.ts` - Hook 수정

### 설정 변경 시
- `tauri.conf.json` - Tauri 설정
- `vite.config.ts` - Vite 설정
- `Cargo.toml` - Rust 의존성

---

## ✅ 체크리스트

### 개발 시작 전
- [ ] 모든 `.md` 문서 읽기
- [ ] 파일 트리 이해
- [ ] 의존성 확인

### 코드 수정 시
- [ ] 해당 파일의 역할 이해
- [ ] 타입 정의 확인
- [ ] 에러 처리 추가

### 커밋 전
- [ ] TypeScript 컴파일 확인
- [ ] Rust 컴파일 확인
- [ ] 기능 테스트

---

## 🎉 결론

이 파일 트리는 **체계적이고 확장 가능한** 구조로 설계되었습니다:

- ✅ **프론트엔드**: 컴포넌트 기반, 명확한 책임 분리
- ✅ **백엔드**: 모듈화된 Rust 코드
- ✅ **문서**: 완벽한 문서화
- ✅ **설정**: 명확한 설정 파일들

**Happy Coding! 🚀**
