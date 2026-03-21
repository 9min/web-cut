# WebCut 코드베이스 상세 연구 보고서

## 1. 프로젝트 개요

### 제품 설명
브라우저에서 동작하는 웹 기반 동영상 편집기. 비전문가가 설치 없이 영상 컷 편집, 트랜지션, 필터, 텍스트 오버레이, 내보내기를 수행할 수 있다. 순수 클라이언트 앱으로 백엔드 없이 동작한다.

### 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 19.2.4 |
| 언어 | TypeScript (strict) | 5.9.3 |
| 빌드 | Vite | 8.0.1 |
| 상태관리 | Zustand | 5.0.12 |
| 렌더링 엔진 | PixiJS (Canvas/WebGL) | 8.17.1 |
| 인코딩 | FFmpeg.wasm | 0.12.15 |
| UI 컴포넌트 | Radix UI | — |
| CSS | Tailwind CSS | 4.2.2 |
| 드래그 앤 드롭 | dnd-kit | — |
| 린트/포매팅 | Biome | 2.4.8 |
| 테스트 | Vitest | 4.1.0 |
| 패키지 매니저 | pnpm | 10 |
| 배포 | Vercel | — |

### 아키텍처 요약

```
사용자 입력 → React UI → Zustand 스토어 → PixiJS 프리뷰 렌더링
                                        → FFmpeg.wasm 내보내기
```

- **UI 레이어**: React 컴포넌트 (shadcn/ui 기반)
- **상태 레이어**: 8개 Zustand 스토어 (미들웨어 없음, 수동 직렬화)
- **렌더링 레이어**: PixiJS requestAnimationFrame 루프
- **인코딩 레이어**: FFmpeg.wasm (Web Worker, SharedArrayBuffer)
- **보안**: XSS 방지 새니타이징, 파일 검증, MIME 타입 체크

---

## 2. 디렉토리 구조

```
src/
├── app/                                # 애플리케이션 진입점
│   ├── App.tsx                         # 루트 컴포넌트 (DndContext 래퍼)
│   ├── main.tsx                        # React 초기화
│   └── index.css                       # 글로벌 스타일
│
├── components/                         # React 컴포넌트
│   ├── export/
│   │   └── ExportPanel.tsx             # 내보내기 설정 패널
│   ├── inspector/                      # 속성 편집 패널
│   │   ├── InspectorPanel.tsx          # 인스펙터 라우터
│   │   ├── FilterPanel.tsx             # 필터 조정 (밝기/대비/채도)
│   │   ├── TransformPanel.tsx          # 트랜스폼 조정 (위치/크기/회전)
│   │   ├── AudioPanel.tsx              # 볼륨 조정
│   │   └── TextOverlayPanel.tsx        # 텍스트 오버레이 편집
│   ├── layout/
│   │   ├── EditorLayout.tsx            # 메인 레이아웃 (리사이즈 가능)
│   │   └── Header.tsx                  # 헤더 (저장/불러오기/내보내기)
│   ├── media-pool/
│   │   ├── MediaPool.tsx               # 미디어 라이브러리
│   │   ├── MediaUploader.tsx           # 파일 업로드 드롭존
│   │   └── MediaItem.tsx              # 미디어 아이템 (드래그 가능)
│   ├── preview/
│   │   └── PreviewPanel.tsx            # PixiJS 프리뷰 캔버스
│   ├── timeline/
│   │   ├── Timeline.tsx                # 타임라인 메인 컴포넌트
│   │   ├── TimelineToolbar.tsx         # 툴바 (트랙 추가/분할/삭제/줌)
│   │   ├── TimeRuler.tsx              # 시간 눈금자
│   │   ├── Playhead.tsx               # 재생 헤드 (빨간 세로선)
│   │   ├── PlaybackControls.tsx       # 재생/일시정지 컨트롤
│   │   ├── TrackRow.tsx               # 트랙 행
│   │   ├── ClipBlock.tsx              # 비디오/이미지 클립 블록
│   │   ├── AudioClipBlock.tsx         # 오디오 클립 블록
│   │   ├── TextClipBlock.tsx          # 텍스트 클립 블록 (리사이즈 가능)
│   │   ├── TransitionBlock.tsx        # 트랜지션 표시 블록
│   │   ├── AddTransitionButton.tsx    # 트랜지션 추가 버튼
│   │   ├── TransitionPopover.tsx      # 트랜지션 설정 팝오버
│   │   ├── DropIndicator.tsx          # 드롭 위치 인디케이터 (파란선)
│   │   └── SnapIndicator.tsx          # 스냅 포인트 인디케이터 (노란선)
│   └── ui/
│       └── KeyboardShortcutHelp.tsx   # 키보드 단축키 모달
│
├── constants/                          # 상수 정의
│   ├── audio.ts
│   ├── export.ts
│   ├── filter.ts
│   ├── media.ts
│   ├── project.ts
│   ├── textOverlay.ts
│   ├── timeline.ts
│   ├── transform.ts
│   └── transition.ts
│
├── hooks/                              # 커스텀 React 훅
│   ├── useDebouncedSnapshot.ts
│   ├── useEditorKeyboard.ts
│   ├── useExport.ts
│   ├── useFileDrop.ts
│   ├── useMediaUpload.ts
│   ├── usePixiApp.ts
│   ├── usePlayback.ts
│   ├── usePreviewRenderer.ts
│   └── useTimelineDragDrop.ts
│
├── services/                           # 비즈니스 로직 서비스
│   └── ffmpegService.ts               # FFmpeg.wasm 래퍼
│
├── stores/                             # Zustand 상태 스토어
│   ├── useExportStore.ts
│   ├── useHistoryStore.ts
│   ├── useMediaStore.ts
│   ├── usePlaybackStore.ts
│   ├── useProjectStore.ts
│   ├── useTimelineStore.ts
│   ├── useUIStore.ts
│   └── useZoomStore.ts
│
├── types/                              # TypeScript 타입 정의
│   ├── dnd.ts
│   ├── export.ts
│   ├── filter.ts
│   ├── media.ts
│   ├── project.ts
│   ├── textOverlay.ts
│   ├── timeline.ts
│   └── transition.ts
│
├── utils/                              # 유틸리티 함수
│   ├── clipBlockRefs.ts               # 클립 DOM 참조 맵
│   ├── cn.ts                          # clsx + tailwind-merge
│   ├── dropIndicatorRefs.ts           # 드롭 인디케이터 참조 맵
│   ├── editUtils.ts                   # 클립 분할/트림
│   ├── exportUtils.ts                 # FFmpeg 커맨드 빌더
│   ├── extractMetadata.ts            # 미디어 메타데이터 추출
│   ├── filterRenderer.ts             # PixiJS 필터 적용
│   ├── filterUtils.ts                # 필터 변환 유틸리티
│   ├── formatDuration.ts             # 시간 포맷팅
│   ├── formatFileSize.ts             # 파일 크기 포맷팅
│   ├── generateId.ts                 # UUID 생성
│   ├── previewOffsets.ts             # D&D 프리뷰 오프셋 계산
│   ├── previewUtils.ts               # 현재 시간 클립 탐색
│   ├── projectSerializer.ts          # 프로젝트 저장/불러오기
│   ├── sanitizeFileName.ts           # 파일명 새니타이징
│   ├── snapIndicatorRefs.ts          # 스냅 인디케이터 참조 맵
│   ├── textClipUtils.ts              # 텍스트 클립 생성 유틸
│   ├── textOverlayExport.ts          # FFmpeg drawtext 필터 생성
│   ├── textOverlayRenderer.ts        # PixiJS 텍스트 렌더링
│   ├── textSanitizer.ts              # XSS 방지 새니타이징
│   ├── timelineUtils.ts              # 타임라인 계산
│   ├── transitionRenderer.ts         # PixiJS 트랜지션 효과
│   ├── transitionUtils.ts            # 트랜지션 검증/계산
│   └── validateMediaFile.ts          # 파일 검증
│
└── vite-env.d.ts                       # Vite 타입 선언
```

총 파일 수: **86개** (소스 코드)

---

## 3. 데이터 모델

### 3.1 프로젝트 (project.ts)

```typescript
interface ProjectSettings {
  name: string;       // 프로젝트 이름
  width: number;      // 캔버스 너비 (기본: 1920)
  height: number;     // 캔버스 높이 (기본: 1080)
  fps: number;        // 프레임 레이트 (기본: 30)
}
```

### 3.2 미디어 (media.ts)

```typescript
type MediaType = "video" | "audio" | "image";
type MediaStatus = "loading" | "ready" | "error";

interface VideoMetadata { width: number; height: number; duration: number; fps: number; }
interface AudioMetadata { duration: number; sampleRate: number; channelCount: number; }
interface ImageMetadata { width: number; height: number; }
type MediaMetadata = VideoMetadata | AudioMetadata | ImageMetadata;

interface MediaAsset {
  id: string;
  name: string;              // 표시 이름 (편집 가능)
  originalName: string;      // 원본 파일명
  type: MediaType;
  mimeType: string;
  size: number;              // 바이트 단위
  objectUrl: string;         // Blob URL
  thumbnailUrl: string | null;
  metadata: MediaMetadata | null;
  status: MediaStatus;
  addedAt: number;           // 타임스탬프
  errorMessage?: string;
}
```

### 3.3 타임라인 (timeline.ts)

```typescript
type TrackType = "video" | "audio" | "text";

interface ClipTransform {
  x: number;         // 위치 X (0~100%)
  y: number;         // 위치 Y (0~100%)
  scaleX: number;    // X 스케일
  scaleY: number;    // Y 스케일
  rotation: number;  // 회전 각도
}

interface Clip {
  id: string;
  trackId: string;
  assetId: string;           // MediaAsset 참조
  name: string;
  startTime: number;         // 타임라인 시작 시간 (초)
  duration: number;          // 타임라인 표시 길이 (초)
  inPoint: number;           // 소스 트림 시작점
  outPoint: number;          // 소스 트림 끝점
  outTransition?: Transition;
  filter?: ClipFilter;
  volume?: number;           // 0~1 (undefined = 기본값 1)
  transform?: ClipTransform; // undefined = 기본값
}

interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  textClips: TextClip[];
  muted: boolean;
  locked: boolean;
  order: number;
}
```

### 3.4 필터 (filter.ts)

```typescript
type FilterType = "brightness" | "contrast" | "saturation";

interface ClipFilter {
  brightness: number;  // -100 ~ +100, 기본 0
  contrast: number;    // -100 ~ +100, 기본 0
  saturation: number;  // -100 ~ +100, 기본 0
}
```

### 3.5 트랜지션 (transition.ts)

```typescript
type TransitionType = "fade" | "dissolve" | "wipe-left" | "wipe-right";

interface Transition {
  type: TransitionType;
  duration: number;  // 0.3~2.0초
}
```

### 3.6 텍스트 오버레이 (textOverlay.ts)

```typescript
interface TextOverlay {
  content: string;
  x: number;          // 위치 X (0~100%)
  y: number;          // 위치 Y (0~100%)
  fontSize: number;   // 12~120
  fontColor: string;  // #RRGGBB
  opacity: number;    // 0~100%
}

interface TextClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  duration: number;
  overlay: TextOverlay;
}
```

### 3.7 내보내기 (export.ts)

```typescript
type ExportStatus = "idle" | "preparing" | "encoding" | "done" | "error";

interface ExportResolution { label: string; width: number; height: number; }
interface ExportSettings { resolution: ExportResolution; }
```

### 3.8 드래그 앤 드롭 (dnd.ts)

```typescript
const DND_TYPES = {
  MEDIA_ITEM: "media-item",
  TIMELINE_CLIP: "timeline-clip",
  TIMELINE_TEXT_CLIP: "timeline-text-clip",
} as const;

interface MediaDragData    { type: "media-item"; assetId: string; }
interface ClipDragData     { type: "timeline-clip"; clipId: string; trackId: string; }
interface TextClipDragData { type: "timeline-text-clip"; textClipId: string; trackId: string; }
type DragData = MediaDragData | ClipDragData | TextClipDragData;
```

---

## 4. 상태 관리

8개 Zustand 스토어로 중앙 관리. **미들웨어 없음** (persist, devtools 등 미사용). 프로젝트 저장은 `projectSerializer.ts`로 수동 직렬화.

### 4.1 useProjectStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `name` | `string` | `"새 프로젝트"` | 프로젝트 이름 |
| `width` | `number` | `1920` | 캔버스 너비 |
| `height` | `number` | `1080` | 캔버스 높이 |
| `fps` | `number` | `30` | 프레임 레이트 |

**Actions**: `setName`, `setResolution`, `setFps`, `reset`
**의존성**: 없음 (독립)

### 4.2 usePlaybackStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `currentTime` | `number` | `0` | 현재 재생 위치 (초) |
| `isPlaying` | `boolean` | `false` | 재생 상태 |
| `duration` | `number` | `0` | 타임라인 총 길이 |

**Actions**: `play`, `pause`, `togglePlayback`, `seek`, `setDuration`, `reset`
**의존성**: 없음 (독립). `usePlayback` 훅이 rAF 루프로 `currentTime` 갱신.

### 4.3 useTimelineStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `tracks` | `Track[]` | `[기본 비디오 트랙]` | 모든 트랙 배열 |
| `selectedClipId` | `string \| null` | `null` | 선택된 클립 ID |

**Actions** (총 약 25개):

*트랙 관리*: `addTrack`, `removeTrack`, `toggleTrackMuted`, `toggleTrackLocked`, `addAudioTrack`, `addTextTrack`

*클립 관리*: `addClip`, `removeClip`, `moveClip`, `insertClipAt`, `splitClip`, `trimClipAction`, `removeClipsByAssetId`, `selectClip`

*트랜지션*: `addTransition`, `removeTransition`, `updateTransition`

*필터*: `updateFilter`, `resetFilter`

*오디오*: `updateClipVolume`

*트랜스폼*: `updateTransform`, `resetTransform`

*텍스트 클립*: `addTextClip`, `updateTextClip`, `updateTextClipOverlay`, `removeTextClip`, `moveTextClip`

*기타*: `reset`

**핵심 동작**:
- 초기화 시 기본 비디오 트랙 (`"default-video-track"`, 타임라인 1) 생성
- `insertClipAt`: 겹치는 클립을 오른쪽으로 밀어냄 (pushClipsRight)
- 필터/볼륨/트랜스폼: 기본값이면 `undefined`로 리셋 (메모리 최적화)
- 텍스트 입력: `sanitizeTextInput()`으로 XSS 방지
- 클립 삭제 시 선택 상태 자동 해제

**의존성**: useMediaStore가 호출 (`removeClipsByAssetId`), useHistoryStore가 스냅샷 생성

### 4.4 useHistoryStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `past` | `TimelineSnapshot[]` | `[]` | Undo 스택 |
| `future` | `TimelineSnapshot[]` | `[]` | Redo 스택 |

```typescript
interface TimelineSnapshot {
  tracks: Track[];
  selectedClipId: string | null;
}
```

**Actions**: `pushSnapshot`, `undo`, `redo`, `canUndo`, `canRedo`, `reset`
**설정**: `MAX_HISTORY = 50`
**의존성**: useTimelineStore 읽기/쓰기 (스냅샷 촬영 및 복원)
**핵심 동작**: JSON.stringify/parse로 deep clone, 새 액션 시 future 스택 초기화

### 4.5 useMediaStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `assets` | `MediaAsset[]` | `[]` | 임포트된 미디어 목록 |

**Actions**: `addAsset`, `removeAsset`, `updateAsset`, `reset`
**의존성**: useTimelineStore 호출 (`removeClipsByAssetId` — 캐스케이드 삭제)
**핵심 동작**: Blob URL 라이프사이클 관리 (삭제/리셋 시 `URL.revokeObjectURL()`)

### 4.6 useExportStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `status` | `ExportStatus` | `"idle"` | 내보내기 상태 |
| `progress` | `number` | `0` | 진행률 (0~100%) |
| `resolution` | `ExportResolution` | `1920×1080` | 내보내기 해상도 |
| `error` | `string \| null` | `null` | 에러 메시지 |

**Actions**: `setStatus`, `setProgress`, `setResolution`, `setError`, `reset`
**의존성**: 없음 (독립)

### 4.7 useZoomStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `zoom` | `number` | `100` | 타임라인 줌 레벨 |

**Actions**: `zoomIn`, `zoomOut`, `setZoom`
**제약**: MIN=10, MAX=500, STEP=20
**의존성**: 없음 (독립)

### 4.8 useUIStore

| State | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `showShortcutHelp` | `boolean` | `false` | 단축키 모달 표시 |

**Actions**: `toggleShortcutHelp`
**의존성**: 없음 (독립)

### 스토어 상호의존성 다이어그램

```
useMediaStore ──removeAsset()──→ useTimelineStore.removeClipsByAssetId()
                                      ↑↓
useHistoryStore ←──pushSnapshot()──── useTimelineStore (스냅샷 촬영/복원)

usePlaybackStore ←── usePlayback 훅 (rAF 루프)
                 ←── useEditorKeyboard (Space, Arrow)

useProjectStore ←── useEditorKeyboard (fps 기반 프레임 스텝)
                ←── Header (프로젝트 저장/불러오기)

useExportStore ←── useExport 훅 (FFmpeg 진행률)

useZoomStore ←── Timeline, useEditorKeyboard (Ctrl+/-)

useUIStore ←── useEditorKeyboard (Shift+?)
```

### 프로젝트 직렬화

```typescript
// projectSerializer.ts
interface ProjectData {
  version: number;
  project: { name, width, height, fps };
  timeline: { tracks: Track[] };
  mediaRefs: MediaRef[];  // 미디어 메타데이터만 (파일 본문 제외)
  savedAt: string;
}
```

`serializeProject()`: 3개 스토어 → JSON, `deserializeProject()`: JSON → 3개 스토어 복원

---

## 5. 컴포넌트 아키텍처

### 컴포넌트 트리

```
App (DndContext 래퍼)
├── EditorLayout
│   ├── Header
│   │   └── ExportPanel (팝오버)
│   ├── MediaPool (사이드바)
│   │   ├── MediaUploader (드롭존)
│   │   └── MediaItem[] (드래그 가능)
│   ├── PreviewPanel (PixiJS 캔버스)
│   ├── Timeline
│   │   ├── PlaybackControls
│   │   ├── TimelineToolbar
│   │   ├── TimeRuler (클릭/드래그 탐색)
│   │   ├── Playhead (빨간 세로선)
│   │   └── TrackRow[] (드롭 가능)
│   │       ├── ClipBlock[] (드래그 가능)
│   │       ├── AudioClipBlock[] (드래그 가능)
│   │       ├── TextClipBlock[] (드래그+리사이즈)
│   │       ├── TransitionBlock[] → TransitionPopover
│   │       ├── AddTransitionButton[]
│   │       ├── DropIndicator
│   │       └── SnapIndicator
│   └── InspectorPanel
│       ├── FilterPanel (비디오 클립)
│       ├── TransformPanel (비디오 클립)
│       ├── AudioPanel (오디오 클립)
│       └── TextOverlayPanel (텍스트 클립)
├── DragOverlay (드래그 중 표시)
└── KeyboardShortcutHelp (포탈 모달)
```

### 각 컴포넌트 상세

#### App.tsx
- DndContext로 전체 앱 래핑
- `useTimelineDragDrop` 훅으로 D&D 이벤트 처리
- DragOverlay: 드래그 중 아이템 정보 표시 (이모지 아이콘 포함)

#### EditorLayout.tsx
- 반응형 그리드 레이아웃
- 프리뷰/타임라인 사이 리사이즈 가능한 분할선 (최소 120px)
- 모바일: 사이드바 접기/펼치기 (햄버거 토글)
- 데스크톱: 사이드바 288px 고정, 인스펙터 224px 고정
- ResizeObserver로 컨테이너 높이 추적

#### Header.tsx
- 프로젝트 이름 표시
- 저장: 프로젝트 JSON 다운로드
- 불러오기: JSON 파일에서 프로젝트 복원
- 내보내기: ExportPanel 팝오버 토글

#### MediaPool.tsx / MediaUploader.tsx / MediaItem.tsx
- MediaUploader: 드래그 앤 드롭 파일 업로드 영역 + 클릭 파일 선택
- MediaItem: 썸네일/아이콘 표시, 파일 크기/길이, 삭제 버튼, dnd-kit 드래그 가능
- 에러 표시 및 dismiss 기능

#### PreviewPanel.tsx
- `usePixiApp`으로 PixiJS Application 초기화
- `usePreviewRenderer`로 실시간 렌더링
- 클립 없을 때 빈 상태 메시지 표시
- 하단 상태바: 현재 시간 | 해상도

#### Timeline.tsx
- PlaybackControls, TimelineToolbar 상단 배치
- TimeRuler: 클릭/드래그 탐색, 동적 눈금 간격 (줌 레벨 기반)
- Playhead: currentTime 위치에 빨간 세로선
- TrackRow 목록 렌더링
- 스크롤 동기화 (타임라인 ↔ 눈금자)

#### TrackRow.tsx (메모이즈됨)
- 왼쪽 패널 (112px): 트랙 이름, 삭제, 뮤트/잠금 토글
- 텍스트 트랙: 텍스트 클립 추가 버튼, 더블클릭 추가
- 비디오 트랙: 트랜지션 블록 및 추가 버튼 렌더링
- 잠금 시 오버레이 표시

#### ClipBlock.tsx / AudioClipBlock.tsx / TextClipBlock.tsx (메모이즈됨)
- ClipBlock: 회색(기본)/파란색(선택), startTime/duration 기반 배치
- AudioClipBlock: 녹색 계열
- TextClipBlock: 황색 계열, 좌우 리사이즈 핸들 (최소 0.5초)

#### TransitionBlock.tsx / AddTransitionButton.tsx / TransitionPopover.tsx
- TransitionBlock: 두 클립 사이 노란 점선, 클릭으로 팝오버 토글
- AddTransitionButton: 두 클립 사이 + 버튼, 호버 시 노란 글로우
- TransitionPopover: Portal, 2×2 타입 그리드, 길이 슬라이더, 삭제 버튼

#### InspectorPanel.tsx
- 선택된 클립 타입에 따라 적절한 서브 패널 렌더링
- 비디오: FilterPanel + TransformPanel
- 오디오: AudioPanel
- 텍스트: TextOverlayPanel

#### FilterPanel.tsx / TransformPanel.tsx / AudioPanel.tsx / TextOverlayPanel.tsx
- 실시간 프리뷰 반영, `useDebouncedSnapshot`으로 히스토리 배칭
- FilterPanel: 밝기/대비/채도 슬라이더 (-100~+100)
- TransformPanel: X/Y 위치 (0~100), X/Y 스케일 (0.1~2.0), 회전 (-360~360)
- AudioPanel: 볼륨 슬라이더 (0~200%)
- TextOverlayPanel: 내용 textarea, 시작시간, 길이, 위치, 폰트크기, 색상, 투명도

#### KeyboardShortcutHelp.tsx
- 고정 위치 모달, 백드롭 클릭으로 닫기
- 13개 키보드 단축키 테이블 표시
- 플랫폼 인식: Ctrl/Cmd 자동 전환

---

## 6. 커스텀 훅

### 6.1 usePlayback

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/usePlayback.ts` |
| **목적** | requestAnimationFrame 기반 재생 루프 |
| **파라미터** | 없음 |
| **반환값** | `void` (사이드 이펙트) |
| **핵심 로직** | `lastTimeRef`로 프레임 간 delta 계산, `currentTime` += delta, duration 도달 시 자동 정지 |

### 6.2 usePreviewRenderer

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/usePreviewRenderer.ts` |
| **목적** | PixiJS 캔버스에 실시간 비디오 프리뷰 렌더링 |
| **파라미터** | `appRef: RefObject<Application>`, `ready: boolean` |
| **반환값** | `void` (사이드 이펙트) |
| **핵심 로직** | 스프라이트 엔트리 관리, ColorMatrixFilter로 필터 적용, 비디오/오디오 동기화, 텍스트 오버레이 렌더링, 트랜지션 효과 적용, 트랜스폼 적용 |

### 6.3 useTimelineDragDrop

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useTimelineDragDrop.ts` |
| **목적** | 미디어/클립 드래그 앤 드롭 오케스트레이션 |
| **파라미터** | 없음 |
| **반환값** | `{ handleDragEnd, handleDragMove, clearIndicator }` |
| **핵심 로직** | 미디어 드롭 → 클립 생성 (오디오 트랙 자동 생성 포함), 클립 이동 (겹침 계산), 텍스트 클립 이동 (텍스트→텍스트만), 잠긴 트랙 보호, 드롭/스냅 인디케이터 업데이트, 히스토리 스냅샷 |

### 6.4 useEditorKeyboard

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useEditorKeyboard.ts` |
| **목적** | 전역 키보드 단축키 처리 |
| **파라미터** | 없음 |
| **반환값** | `void` (사이드 이펙트) |
| **단축키 목록** | Space(재생/정지), Delete/Backspace(삭제), Ctrl+S(분할), Ctrl+Z(실행취소), Ctrl+Shift+Z(재실행), ←→(프레임 스텝/5초 스킵), Home/End(처음/끝), Ctrl+=/-/0(줌), ?(단축키 도움말) |
| **핵심 로직** | INPUT/TEXTAREA 요소에서는 무시 |

### 6.5 useExport

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useExport.ts` |
| **목적** | FFmpeg.wasm을 통한 비디오 내보내기 오케스트레이션 |
| **파라미터** | 없음 |
| **반환값** | `{ status, progress, resolution, error, startExport }` |
| **핵심 로직** | 클립 존재 검증 → 입력 파일 FFmpeg FS에 쓰기 → 비디오/오디오 FFmpeg 인자 빌드 → 실행 → MP4 다운로드 |

### 6.6 usePixiApp

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/usePixiApp.ts` |
| **목적** | PixiJS Application 인스턴스 관리 |
| **파라미터** | `containerRef: RefObject<HTMLDivElement \| null>` |
| **반환값** | `{ app: RefObject<Application \| null>, ready: boolean }` |
| **핵심 로직** | 비동기 PixiJS 초기화, ResizeObserver로 리사이즈 (100ms 디바운스), 언마운트 시 앱 파괴 |

### 6.7 useFileDrop

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useFileDrop.ts` |
| **목적** | 파일 드래그 앤 드롭 처리 |
| **파라미터** | `onFileDrop: (files: File[]) => void` |
| **반환값** | `{ isDragOver: boolean, handlers: { onDragEnter, onDragLeave, onDragOver, onDrop } }` |
| **핵심 로직** | `enterCountRef`로 중첩 드래그 이벤트 카운팅, 카운터가 0이 되어야 dragLeave 트리거 |

### 6.8 useMediaUpload

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useMediaUpload.ts` |
| **목적** | 미디어 파일 검증, 메타데이터 추출, 에셋 생성 |
| **파라미터** | 없음 |
| **반환값** | `{ uploadFiles, errors: UploadError[], clearErrors }` |
| **핵심 로직** | MIME 타입/크기 검증, Object URL 생성, 이미지 썸네일 생성, 비동기 메타데이터 추출, 에러 수집 |

### 6.9 useDebouncedSnapshot

| 항목 | 내용 |
|------|------|
| **파일** | `src/hooks/useDebouncedSnapshot.ts` |
| **목적** | 빠른 연속 변경을 단일 히스토리 스냅샷으로 배칭 |
| **파라미터** | 없음 |
| **반환값** | `{ scheduleSnapshot }` |
| **핵심 로직** | 300ms 디바운스, 첫 호출 시 스냅샷 푸시, 타임아웃 후 배치 플래그 리셋 |

---

## 7. 유틸리티 함수

### 7.1 타임라인 유틸 (timelineUtils.ts)

| 함수 | 설명 |
|------|------|
| `timeToPixel(time, zoom)` | 시간 → 픽셀 변환 |
| `pixelToTime(pixel, zoom)` | 픽셀 → 시간 변환 (최소 0) |
| `getClipEnd(clip)` | 클립 끝 시간 (startTime + duration) |
| `detectOverlap(a, b)` | 두 클립 겹침 감지 |
| `findOverlappingClips(clips, target)` | 대상과 겹치는 모든 클립 탐색 |
| `getTrackDuration(track)` | 트랙 총 길이 (clips + textClips 포함) |
| `getTimelineDuration(tracks)` | 프로젝트 총 길이 |
| `calculateDropPosition(...)` | 드롭 위치 계산 (스냅 포함) |
| `findDropIndex(sortedClips, dropTime)` | 중간점 규칙으로 삽입 인덱스 계산 |
| `getStartTimeAtIndex(sortedClips, index)` | 인덱스 위치의 시작 시간 |
| `reorderAndCompact(otherClips, insertClip, index)` | 클립 삽입 후 컴팩트 배치 |
| `findInsertPosition(clips, startTime, duration)` | 겹치지 않는 삽입 위치 탐색 |

### 7.2 편집 유틸 (editUtils.ts)

| 함수 | 설명 |
|------|------|
| `splitClipAt(clip, splitTime, leftId, rightId)` | 클립 분할 (in/outPoint 보존) |
| `trimClip(clip, newStartTime, newEndTime)` | 클립 트림 (최소 0.1초 보장) |

### 7.3 프리뷰 유틸 (previewUtils.ts)

| 함수 | 반환 타입 | 설명 |
|------|----------|------|
| `getVisibleClipsAtTime(tracks, time)` | `VisibleClip[]` | 현재 시간에 보이는 비디오 클립 (트랜지션 진행률 포함) |
| `getVisibleAudioClipsAtTime(tracks, time)` | `VisibleAudioClip[]` | 현재 시간에 보이는 오디오 클립 (뮤트 제외) |
| `getVisibleTextClipsAtTime(tracks, time)` | `VisibleTextClip[]` | 현재 시간에 보이는 텍스트 클립 (뮤트 제외) |

### 7.4 내보내기 유틸 (exportUtils.ts)

| 함수 | 설명 |
|------|------|
| `getSortedVideoClips(tracks)` | 비디오 클립 정렬 추출 |
| `getSortedAudioClips(tracks)` | 오디오 클립 정렬 추출 |
| `buildFFmpegArgs(...)` | FFmpeg 커맨드 인자 생성 (단일/연결/xfade 분기) |
| `buildAudioMixFilter(...)` | 오디오 믹싱 FFmpeg 필터 생성 |

내부 분기:
- 단일 클립: `buildSingleClipArgs()`
- 다중 클립 + 트랜지션: `buildXfadeArgs()`
- 다중 클립 트랜지션 없음: `buildConcatArgs()`

### 7.5 필터 유틸 (filterUtils.ts)

| 함수 | 설명 |
|------|------|
| `isDefaultFilter(filter)` | 기본 필터인지 확인 |
| `clampFilterValue(value)` | 값 범위 제한 (-100~+100) |
| `toPixiBrightness/Contrast/Saturation(value)` | UI값 → PixiJS 변환 |
| `toFFmpegBrightness/Contrast/Saturation(value)` | UI값 → FFmpeg 변환 |
| `buildEqFilterString(filter)` | FFmpeg eq 필터 문자열 생성 |

**변환 수식**:
- PixiJS: brightness(-100~+100) → (0~2), contrast → (-1~+1), saturation → (-1~+1)
- FFmpeg: brightness(-100~+100) → (-1~+1), contrast → (0~2), saturation → (0~2)

### 7.6 트랜지션 유틸 (transitionUtils.ts)

| 함수 | 설명 |
|------|------|
| `canAddTransition(clip, nextClip)` | 트랜지션 추가 가능 여부 |
| `validateTransitionDuration(clip, nextClip, duration)` | 길이 유효성 검증 |
| `getTransitionProgress(currentTime, start, duration)` | 진행률 계산 (0~1) |
| `getTransitionOverlapRange(clip)` | 트랜지션 겹침 시간 범위 |

### 7.7 텍스트 유틸 (textClipUtils.ts, textSanitizer.ts, textOverlayExport.ts)

| 함수 | 설명 |
|------|------|
| `findNonOverlappingStartTime(...)` | 겹치지 않는 시작 시간 탐색 |
| `createDefaultTextClip(...)` | 기본 텍스트 클립 생성 |
| `sanitizeTextInput(input, maxLength)` | HTML 태그/제어문자 제거, 길이 제한 |
| `escapeForDrawtext(text)` | FFmpeg drawtext 특수문자 이스케이프 |
| `isValidHexColor(color)` | #RRGGBB 형식 검증 |
| `buildDrawtextFilter(overlay, ...)` | FFmpeg drawtext 필터 문자열 생성 |

### 7.8 렌더러 (filterRenderer.ts, transitionRenderer.ts, textOverlayRenderer.ts)

| 함수 | 설명 |
|------|------|
| `applyClipFilter(sprite, colorFilter, filter)` | PixiJS ColorMatrixFilter 적용 |
| `clearClipFilter(sprite, colorFilter)` | PixiJS 필터 제거 |
| `applyFadeTransition(out, in, progress)` | 페이드 트랜지션 (알파 블렌딩) |
| `applyWipeTransition(out, in, progress, dir, pw, ph)` | 와이프 트랜지션 (마스킹) |
| `clearTransitionEffects(sprite)` | 트랜지션 효과 초기화 |
| `applyTextOverlay(container, ...)` | PixiJS 텍스트 생성/갱신 + 드래그 인터랙션 |
| `clearTextOverlay(container, textRef, clipId)` | 텍스트 숨김 |
| `destroyAllTextOverlays(textRef)` | 전체 텍스트 정리 |

### 7.9 기타 유틸

| 파일 | 함수 | 설명 |
|------|------|------|
| `cn.ts` | `cn(...inputs)` | clsx + tailwind-merge 조합 |
| `generateId.ts` | `generateId()` | `crypto.randomUUID()` |
| `formatDuration.ts` | `formatDuration(seconds)` | MM:SS 또는 H:MM:SS 포맷 |
| `formatFileSize.ts` | `formatFileSize(bytes)` | B/KB/MB/GB 포맷 |
| `sanitizeFileName.ts` | `sanitizeFileName(name)` | 파일명 새니타이징 (빈 결과 시 "unnamed") |
| `validateMediaFile.ts` | `validateMediaFile(file)` | 파일 크기/MIME 타입 검증 |
| `extractMetadata.ts` | `extractMetadata(file, type)` | 비디오/오디오/이미지 메타데이터 추출 (10초 타임아웃) |
| `projectSerializer.ts` | `serializeProject()` / `deserializeProject()` / `downloadProjectFile()` | 프로젝트 직렬화/역직렬화/다운로드 |
| `previewOffsets.ts` | `computePreviewOffsets(...)` / `applyPreviewOffsets(...)` / `clearAllPreviewOffsets()` | D&D 시 클립 위치 프리뷰 |

### 7.10 DOM 참조 맵 (모듈 레벨)

| 파일 | 맵 | 설명 |
|------|-----|------|
| `clipBlockRefs.ts` | `clipBlockMap: Map<string, HTMLButtonElement>` | 클립 DOM 요소 참조 |
| `dropIndicatorRefs.ts` | `dropIndicatorMap: Map<string, HTMLDivElement>` | 드롭 인디케이터 참조 |
| `snapIndicatorRefs.ts` | `snapIndicatorMap: Map<string, HTMLDivElement>` | 스냅 인디케이터 참조 |

---

## 8. 서비스

### FFmpeg.wasm 통합 (ffmpegService.ts)

싱글턴 패턴으로 FFmpeg 인스턴스를 lazy-loading.

```typescript
// 모듈 레벨 상태
let ffmpeg: FFmpeg | null = null;
```

| 함수 | 설명 |
|------|------|
| `getFFmpeg(onProgress?)` | FFmpeg lazy 초기화. WASM CDN: `unpkg.com/@ffmpeg/core@0.12.6/dist/esm`. 선택적 진행률 콜백 |
| `writeInputFile(ff, fileName, url)` | URL에서 파일 fetch → FFmpeg 파일시스템에 쓰기 |
| `runExport(ff, args)` | FFmpeg 실행, `output.mp4` 반환 (Uint8Array) |
| `downloadBlob(data, fileName)` | Blob 생성 → 브라우저 다운로드 트리거 |

**내보내기 파이프라인**:
1. `getFFmpeg()` — WASM 로드
2. `writeInputFile()` — 각 에셋 파일 쓰기
3. `buildFFmpegArgs()` — 인자 생성 (트림, 필터, 트랜지션, 텍스트, 오디오 믹싱 포함)
4. `runExport()` — FFmpeg 실행
5. `downloadBlob()` — 결과물 다운로드

**COOP/COEP 요구사항**: FFmpeg.wasm은 SharedArrayBuffer가 필요하여 다음 헤더가 필수:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

**내보내기 설정**:
- 코덱: libx264 (preset: fast) + aac
- 컨테이너: MP4
- 해상도: 480p / 720p / 1080p 선택 가능

---

## 9. 설정 및 인프라

### 9.1 Vite (vite.config.ts)

- 플러그인: `@vitejs/plugin-react`
- 별칭: `@` → `src/`
- 개발 서버 헤더: COOP/COEP 설정 (SharedArrayBuffer 지원)

### 9.2 TypeScript (tsconfig.app.json)

- Target: ES2020
- Lib: ES2020, DOM, DOM.Iterable
- Strict 모드 활성화
- 경로 별칭: `@/*` → `src/*`

### 9.3 Biome (biome.json)

**포매터**:
- 탭 들여쓰기 (너비 2)
- 줄 너비: 100자
- 쌍따옴표, 항상 세미콜론, trailing 쉼표, 화살표 괄호

**린터 (strict)**:
- 최대 인지 복잡도: 15 (경고)
- 사용하지 않는 import/변수: 에러
- `any` 타입: 에러
- null assertion: 경고

### 9.4 Tailwind CSS

- PostCSS 플러그인: `@tailwindcss/postcss`

### 9.5 테스트 (vitest.config.ts)

- 환경: jsdom
- 셋업 파일: `tests/setup.ts`
- 포함 패턴: `src/**/*.test.{ts,tsx}`, `tests/**/*.test.{ts,tsx}`
- 전역: true

### 9.6 CI/CD (.github/workflows/ci.yml)

**트리거**: `main` 브랜치 PR

**잡 (병렬 실행 후 빌드)**:

| 잡 | 명령어 | 의존성 |
|----|--------|--------|
| Lint | `pnpm biome check .` | 없음 |
| Type Check | `pnpm tsc -b --noEmit` | 없음 |
| Test | `pnpm vitest run` | 없음 |
| Build | `pnpm build` | Lint + Type Check + Test 모두 통과 |

### 9.7 package.json 스크립트

| 스크립트 | 명령어 |
|---------|--------|
| `dev` | Vite 개발 서버 |
| `build` | TypeScript 체크 + Vite 빌드 |
| `lint` | Biome check (--write) |
| `test` | Vitest (watch) |
| `test:run` | Vitest (단일 실행) |
| `test:coverage` | 커버리지 리포트 |

---

## 10. 아키텍처 패턴

### 10.1 드래그 앤 드롭 (dnd-kit)

```
App → DndContext
  ├── MediaItem (useDraggable) → 미디어 라이브러리에서 드래그
  ├── ClipBlock / AudioClipBlock / TextClipBlock (useDraggable) → 타임라인 내 드래그
  └── TrackRow (useDroppable) → 드롭 대상

useTimelineDragDrop 훅:
  - handleDragMove: 드롭/스냅 인디케이터 업데이트
  - handleDragEnd: 드롭 처리 (미디어→클립 생성, 클립 이동)
```

**주요 규칙**:
- 미디어 드롭: 비디오→비디오 트랙, 오디오→오디오 트랙 (자동 생성), 이미지→비디오 트랙
- 클립 이동: 같은 타입 트랙 간만 가능
- 텍스트 클립: 텍스트 트랙 간만 이동 가능
- 잠긴 트랙: 드래그 출발/도착 모두 차단
- 스냅: 8px 임계값으로 클립 경계에 스냅

### 10.2 실시간 프리뷰 (PixiJS)

```
usePlayback (rAF 루프) → currentTime 갱신
  ↓
usePreviewRenderer (rAF 루프):
  1. getVisibleClipsAtTime() → 현재 시간 클립 탐색
  2. 스프라이트 엔트리 관리 (생성/재사용/숨김)
  3. 비디오 요소 → PixiJS Sprite (VideoResource)
  4. applyClipFilter() → ColorMatrixFilter 적용
  5. 트랜스폼 적용 (위치/크기/회전)
  6. applyFadeTransition() / applyWipeTransition() → 트랜지션 효과
  7. applyTextOverlay() → 텍스트 렌더링 (드래그 이동 가능)
  8. 오디오 동기화 (비디오 요소의 currentTime 설정)
```

### 10.3 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Space` | 재생/정지 |
| `Delete` / `Backspace` | 선택 클립 삭제 |
| `Ctrl+S` | 현재 시간에서 클립 분할 |
| `Ctrl+Z` | 실행 취소 |
| `Ctrl+Shift+Z` | 재실행 |
| `←` / `→` | 1프레임 이동 |
| `Shift+←` / `Shift+→` | 5초 이동 |
| `Home` / `End` | 처음/끝으로 이동 |
| `Ctrl+=` / `Ctrl+-` | 줌 인/아웃 |
| `Ctrl+0` | 줌 리셋 |
| `?` (Shift+/) | 단축키 도움말 |

INPUT/TEXTAREA 포커스 시 무시.

### 10.4 내보내기 파이프라인

```
사용자 "내보내기" 클릭
  ↓
useExport 훅:
  1. 클립 존재 검증
  2. status = "preparing"
  3. getFFmpeg() → WASM 로드
  4. writeInputFile() × N → 에셋 파일 FS 쓰기
  5. buildFFmpegArgs() → 커맨드 인자 생성
     ├── 단일 클립: 직접 인코딩
     ├── 다중 + 트랜지션: xfade 필터
     └── 다중 트랜지션 없음: concat 필터
     + 필터 (eq), 트랜스폼 (scale/rotate/pad), 텍스트 (drawtext)
     + 오디오 믹싱 (atrim/adelay/volume/amix)
  6. status = "encoding"
  7. runExport() → FFmpeg 실행 (진행률 콜백)
  8. status = "done"
  9. downloadBlob() → output.mp4 다운로드
```

### 10.5 프로젝트 저장/불러오기

```
저장: serializeProject()
  → useProjectStore + useTimelineStore + useMediaStore 스냅샷
  → JSON (미디어 파일 본문 제외, 메타데이터만 포함)
  → downloadProjectFile() → .json 다운로드

불러오기: deserializeProject(json)
  → JSON 파싱 및 검증
  → 3개 스토어 상태 복원
  → 미디어 파일은 재업로드 필요 (objectUrl 비포함)
```

### 10.6 히스토리 (Undo/Redo)

```
사용자 액션 (클립 이동, 필터 변경 등)
  ↓
useDebouncedSnapshot.scheduleSnapshot()
  → 300ms 디바운스
  → useHistoryStore.pushSnapshot()
    → useTimelineStore 스냅샷 (deep clone)
    → past 스택에 추가 (MAX 50)
    → future 스택 초기화

Ctrl+Z → undo(): past.pop() → 현재 → future.push()
Ctrl+Shift+Z → redo(): future.pop() → 현재 → past.push()
```

### 10.7 메모리 관리

- `URL.createObjectURL()`: 미디어 파일 참조 (메모리에 복사하지 않음)
- `URL.revokeObjectURL()`: 에셋 삭제/리셋 시 호출 (메모리 누수 방지)
- 기본값 `undefined` 리셋: 필터/볼륨/트랜스폼이 기본값이면 `undefined`로 저장
- 모듈 레벨 DOM 참조 맵: React 렌더 사이클 외부에서 효율적 DOM 접근
- 텍스트 오브젝트: 보이는 시간에만 생성

---

## 11. 상수 정의

### 타임라인

| 상수 | 값 | 설명 |
|------|----|------|
| `DEFAULT_ZOOM` | `60` | 기본 줌 레벨 |
| `MIN_ZOOM` | `10` | 최소 줌 |
| `MAX_ZOOM` | `500` | 최대 줌 |
| `SNAP_THRESHOLD_PX` | `8` | 스냅 임계값 (px) |
| `TRACK_HEIGHT` | `48` | 트랙 높이 (px) |
| `TIME_RULER_HEIGHT` | `24` | 눈금자 높이 (px) |
| `MIN_CLIP_DURATION` | `0.1` | 최소 클립 길이 (초) |
| `MAX_TRACKS` | `20` | 최대 트랙 수 |

### 필터

| 상수 | 값 | 설명 |
|------|----|------|
| `FILTER_MIN` | `-100` | 최솟값 |
| `FILTER_MAX` | `100` | 최댓값 |
| `FILTER_DEFAULT` | `0` | 기본값 |
| `FILTER_STEP` | `1` | 단위 |
| `FILTER_TYPES` | `["brightness", "contrast", "saturation"]` | 필터 종류 |
| `FILTER_LABELS` | `{brightness: "밝기", contrast: "대비", saturation: "채도"}` | 한국어 라벨 |
| `DEFAULT_CLIP_FILTER` | `{brightness: 0, contrast: 0, saturation: 0}` | 기본 필터 |

### 트랜지션

| 상수 | 값 | 설명 |
|------|----|------|
| `MIN_TRANSITION_DURATION` | `0.3` | 최소 길이 (초) |
| `MAX_TRANSITION_DURATION` | `2.0` | 최대 길이 (초) |
| `DEFAULT_TRANSITION_DURATION` | `0.5` | 기본 길이 (초) |
| `TRANSITION_TYPES` | `["fade", "dissolve", "wipe-left", "wipe-right"]` | 트랜지션 종류 |
| `TRANSITION_LABELS` | `{fade: "페이드", dissolve: "디졸브", "wipe-left": "왼쪽 와이프", "wipe-right": "오른쪽 와이프"}` | 한국어 라벨 |
| `TRANSITION_TO_FFMPEG_MAP` | `{fade: "fade", dissolve: "dissolve", "wipe-left": "wipeleft", "wipe-right": "wiperight"}` | FFmpeg 매핑 |

### 텍스트 오버레이

| 상수 | 값 | 설명 |
|------|----|------|
| `TEXT_CLIP_DEFAULT_DURATION` | `3` | 기본 길이 (초) |
| `TEXT_MAX_LENGTH` | `200` | 최대 문자 수 |
| `TEXT_FONT_SIZE_MIN` / `MAX` | `12` / `120` | 폰트 크기 범위 |
| `TEXT_FONT_SIZE_STEP` | `1` | 폰트 크기 단위 |
| `TEXT_POSITION_MIN` / `MAX` | `0` / `100` | 위치 범위 (%) |
| `TEXT_POSITION_STEP` | `1` | 위치 단위 |
| `TEXT_OPACITY_MIN` / `MAX` | `0` / `100` | 투명도 범위 (%) |
| `TEXT_OPACITY_STEP` | `1` | 투명도 단위 |
| `TEXT_OVERLAY_DEFAULTS` | `{content: "", x: 50, y: 80, fontSize: 36, fontColor: "#FFFFFF", opacity: 100}` | 기본값 |

### 트랜스폼

| 상수 | 값 | 설명 |
|------|----|------|
| `TRANSFORM_DEFAULTS` | `{x: 50, y: 50, scaleX: 1, scaleY: 1, rotation: 0}` | 기본값 |
| `TRANSFORM_POSITION_MIN` / `MAX` | `0` / `100` | 위치 범위 |
| `TRANSFORM_POSITION_STEP` | `1` | 위치 단위 |
| `TRANSFORM_SCALE_MIN` / `MAX` | `0.1` / `3` | 스케일 범위 |
| `TRANSFORM_SCALE_STEP` | `0.01` | 스케일 단위 |
| `TRANSFORM_ROTATION_MIN` / `MAX` | `0` / `360` | 회전 범위 (도) |
| `TRANSFORM_ROTATION_STEP` | `1` | 회전 단위 |

### 오디오

| 상수 | 값 | 설명 |
|------|----|------|
| `AUDIO_VOLUME_MIN` | `0` | 최소 볼륨 |
| `AUDIO_VOLUME_MAX` | `1` | 최대 볼륨 |
| `AUDIO_VOLUME_DEFAULT` | `1` | 기본 볼륨 |
| `AUDIO_VOLUME_STEP` | `0.01` | 단위 |

### 내보내기

| 상수 | 값 | 설명 |
|------|----|------|
| `EXPORT_RESOLUTIONS` | `[{480p: 854×480}, {720p: 1280×720}, {1080p: 1920×1080}]` | 해상도 옵션 |
| `DEFAULT_EXPORT_RESOLUTION` | `{label: "1080p", width: 1920, height: 1080}` | 기본 해상도 |

### 미디어

| 상수 | 값 | 설명 |
|------|----|------|
| `ACCEPTED_VIDEO_TYPES` | `["video/mp4", "video/webm", "video/ogg", "video/quicktime"]` | 비디오 MIME |
| `ACCEPTED_AUDIO_TYPES` | `["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"]` | 오디오 MIME |
| `ACCEPTED_IMAGE_TYPES` | `["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]` | 이미지 MIME |
| `MAX_FILE_SIZE` | `2 * 1024 * 1024 * 1024` | 최대 파일 크기 (2GB) |

### 프로젝트

| 상수 | 값 | 설명 |
|------|----|------|
| `DEFAULT_PROJECT_NAME` | `"새 프로젝트"` | 기본 프로젝트 이름 |
| `DEFAULT_WIDTH` | `1920` | 기본 너비 |
| `DEFAULT_HEIGHT` | `1080` | 기본 높이 |
| `DEFAULT_FPS` | `30` | 기본 FPS |
