# 상태 관리 전략

## 상태 분류

| 구분 | 정의 | 예시 | 관리 도구 |
|------|------|------|----------|
| 편집기 상태 | 타임라인, 클립, 트랙 등 편집기 핵심 데이터 | 클립 배치, 트랙 순서, 프로젝트 설정 | Zustand |
| 재생 상태 | 프리뷰 재생 관련 실시간 상태 | 현재 시간, 재생/정지, 루프 | Zustand |
| 히스토리 상태 | Undo/Redo 기록 | 상태 스냅샷 스택 | Zustand |
| UI 상태 | 특정 컴포넌트의 로컬 상태 | 모달 열림, 드래그 중, 호버 | useState / useReducer |

## Zustand 스토어 구조

### 스토어 분리 원칙

역할에 따라 스토어를 분리하여 관심사를 명확히 한다.

```
src/stores/
├── useProjectStore.ts          # 프로젝트 전역 설정
├── useMediaStore.ts            # 미디어 라이브러리
├── useTimelineStore.ts         # 타임라인, 트랙, 클립
├── usePlaybackStore.ts         # 재생 상태
└── useHistoryStore.ts          # Undo/Redo
```

### 프로젝트 스토어

```ts
// src/stores/useProjectStore.ts
import { create } from "zustand";

interface ProjectState {
  name: string;
  width: number;
  height: number;
  fps: number;
  setResolution: (width: number, height: number) => void;
  setFps: (fps: number) => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  name: "새 프로젝트",
  width: 1920,
  height: 1080,
  fps: 30,
  setResolution: (width, height) => set({ width, height }),
  setFps: (fps) => set({ fps }),
}));
```

### 미디어 스토어

```ts
// src/stores/useMediaStore.ts
import { create } from "zustand";
import type { MediaAsset } from "@/types/media";

interface MediaState {
  assets: MediaAsset[];
  addAsset: (asset: MediaAsset) => void;
  removeAsset: (id: string) => void;
}

export const useMediaStore = create<MediaState>()((set) => ({
  assets: [],
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  removeAsset: (id) =>
    set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),
}));
```

### 타임라인 스토어

```ts
// src/stores/useTimelineStore.ts
import { create } from "zustand";
import type { Track, Clip } from "@/types/timeline";

interface TimelineState {
  tracks: Track[];
  selectedClipId: string | null;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (trackId: string, clipId: string, newStartTime: number) => void;
  splitClip: (trackId: string, clipId: string, splitTime: number) => void;
  selectClip: (clipId: string | null) => void;
}

export const useTimelineStore = create<TimelineState>()((set) => ({
  tracks: [],
  selectedClipId: null,
  // ... 액션 구현
  addTrack: (track) =>
    set((state) => ({ tracks: [...state.tracks, track] })),
  removeTrack: (id) =>
    set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id) })),
  addClip: (trackId, clip) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t,
      ),
    })),
  removeClip: (trackId, clipId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t,
      ),
    })),
  moveClip: (trackId, clipId, newStartTime) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? { ...c, startTime: newStartTime } : c,
              ),
            }
          : t,
      ),
    })),
  splitClip: (_trackId, _clipId, _splitTime) => {
    // Phase 3에서 구현
  },
  selectClip: (clipId) => set({ selectedClipId: clipId }),
}));
```

### 재생 스토어

```ts
// src/stores/usePlaybackStore.ts
import { create } from "zustand";

interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlaybackStore = create<PlaybackState>()((set) => ({
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
}));
```

### Undo/Redo 히스토리 스토어

```ts
// src/stores/useHistoryStore.ts
import { create } from "zustand";

interface HistoryState {
  past: unknown[];
  future: unknown[];
  pushState: (state: unknown) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  pushState: (state) =>
    set((prev) => ({
      past: [...prev.past, state],
      future: [],
    })),
  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [previous, ...future],
    });
  },
  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, next],
      future: future.slice(1),
    });
  },
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
```

## UI 상태 관리

| 도구 | 사용 시점 | 예시 |
|------|----------|------|
| `useState` | 단순 토글, 단일 값 | 드래그 중 여부, 호버 상태 |
| `useReducer` | 복잡한 상태 로직, 여러 필드 연관 | 내보내기 설정 폼 |

## Zustand 사용 규칙

### Selector 사용

불필요한 리렌더링을 방지하기 위해 필요한 값만 선택한다.

```tsx
// 좋은 예: 필요한 값만 선택
const isPlaying = usePlaybackStore((state) => state.isPlaying);
const currentTime = usePlaybackStore((state) => state.currentTime);

// 나쁜 예: 전체 상태 구독 (모든 상태 변경 시 리렌더링)
const state = usePlaybackStore();
```

### 액션과 상태 분리

액션 함수는 리렌더링을 유발하지 않으므로 별도로 가져온다.

```tsx
// 좋은 예: 액션만 가져오기
const play = usePlaybackStore((state) => state.play);
const pause = usePlaybackStore((state) => state.pause);
```

### Devtools 미들웨어

개발 환경에서 상태 디버깅을 위해 devtools 미들웨어를 사용한다.

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useTimelineStore = create<TimelineState>()(
  devtools(
    (set) => ({
      // ... 상태 및 액션
    }),
    { name: "TimelineStore" },
  ),
);
```

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [성능 최적화 가이드](performance-guide.md)
