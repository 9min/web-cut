# 데이터 모델링 가이드

> WebCut은 순수 클라이언트 앱으로 백엔드/DB가 없다. 모든 데이터는 브라우저 메모리 및 IndexedDB(자동 저장)에만 존재한다.
> 이 문서는 프로젝트의 핵심 TypeScript 타입 시스템과 데이터 구조를 설명한다.

## 핵심 도메인 타입

### 미디어 에셋 (`src/types/media.ts`)

로컬 파일에서 불러온 미디어 파일의 메타데이터 및 상태를 표현한다.

```ts
export type MediaType = "video" | "audio" | "image";
export type MediaStatus = "loading" | "ready" | "error";

export interface MediaAsset {
  id: string;
  name: string;
  originalName: string;
  type: MediaType;
  mimeType: string;
  size: number;
  objectUrl: string;          // URL.createObjectURL() 결과값
  thumbnailUrl: string | null;
  metadata: MediaMetadata | null;
  status: MediaStatus;
  addedAt: number;
  errorMessage?: string;
}

// 미디어 타입별 메타데이터
export interface VideoMetadata { width: number; height: number; duration: number; fps: number; }
export interface AudioMetadata { duration: number; sampleRate: number; channelCount: number; }
export interface ImageMetadata { width: number; height: number; }
export type MediaMetadata = VideoMetadata | AudioMetadata | ImageMetadata;
```

### 타임라인 (`src/types/timeline.ts`)

트랙과 클립의 계층 구조를 표현한다.

```ts
export type TrackType = "video" | "audio" | "text";

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  textClips: TextClip[];
  muted: boolean;
  locked: boolean;
  order: number;
}

export interface Clip {
  id: string;
  trackId: string;
  assetId: string;
  name: string;
  startTime: number;      // 타임라인 상의 시작 시간 (초)
  duration: number;       // 타임라인 상의 길이 (초)
  inPoint: number;        // 소스 파일의 트림 시작점 (초)
  outPoint: number;       // 소스 파일의 트림 끝점 (초)
  outTransition?: Transition;
  filter?: ClipFilter;
  volume?: number;
  transform?: ClipTransform;
  keyframes?: ClipKeyframes;
}

export interface ClipTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}
```

### 텍스트 오버레이 (`src/types/textOverlay.ts`)

텍스트 클립과 오버레이 스타일을 표현한다.

```ts
export interface TextOverlay {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  opacity: number;
}

export interface TextClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  duration: number;
  overlay: TextOverlay;
}
```

### 트랜지션 (`src/types/transition.ts`)

클립 사이의 장면 전환 효과를 표현한다.

```ts
export type TransitionType = "fade" | "dissolve" | "wipe-left" | "wipe-right";

export interface Transition {
  type: TransitionType;
  duration: number;
}
```

### 필터 (`src/types/filter.ts`)

클립에 적용되는 영상 보정 필터를 표현한다.

```ts
export type FilterType = "brightness" | "contrast" | "saturation";

export interface ClipFilter {
  brightness: number; // -100 ~ +100, 기본값 0
  contrast: number;   // -100 ~ +100, 기본값 0
  saturation: number; // -100 ~ +100, 기본값 0
}
```

### 내보내기 설정 (`src/types/exportSettings.ts`)

FFmpeg.wasm 인코딩에 사용되는 포맷 및 품질 설정을 표현한다.

```ts
export type VideoFormat = "mp4" | "webm";
export type VideoCodec = "libx264" | "libvpx-vp9";
export type QualityPreset = "high" | "medium" | "low";

export interface ExportFormatSettings {
  format: VideoFormat;
  quality: QualityPreset;
}
```

### 프로젝트 설정 (`src/types/project.ts`)

편집기 전역 프로젝트 설정을 표현한다.

```ts
export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: number;
}
```

## 타입 파일 목록

| 파일 | 설명 |
|------|------|
| `src/types/media.ts` | 미디어 에셋 및 메타데이터 |
| `src/types/timeline.ts` | 타임라인, 트랙, 클립 |
| `src/types/textOverlay.ts` | 텍스트 오버레이 및 텍스트 클립 |
| `src/types/transition.ts` | 트랜지션 효과 |
| `src/types/filter.ts` | 영상 필터 |
| `src/types/export.ts` | 내보내기 상태 |
| `src/types/exportSettings.ts` | 내보내기 포맷/품질 설정 |
| `src/types/keyframe.ts` | 키프레임 애니메이션 |
| `src/types/editMode.ts` | 편집 모드 (선택/트림/분할 등) |
| `src/types/dnd.ts` | 드래그 앤 드롭 타입 |
| `src/types/project.ts` | 프로젝트 전역 설정 |

## 데이터 흐름

```
로컬 파일 (File API)
  └→ MediaAsset (objectUrl 참조)
       └→ Clip (assetId로 참조)
            └→ Track.clips[]
                 └→ TimelineStore 상태
                      └→ 프리뷰 렌더링 (PixiJS)
                      └→ 내보내기 (FFmpeg.wasm)
```

## 설계 원칙

- **불변 ID**: 모든 엔티티는 고유 `id`를 가지며, `generateId()` 유틸리티로 생성한다.
- **참조 방식**: 미디어 파일은 `URL.createObjectURL()`로 생성한 URL로만 참조한다. 파일 데이터를 상태에 직접 저장하지 않는다.
- **정규화**: 트랙과 클립은 분리된 구조를 유지하며, 클립은 `trackId`로 소속 트랙을 참조한다.
- **immer 활용**: 상태 불변성은 Zustand + immer 미들웨어로 관리한다.

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [상태 관리 전략](state-management.md)
- [보안 가이드](security-guide.md)
