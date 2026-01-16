# 🏗️ Image Batch Editor - 아키텍처 문서

## 📐 전체 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌────────────┬──────────────┬────────────────────┐ │
│  │   UI       │   Hooks      │   Types            │ │
│  │ Components │ useProcessor │   Interfaces       │ │
│  └────────────┴──────────────┴────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↕️
              Tauri API (IPC Bridge)
                         ↕️
┌─────────────────────────────────────────────────────┐
│                  Backend (Rust)                      │
│  ┌────────────┬──────────────┬────────────────────┐ │
│  │ Commands   │  Processor   │   File System      │ │
│  │ (Handlers) │ (Image Ops)  │   (Dialog)         │ │
│  └────────────┴──────────────┴────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend 구조

### 1. Component 계층

```
App.tsx (Root)
├── TopBar
│   ├── Add Files Button
│   ├── Add Folder Button
│   ├── Output Folder Button
│   ├── Start/Cancel Button
│   └── Clear Button
├── Main Layout
│   ├── FileList (Left Sidebar)
│   │   └── File Items (Thumbnail + Status)
│   ├── Preview (Center)
│   │   ├── Before/After Toggle
│   │   └── Image Display
│   └── SettingsPanel (Right Sidebar)
│       ├── Resize Settings
│       ├── Crop Settings
│       ├── Rotate Settings
│       ├── Output Format Settings
│       ├── Flags
│       └── Naming Options
└── Bottom Panel
    ├── ProgressBar (if processing)
    └── LogPanel
```

### 2. State 관리

#### App.tsx (전역 상태)
```typescript
- files: ImageFile[]           // 선택된 파일 목록
- selectedFile: ImageFile      // 미리보기용 선택 파일
- outputFolder: string         // 출력 폴더 경로
- options: BatchOptions        // 배치 처리 옵션
- logs: LogEntry[]             // 로그 엔트리
- darkMode: boolean            // 다크모드 토글
```

#### useImageProcessor Hook
```typescript
- progress: ProgressEvent      // 진행률 상태
- isProcessing: boolean        // 처리 중 여부
- pickFiles()                  // 파일 선택
- pickFolder()                 // 폴더 선택
- pickOutputFolder()           // 출력 폴더 선택
- startBatch()                 // 배치 처리 시작
- cancelBatch()                // 배치 처리 취소
```

### 3. 타입 시스템

#### 핵심 타입 (`types.ts`)
```typescript
// 파일 정보
ImageFile {
  id, path, name, size,
  width, height, format,
  status, error?,
  outputPath?, outputSize?,
  outputWidth?, outputHeight?,
  savedBytes?
}

// 배치 옵션
BatchOptions {
  resize: ResizeOptions,
  crop: CropOptions,
  rotate: RotateOptions,
  output: OutputOptions,
  flags: ProcessFlags,
  naming: NamingOptions
}

// 이벤트 타입
ProgressEvent, ItemDoneEvent,
ItemErrorEvent, BatchDoneEvent
```

---

## 🦀 Backend 구조

### 1. 모듈 구조

```
src-tauri/src/
├── main.rs           # 앱 엔트리포인트, Tauri 초기화
├── commands.rs       # Tauri 커맨드 핸들러
└── processor.rs      # 이미지 처리 로직
```

### 2. Commands (commands.rs)

#### 파일 선택 커맨드
```rust
pick_files()          → Vec<FileInfo>
pick_folder()         → Vec<FileInfo>
pick_output_folder()  → Option<String>
scan_images()         → Vec<FileInfo>
```

#### 배치 처리 커맨드
```rust
start_batch_process() → Result<(), String>
  - 파일 정보 + 옵션 수신
  - ImageProcessor 생성
  - 비동기 처리 스폰
  - 이벤트 emit

cancel_batch()        → Result<(), String>
  - 전역 Processor 참조
  - cancel() 호출
```

### 3. Processor (processor.rs)

#### ImageProcessor 구조체
```rust
struct ImageProcessor {
    app: AppHandle,           // Tauri 앱 핸들
    cancelled: Arc<AtomicBool> // 취소 플래그
}
```

#### 주요 메서드
```rust
process_batch()
  ├── 파일 순회
  ├── process_single_image() 호출
  ├── 진행률 emit
  └── 완료/에러 이벤트 emit

process_single_image()
  ├── 이미지 로드
  ├── apply_crop()
  ├── apply_rotate()
  ├── apply_resize()
  ├── apply_format_conversion()
  ├── generate_output_path()
  └── save_image()

save_image()
  ├── save_with_quality()      // 품질 기반
  └── save_with_target_size()  // 용량 기반 (이진탐색)
```

### 4. 이미지 처리 파이프라인

```
Input Image
    ↓
[Load & Decode]
    ↓
[Crop] (optional)
    ↓
[Rotate] (0/90/180/270)
    ↓
[Resize] (longest-side or fixed)
    ↓
[Format Conversion] (JPEG/PNG/WebP)
    ↓
[Compress] (quality or target size)
    ↓
[Save to Disk]
    ↓
Output Image
```

---

## 🔄 데이터 흐름

### 1. 파일 선택 플로우

```
User clicks "Add Files"
    ↓
Frontend: invoke('pick_files')
    ↓
Backend: Open file dialog
    ↓
Backend: Scan selected files
    ↓
Backend: Get image metadata
    ↓
Backend: Return Vec<FileInfo>
    ↓
Frontend: Update files state
    ↓
UI: Display in FileList
```

### 2. 배치 처리 플로우

```
User clicks "Start"
    ↓
Frontend: Validate (files, output folder)
    ↓
Frontend: invoke('start_batch_process', { files, options })
    ↓
Backend: Spawn async task
    ↓
Backend: For each file:
  ├── emit('progress', ...)
  ├── Process image
  ├── emit('item_done', ...) or emit('item_error', ...)
  └── Continue or break if cancelled
    ↓
Backend: emit('batch_done', ...)
    ↓
Frontend: Listen to events
    ↓
Frontend: Update UI (progress, logs, file status)
    ↓
UI: Show completion summary
```

### 3. 이벤트 시스템

#### Frontend → Backend (Commands)
```
invoke('pick_files')
invoke('pick_folder', { recursive })
invoke('pick_output_folder')
invoke('start_batch_process', { files, outputDir, options })
invoke('cancel_batch')
```

#### Backend → Frontend (Events)
```
emit('progress', { total, done, currentFile, percent, ... })
emit('item_done', { file, outFile, savedBytes, ... })
emit('item_error', { file, message })
emit('batch_done', { total, success, failed, totalSavedBytes })
```

---

## 🧩 주요 기능 구현 상세

### 1. 리사이즈

#### Longest-side 모드
```rust
if width > height {
    new_width = longest_side
    new_height = height * (longest_side / width)
} else {
    new_height = longest_side
    new_width = width * (longest_side / height)
}
```

#### Fixed 모드 (비율 유지)
```rust
ratio_w = target_width / original_width
ratio_h = target_height / original_height
ratio = min(ratio_w, ratio_h)

new_width = original_width * ratio
new_height = original_height * ratio
```

### 2. 크롭

#### 프리셋 크롭 (1:1, 4:3, 16:9)
```rust
aspect_ratio = match preset {
    "1:1" => 1.0,
    "4:3" => 4.0 / 3.0,
    "16:9" => 16.0 / 9.0,
}

// Center crop
x = (width - target_width) / 2
y = (height - target_height) / 2
```

### 3. 압축 (목표 용량)

#### 이진 탐색 알고리즘
```rust
let mut quality = initial_quality;
let mut iterations = 0;

loop {
    size = save_with_quality(image, quality);
    
    if size <= target_size || iterations >= MAX_ITERATIONS {
        break;
    }
    
    if size > target_size {
        quality -= 10; // 품질 감소
    }
    
    iterations += 1;
}
```

### 4. 포맷 변환 (PNG → JPEG)

```rust
if output_format == "jpeg" && image.has_alpha() {
    // 배경색 적용
    let bg_color = parse_color(background);
    let mut rgb_image = create_background(bg_color);
    overlay(rgb_image, image); // 알파 블렌딩
    return rgb_image;
}
```

### 5. 파일명 생성

```rust
if keep_original {
    filename = prefix + original_stem + suffix
} else {
    num = start_index + index
    filename = prefix + format!("{:0pad$}", num)
}

// 충돌 처리
while path.exists() {
    filename = filename + "_" + counter;
    counter += 1;
}
```

---

## 🔐 보안 및 권한

### Tauri 권한 설정 (`capabilities/default.json`)
```json
{
  "permissions": [
    "core:default",           // 기본 기능
    "dialog:allow-open",      // 파일/폴더 선택
    "dialog:allow-save",      // 저장 다이얼로그
    "fs:allow-read",          // 파일 읽기
    "fs:allow-write",         // 파일 쓰기
    "fs:allow-read-dir",      // 디렉토리 읽기
    "fs:allow-exists",        // 존재 확인
    "fs:allow-mkdir",         // 디렉토리 생성
    "shell:allow-open"        // 외부 프로그램 실행 (미사용)
  ]
}
```

### 파일 시스템 스코프
```json
"fs": {
  "scope": [
    "$DESKTOP/*",
    "$PICTURE/*",
    "$DOCUMENT/*",
    "$DOWNLOAD/*",
    "$HOME/*",
    "**"
  ]
}
```

---

## 🧪 테스트 전략

### 1. 단위 테스트
- [ ] Rust: 이미지 처리 로직 (resize, crop, rotate)
- [ ] TypeScript: Utility 함수

### 2. 통합 테스트
- [ ] Command 호출 → 응답 검증
- [ ] 이벤트 emit → 수신 검증

### 3. E2E 테스트
- [ ] 파일 선택 → 처리 → 결과 확인
- [ ] 에러 케이스 처리

### 4. 성능 테스트
- [ ] 100개 파일 처리 시간
- [ ] 메모리 사용량
- [ ] UI 반응성

---

## 🚀 최적화

### Frontend
- React.memo() for heavy components
- Virtual scrolling for large file lists
- Debounce for settings changes

### Backend
- Tokio async runtime for parallel processing
- Lazy image loading
- Streaming for large files
- Cancel token for graceful shutdown

---

## 📦 빌드 프로세스

### Development
```
1. Vite dev server (Hot Module Replacement)
2. Tauri dev build (debug mode)
3. Watch for changes
4. Auto-reload
```

### Production
```
1. TypeScript → JavaScript (tsc)
2. Vite build (minify, bundle)
3. Rust → Binary (cargo build --release)
4. Bundle assets
5. Create installer
   ├── macOS: .app, .dmg
   ├── Windows: .msi, .exe
   └── Linux: .deb, .AppImage
```

---

## 🔮 향후 개선 사항

### 기능
- [ ] Batch preset 저장/불러오기
- [ ] Undo/Redo
- [ ] 이미지 필터 (흑백, 세피아 등)
- [ ] 워터마크 추가
- [ ] AVIF 포맷 지원
- [ ] 배치 처리 대기열

### 성능
- [ ] 멀티스레드 처리 (rayon)
- [ ] GPU 가속 (wgpu)
- [ ] 증분 처리
- [ ] 캐싱

### UX
- [ ] Drag & Drop
- [ ] 이미지 미리보기 확대/축소
- [ ] 크롭 영역 마우스 선택
- [ ] 프리셋 관리 UI
- [ ] 다국어 지원

---

## 📚 참고 자료

- [Tauri Documentation](https://tauri.app/)
- [image-rs](https://github.com/image-rs/image)
- [React Documentation](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)
