# 🚀 Image Batch Editor - 설치 및 실행 가이드

## 📋 사전 요구사항

### 1. Node.js 설치
- 버전: v18 이상 권장
- 다운로드: https://nodejs.org/

확인:
```bash
node --version  # v18.0.0 이상
```

### 2. Rust 설치
Tauri는 Rust를 사용하므로 Rust 설치가 필수입니다.

#### macOS/Linux:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Windows:
- https://rustup.rs/ 에서 설치 프로그램 다운로드
- 또는 Rust 공식 사이트에서 설치

확인:
```bash
rustc --version  # 1.70.0 이상
cargo --version
```

### 3. 시스템별 추가 요구사항

#### macOS:
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

#### Windows:
- Microsoft C++ Build Tools:
  - Visual Studio 2019 이상 (또는 Build Tools만)
  - https://visualstudio.microsoft.com/downloads/

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### 4. pnpm 설치 (선택사항)
npm 대신 pnpm 사용을 권장합니다 (더 빠름).

```bash
npm install -g pnpm
```

---

## 📥 프로젝트 설치

### 1. 의존성 설치

프로젝트 루트 디렉토리에서:

```bash
# pnpm 사용
pnpm install

# 또는 npm 사용
npm install
```

### 2. 아이콘 생성 (빌드 전 필수)

Tauri 앱에는 아이콘이 필요합니다. 아래 명령으로 생성할 수 있습니다:

```bash
# pnpm 사용
pnpm tauri icon path/to/your/icon.png

# 또는 npm 사용
npm run tauri icon path/to/your/icon.png
```

**참고**: 아이콘은 1024x1024 이상의 PNG 파일을 권장합니다.

또는 `src-tauri/icons/` 폴더에 수동으로 아이콘을 배치:
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`

---

## 🔧 개발 모드 실행

### 방법 1: 통합 명령 (권장)
```bash
# pnpm 사용
pnpm tauri:dev

# 또는 npm 사용
npm run tauri:dev
```

이 명령은 자동으로:
1. Vite 개발 서버 시작 (React)
2. Tauri 개발 빌드 및 앱 실행
3. Hot-reload 활성화

### 방법 2: 분리 실행
터미널 1 (React 개발 서버):
```bash
pnpm dev
```

터미널 2 (Tauri 앱):
```bash
pnpm tauri dev
```

### 개발 모드 특징
- ✅ 코드 수정 시 자동 리로드
- ✅ 빠른 반복 개발
- ✅ 개발자 도구 활성화
- ✅ 디버그 로그 출력

---

## 📦 프로덕션 빌드

### 빌드 명령

```bash
# pnpm 사용
pnpm tauri:build

# 또는 npm 사용
npm run tauri:build
```

### 빌드 시간
- 최초 빌드: 5-10분 (Rust 의존성 컴파일)
- 이후 빌드: 1-3분

### 빌드 결과물 위치

#### macOS:
```
src-tauri/target/release/bundle/
├── macos/
│   └── Image Batch Editor.app    # 앱 번들
└── dmg/
    └── Image Batch Editor.dmg     # 배포용 DMG
```

#### Windows:
```
src-tauri/target/release/bundle/
├── msi/
│   └── Image Batch Editor.msi     # MSI 설치 파일
└── nsis/
    └── Image Batch Editor.exe     # NSIS 설치 파일
```

#### Linux:
```
src-tauri/target/release/bundle/
├── deb/
│   └── image-batch-editor.deb     # Debian 패키지
└── appimage/
    └── image-batch-editor.AppImage # AppImage
```

---

## 🐛 문제 해결 (Troubleshooting)

### 문제 1: Rust 컴파일 에러
```
error: linker `cc` not found
```

**해결**:
- macOS: `xcode-select --install`
- Windows: Visual Studio C++ Build Tools 설치
- Linux: `sudo apt install build-essential`

### 문제 2: 아이콘 없음 에러
```
Error: Failed to bundle project: icon not found
```

**해결**:
```bash
# 아이콘 생성
pnpm tauri icon your-icon.png

# 또는 수동으로 icons/ 폴더에 배치
```

### 문제 3: 포트 충돌
```
Port 1420 is already in use
```

**해결**:
- `vite.config.ts`에서 포트 변경:
  ```typescript
  server: {
    port: 1421, // 다른 포트로 변경
    strictPort: true,
  }
  ```
- `tauri.conf.json`에서 devUrl도 변경:
  ```json
  "devUrl": "http://localhost:1421"
  ```

### 문제 4: WebKit 관련 에러 (Linux)
```
error: failed to run custom build command for `webkit2gtk-sys`
```

**해결**:
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

### 문제 5: pnpm 의존성 에러
```
ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY
```

**해결**:
```bash
# 락 파일 삭제 후 재설치
rm pnpm-lock.yaml
pnpm install
```

### 문제 6: Tauri CLI 없음
```
command not found: tauri
```

**해결**:
```bash
# 로컬에 설치된 경우
npx tauri dev

# 또는 전역 설치
cargo install tauri-cli
```

---

## 🔄 업데이트

### 의존성 업데이트

#### Node 패키지:
```bash
pnpm update
```

#### Rust 패키지:
```bash
cd src-tauri
cargo update
```

#### Tauri CLI:
```bash
cargo install tauri-cli --force
```

---

## 📱 배포

### macOS
1. `.app` 또는 `.dmg` 파일 배포
2. 코드 서명 필요 (Apple Developer 계정)
3. Notarization 권장

### Windows
1. `.msi` 또는 `.exe` 설치 파일 배포
2. 코드 서명 권장 (Microsoft Authenticode)

### Linux
1. `.deb`, `.AppImage`, 또는 `.rpm` 배포
2. 대부분의 배포판에서 바로 실행 가능

---

## 🛠️ 추가 명령어

### Tauri 정보 확인
```bash
pnpm tauri info
```

### Rust 종속성 업데이트
```bash
cd src-tauri
cargo update
```

### 캐시 클리어
```bash
# Vite 캐시
rm -rf node_modules/.vite

# Rust 캐시
cd src-tauri
cargo clean
```

### 로그 확인
- **개발 모드**: 터미널에 자동 출력
- **프로덕션**: OS별 로그 위치
  - macOS: `~/Library/Logs/com.imagebatcheditor.app/`
  - Windows: `%APPDATA%\com.imagebatcheditor.app\logs\`
  - Linux: `~/.local/share/com.imagebatcheditor.app/logs/`

---

## 📞 지원

문제가 계속되면:
1. GitHub Issues 확인
2. Tauri 공식 문서: https://tauri.app/
3. Tauri Discord: https://discord.gg/tauri

---

## ✅ 빠른 체크리스트

설치 전:
- [ ] Node.js v18+ 설치 확인
- [ ] Rust 설치 확인
- [ ] 시스템별 빌드 도구 설치

설치:
- [ ] `pnpm install` 실행
- [ ] 아이콘 생성/배치

개발:
- [ ] `pnpm tauri:dev` 실행
- [ ] 앱 정상 실행 확인

빌드:
- [ ] `pnpm tauri:build` 실행
- [ ] 빌드 결과물 확인
- [ ] 설치/실행 테스트

배포:
- [ ] 코드 서명 (선택)
- [ ] 최종 테스트
- [ ] 배포 패키지 생성
