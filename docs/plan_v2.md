# WebCut v2.0 — 엔터프라이즈급 업그레이드 계획

> MVP → 프로덕션 레벨 영상 편집기로 도약하기 위한 상세 구현 계획.
> 실제 코드베이스 분석 기반으로 가장 부족하고 시급한 기능부터 우선순위를 정한다.

---

## 우선순위 기준

| 등급 | 기준 | 예시 |
|------|------|------|
| **P0 (치명적)** | 없으면 프로덕션 사용 불가 | 에러 바운더리, 자동 저장, 내보내기 취소 |
| **P1 (필수)** | 경쟁 제품 대비 핵심 열위 | 클립 트림 핸들, 클립보드, 오디오 파형 |
| **P2 (중요)** | 전문가 워크플로우에 필요 | 키프레임, 편집 모드, 멀티 선택 |
| **P3 (개선)** | 사용성/성능 향상 | 가상 스크롤, 프록시 미디어, 세이프존 |

---

## Phase 1: 안정성 및 데이터 보호 (P0)

### 1.1 에러 바운더리 도입

**문제**: App.tsx에 에러 바운더리가 없어 React 렌더링 에러 시 빈 화면 표시.

```typescript
// 현재: src/app/App.tsx — 에러 처리 없음
export function App() {
  return (
    <DndContext ...>
      <EditorLayout ... />  // 에러 시 전체 앱 크래시
    </DndContext>
  );
}
```

**구현**:

```typescript
// 신규: src/components/ui/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-900 text-white">
            <h1 className="text-xl font-bold">오류가 발생했습니다</h1>
            <p className="text-sm text-gray-400">{this.state.error?.message}</p>
            <button
              onClick={this.handleReset}
              className="rounded bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500"
            >
              다시 시도
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

```typescript
// 수정: src/app/App.tsx
export function App() {
  return (
    <ErrorBoundary>
      <DndContext ...>
        <EditorLayout ... />
      </DndContext>
    </ErrorBoundary>
  );
}
```

**파일**: `src/components/ui/ErrorBoundary.tsx` (신규), `src/app/App.tsx` (수정)
**테스트**: `tests/components/ui/ErrorBoundary.test.tsx`

---

### 1.2 자동 저장 (IndexedDB)

**문제**: 수동 저장만 가능. 브라우저 충돌/실수로 탭 닫기 시 모든 작업 유실.

```typescript
// 현재: src/utils/projectSerializer.ts — 수동 다운로드만 존재
export function downloadProjectFile(data: ProjectData): void {
  const json = JSON.stringify(data, null, 2); // 압축 없음
  const blob = new Blob([json], { type: "application/json" });
  // ...a.click() 다운로드...
}
```

**구현**:

```typescript
// 신규: src/services/autoSaveService.ts
const DB_NAME = "webcut-autosave";
const STORE_NAME = "projects";
const AUTO_SAVE_INTERVAL = 30_000; // 30초

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToIndexedDB(projectData: ProjectData): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({
    id: "current",
    data: projectData,
    savedAt: Date.now(),
  });
}

export async function loadFromIndexedDB(): Promise<ProjectData | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  return new Promise((resolve) => {
    const req = tx.objectStore(STORE_NAME).get("current");
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function clearAutoSave(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete("current");
}
```

```typescript
// 신규: src/hooks/useAutoSave.ts
import { useEffect, useRef } from "react";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { serializeProject } from "@/utils/projectSerializer";
import { saveToIndexedDB } from "@/services/autoSaveService";

const AUTO_SAVE_INTERVAL = 30_000;

export function useAutoSave(): void {
  const lastSaveRef = useRef<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const tracks = useTimelineStore.getState().tracks;
      const snapshot = JSON.stringify(tracks);

      // 변경 사항이 있을 때만 저장
      if (snapshot === lastSaveRef.current) return;
      lastSaveRef.current = snapshot;

      const data = serializeProject();
      saveToIndexedDB(data).catch(console.error);
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
```

**파일**: `src/services/autoSaveService.ts` (신규), `src/hooks/useAutoSave.ts` (신규)
**테스트**: `tests/services/autoSaveService.test.ts`, `tests/hooks/useAutoSave.test.ts`

---

### 1.3 내보내기 취소 + 세분화된 진행률

**문제**: 내보내기 시작 후 취소 불가. 진행률이 0~100% 단일 값으로만 표시.

```typescript
// 현재: src/services/ffmpegService.ts — 취소 메커니즘 없음
export async function runExport(ff: FFmpeg, args: string[]): Promise<Uint8Array> {
  await ff.exec(args);  // 블로킹, 취소 불가
  const data = await ff.readFile("output.mp4");
  return data as Uint8Array;
}
```

**구현**:

```typescript
// 수정: src/services/ffmpegService.ts
let currentAbortController: AbortController | null = null;

export function createExportController(): AbortController {
  currentAbortController = new AbortController();
  return currentAbortController;
}

export function cancelExport(): void {
  if (ffmpeg?.loaded) {
    // FFmpeg.wasm에서 abort 시그널을 사용하여 실행 취소
    ffmpeg.terminate();
    ffmpeg = null; // 다음 실행 시 재초기화
  }
  currentAbortController?.abort();
  currentAbortController = null;
}

export async function runExport(
  ff: FFmpeg,
  args: string[],
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (signal?.aborted) throw new DOMException("내보내기가 취소되었습니다.", "AbortError");

  const abortHandler = () => {
    ff.terminate();
  };
  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    await ff.exec(args);
    const data = await ff.readFile("output.mp4");
    return data as Uint8Array;
  } finally {
    signal?.removeEventListener("abort", abortHandler);
  }
}
```

```typescript
// 수정: src/stores/useExportStore.ts — 단계별 진행률 추가
type ExportStage = "idle" | "preparing" | "writing-files" | "encoding" | "finalizing" | "done" | "error" | "cancelled";

interface ExportState {
  status: ExportStage;
  progress: number;        // 전체 진행률 0~100
  stageProgress: number;   // 현재 단계 진행률 0~100
  resolution: ExportResolution;
  error: string | null;
  // ...actions
  cancelExport: () => void;
}
```

```typescript
// 수정: src/hooks/useExport.ts — 단계별 진행률 + 취소
const startExport = useCallback(async () => {
  const controller = createExportController();
  const signal = controller.signal;

  try {
    setStatus("preparing");
    setProgress(0);
    const ff = await getFFmpeg();

    // 파일 쓰기 단계 (5~30%)
    setStatus("writing-files");
    const totalFiles = clips.length + audioClips.length;
    let filesWritten = 0;

    for (const clip of clips) {
      if (signal.aborted) throw new DOMException("취소됨", "AbortError");
      await writeInputFile(ff, fileName, asset.objectUrl);
      filesWritten++;
      setProgress(5 + Math.round((filesWritten / totalFiles) * 25));
    }

    // 인코딩 단계 (30~95%)
    setStatus("encoding");
    ff.on("progress", ({ progress }) => {
      setProgress(30 + Math.round(progress * 65));
    });

    const outputData = await runExport(ff, args, signal);

    // 마무리 (95~100%)
    setStatus("finalizing");
    downloadBlob(outputData, `${safeName}.mp4`);
    setStatus("done");
    setProgress(100);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      setStatus("cancelled");
    } else {
      setError(err instanceof Error ? err.message : "내보내기 중 오류 발생");
    }
  }
}, []);
```

**파일**: `src/services/ffmpegService.ts` (수정), `src/stores/useExportStore.ts` (수정), `src/hooks/useExport.ts` (수정), `src/components/export/ExportPanel.tsx` (수정 — 취소 버튼 추가)
**테스트**: `tests/services/ffmpegService.test.ts`, `tests/hooks/useExport.test.ts`

---

### 1.4 Undo 액션 라벨 + 메모리 최적화

**문제**: 히스토리 스냅샷에 라벨이 없어 어떤 작업을 되돌리는지 알 수 없음. `JSON.parse(JSON.stringify)` deep copy가 대규모 프로젝트에서 성능 병목.

```typescript
// 현재: src/stores/useHistoryStore.ts
function takeSnapshot(): TimelineSnapshot {
  const { tracks, selectedClipId } = useTimelineStore.getState();
  return {
    tracks: JSON.parse(JSON.stringify(tracks)), // 비용 높은 deep copy
    selectedClipId,
  };
}
```

**구현**:

```typescript
// 수정: src/stores/useHistoryStore.ts
import { produce } from "immer"; // 신규 의존성

interface LabeledSnapshot {
  label: string;
  tracks: Track[];
  selectedClipId: string | null;
  timestamp: number;
}

interface HistoryState {
  past: LabeledSnapshot[];
  future: LabeledSnapshot[];
  pushSnapshot: (label: string) => void; // 라벨 필수
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoLabel: () => string | null;
  getRedoLabel: () => string | null;
  reset: () => void;
}

const MAX_HISTORY = 100; // 50 → 100으로 확대 (Immer로 메모리 절감)

function takeSnapshot(label: string): LabeledSnapshot {
  const { tracks, selectedClipId } = useTimelineStore.getState();
  return {
    label,
    tracks: produce(tracks, (draft) => draft), // 구조적 공유로 메모리 절감
    selectedClipId,
    timestamp: Date.now(),
  };
}

// 사용 예시:
// pushSnapshot("클립 이동");
// pushSnapshot("필터 변경: 밝기 +30");
// pushSnapshot("텍스트 클립 추가");
```

```typescript
// 수정: useEditorKeyboard.ts 등에서 라벨 전달
// Before:
useHistoryStore.getState().pushSnapshot();

// After:
useHistoryStore.getState().pushSnapshot("클립 삭제");
useHistoryStore.getState().pushSnapshot("클립 분할");
```

**의존성 추가**: `pnpm add immer`
**파일**: `src/stores/useHistoryStore.ts` (수정), 모든 `pushSnapshot()` 호출부 (라벨 추가)
**테스트**: `tests/stores/useHistoryStore.test.ts` (라벨 검증 추가)

---

## Phase 2: 핵심 편집 기능 (P1)

### 2.1 클립 인라인 트림 핸들

**문제**: 타임라인에서 클립 가장자리를 드래그하여 트림할 수 없음. 클립 블록이 단순한 사각형.

```typescript
// 현재: src/components/timeline/ClipBlock.tsx — 트림 UI 없음
<button
  className={cn(
    "absolute top-1 flex h-10 cursor-pointer items-center ...",
    isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-600 hover:bg-gray-500",
  )}
  style={{ left: `${left}px`, width: `${width}px` }}
  onClick={() => onSelect(clip.id)}
  {...listeners}
  {...attributes}
>
  <span className="truncate text-white">{clip.name}</span>
</button>
```

**구현**:

```typescript
// 수정: src/components/timeline/ClipBlock.tsx
interface ClipBlockProps {
  clip: Clip;
  zoom: number;
  isSelected: boolean;
  onSelect: (clipId: string) => void;
  onTrim: (clipId: string, edge: "left" | "right", deltaTime: number) => void; // 신규
}

export const ClipBlock = memo(function ClipBlock({
  clip, zoom, isSelected, onSelect, onTrim,
}: ClipBlockProps) {
  const left = timeToPixel(clip.startTime, zoom);
  const width = timeToPixel(clip.duration, zoom);

  const handleTrimStart = useCallback(
    (e: React.PointerEvent, edge: "left" | "right") => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const onMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaTime = pixelToTime(Math.abs(deltaX), zoom) * Math.sign(deltaX);
        onTrim(clip.id, edge, deltaTime);
      };

      const onUp = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
    },
    [clip.id, zoom, onTrim],
  );

  return (
    <button
      ref={combinedRef}
      className={cn(
        "group absolute top-1 flex h-10 cursor-pointer items-center ...",
        isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-600 hover:bg-gray-500",
      )}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={() => onSelect(clip.id)}
      {...listeners}
      {...attributes}
    >
      {/* 왼쪽 트림 핸들 */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/30"
        onPointerDown={(e) => handleTrimStart(e, "left")}
      />

      <span className="truncate px-2 text-white">{clip.name}</span>

      {/* 오른쪽 트림 핸들 */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/30"
        onPointerDown={(e) => handleTrimStart(e, "right")}
      />
    </button>
  );
});
```

```typescript
// 수정: src/stores/useTimelineStore.ts — trimClipAction 개선
trimClipByEdge: (trackId: string, clipId: string, edge: "left" | "right", deltaTime: number) => {
  set(produce((state: TimelineState) => {
    const track = state.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (edge === "left") {
      const newStartTime = Math.max(0, clip.startTime + deltaTime);
      const actualDelta = newStartTime - clip.startTime;
      clip.startTime = newStartTime;
      clip.duration -= actualDelta;
      clip.inPoint += actualDelta;
    } else {
      const newDuration = Math.max(MIN_CLIP_DURATION, clip.duration + deltaTime);
      const maxDuration = clip.outPoint - clip.inPoint;
      clip.duration = Math.min(newDuration, maxDuration);
      clip.outPoint = clip.inPoint + clip.duration;
    }
  }));
},
```

**파일**: `src/components/timeline/ClipBlock.tsx` (수정), `src/components/timeline/AudioClipBlock.tsx` (동일 패턴), `src/stores/useTimelineStore.ts` (수정)
**테스트**: `tests/components/timeline/ClipBlock.test.tsx`, `tests/stores/useTimelineStore.test.ts`

---

### 2.2 클립보드 (복사/붙여넣기)

**문제**: 클립 복사/붙여넣기 기능 없음. 같은 클립을 재사용하려면 미디어 풀에서 다시 드래그해야 함.

**구현**:

```typescript
// 신규: src/stores/useClipboardStore.ts
import { create } from "zustand";
import type { Clip } from "@/types/timeline";
import type { TextClip } from "@/types/textOverlay";

type ClipboardItem =
  | { type: "clip"; clip: Clip }
  | { type: "textClip"; textClip: TextClip };

interface ClipboardState {
  items: ClipboardItem[];
  copy: (items: ClipboardItem[]) => void;
  paste: () => ClipboardItem[];
  clear: () => void;
  hasItems: () => boolean;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],

  copy: (items) => {
    // deep clone으로 원본과 분리
    set({ items: JSON.parse(JSON.stringify(items)) });
  },

  paste: () => {
    const { items } = get();
    // 새 ID 부여하여 반환
    return items.map((item) => {
      if (item.type === "clip") {
        return {
          ...item,
          clip: { ...item.clip, id: generateId() },
        };
      }
      return {
        ...item,
        textClip: { ...item.textClip, id: generateId() },
      };
    });
  },

  clear: () => set({ items: [] }),
  hasItems: () => get().items.length > 0,
}));
```

```typescript
// 수정: src/hooks/useEditorKeyboard.ts — Ctrl+C, Ctrl+V 추가
// 기존 키보드 핸들러에 추가:
if (metaKey && key === "c") {
  e.preventDefault();
  const { selectedClipId, tracks } = useTimelineStore.getState();
  if (!selectedClipId) return;

  for (const track of tracks) {
    const clip = track.clips.find((c) => c.id === selectedClipId);
    if (clip) {
      useClipboardStore.getState().copy([{ type: "clip", clip }]);
      return;
    }
    const textClip = track.textClips.find((tc) => tc.id === selectedClipId);
    if (textClip) {
      useClipboardStore.getState().copy([{ type: "textClip", textClip }]);
      return;
    }
  }
}

if (metaKey && key === "v") {
  e.preventDefault();
  const currentTime = usePlaybackStore.getState().currentTime;
  const items = useClipboardStore.getState().paste();

  for (const item of items) {
    if (item.type === "clip") {
      const clip = { ...item.clip, startTime: currentTime };
      useTimelineStore.getState().addClip(clip.trackId, clip);
    }
  }
  useHistoryStore.getState().pushSnapshot("클립 붙여넣기");
}
```

**파일**: `src/stores/useClipboardStore.ts` (신규), `src/hooks/useEditorKeyboard.ts` (수정)
**테스트**: `tests/stores/useClipboardStore.test.ts`

---

### 2.3 오디오 파형 표시

**문제**: 오디오 트랙이 녹색 사각형으로만 표시됨. 오디오 콘텐츠를 시각적으로 확인할 수 없음.

**구현**:

```typescript
// 신규: src/services/waveformService.ts
const SAMPLES_PER_PIXEL = 256;

interface WaveformData {
  peaks: Float32Array;    // 정규화된 피크 값 (-1~1)
  duration: number;
  sampleRate: number;
}

// 오디오 파형 데이터 추출 (Web Audio API)
export async function generateWaveform(
  objectUrl: string,
  targetWidth: number,
): Promise<WaveformData> {
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const response = await fetch(objectUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPixel = Math.ceil(channelData.length / targetWidth);
  const peaks = new Float32Array(targetWidth);

  for (let i = 0; i < targetWidth; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  return {
    peaks,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}

// 캐시: assetId → WaveformData
const waveformCache = new Map<string, WaveformData>();

export async function getWaveform(
  assetId: string,
  objectUrl: string,
  width: number,
): Promise<WaveformData> {
  const cacheKey = `${assetId}_${width}`;
  if (waveformCache.has(cacheKey)) return waveformCache.get(cacheKey)!;

  const data = await generateWaveform(objectUrl, width);
  waveformCache.set(cacheKey, data);
  return data;
}
```

```typescript
// 신규: src/components/timeline/WaveformDisplay.tsx
import { memo, useEffect, useRef, useState } from "react";
import { getWaveform, type WaveformData } from "@/services/waveformService";

interface WaveformDisplayProps {
  assetId: string;
  objectUrl: string;
  width: number;
  height: number;
  inPoint: number;
  outPoint: number;
  duration: number;
}

export const WaveformDisplay = memo(function WaveformDisplay({
  assetId, objectUrl, width, height, inPoint, outPoint, duration,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveform, setWaveform] = useState<WaveformData | null>(null);

  useEffect(() => {
    getWaveform(assetId, objectUrl, Math.ceil(width)).then(setWaveform);
  }, [assetId, objectUrl, width]);

  useEffect(() => {
    if (!waveform || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(74, 222, 128, 0.6)"; // 녹색 반투명

    const startRatio = inPoint / duration;
    const endRatio = outPoint / duration;
    const totalPeaks = waveform.peaks.length;
    const startIdx = Math.floor(startRatio * totalPeaks);
    const endIdx = Math.ceil(endRatio * totalPeaks);

    const visiblePeaks = endIdx - startIdx;
    const pixelsPerPeak = width / visiblePeaks;

    for (let i = 0; i < visiblePeaks; i++) {
      const peak = waveform.peaks[startIdx + i] ?? 0;
      const barHeight = peak * height;
      const y = (height - barHeight) / 2;
      ctx.fillRect(i * pixelsPerPeak, y, Math.max(1, pixelsPerPeak - 0.5), barHeight);
    }
  }, [waveform, width, height, inPoint, outPoint, duration]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
});
```

```typescript
// 수정: src/components/timeline/AudioClipBlock.tsx — 파형 삽입
import { WaveformDisplay } from "./WaveformDisplay";

// 렌더링 부분에 추가:
<button ...>
  <WaveformDisplay
    assetId={clip.assetId}
    objectUrl={asset?.objectUrl ?? ""}
    width={width}
    height={40}
    inPoint={clip.inPoint}
    outPoint={clip.outPoint}
    duration={asset?.metadata?.duration ?? clip.duration}
  />
  <span className="relative z-10 truncate text-white">{clip.name}</span>
</button>
```

**파일**: `src/services/waveformService.ts` (신규), `src/components/timeline/WaveformDisplay.tsx` (신규), `src/components/timeline/AudioClipBlock.tsx` (수정)
**테스트**: `tests/services/waveformService.test.ts`, `tests/components/timeline/WaveformDisplay.test.tsx`

---

### 2.4 재생 속도 제어 + 루프 재생

**문제**: 재생 속도가 1x 고정. 루프 재생 불가.

```typescript
// 현재: src/hooks/usePlayback.ts — 속도/루프 없음
const delta = (timestamp - lastTimeRef.current) / 1000;
const newTime = currentTime + delta;
if (duration > 0 && newTime >= duration) {
  seek(duration);
  pause();
  return;
}
```

**구현**:

```typescript
// 수정: src/stores/usePlaybackStore.ts
interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  speed: number;           // 신규: 0.25 | 0.5 | 1 | 1.5 | 2
  loopEnabled: boolean;    // 신규
  loopIn: number | null;   // 신규: 루프 시작점
  loopOut: number | null;  // 신규: 루프 끝점
  // ...기존 actions
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
  setLoopRange: (inPoint: number | null, outPoint: number | null) => void;
}

// actions:
setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(4, speed)) }),
toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),
setLoopRange: (loopIn, loopOut) => set({ loopIn, loopOut }),
```

```typescript
// 수정: src/hooks/usePlayback.ts
export function usePlayback(): void {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }

    const tick = (timestamp: number) => {
      const {
        currentTime, duration, seek, pause, isPlaying: playing,
        speed, loopEnabled, loopIn, loopOut,
      } = usePlaybackStore.getState();

      if (!playing) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = ((timestamp - lastTimeRef.current) / 1000) * speed; // 속도 적용
      lastTimeRef.current = timestamp;
      const newTime = currentTime + delta;

      // 루프 범위 체크
      const effectiveEnd = loopEnabled && loopOut !== null ? loopOut : duration;
      const effectiveStart = loopEnabled && loopIn !== null ? loopIn : 0;

      if (effectiveEnd > 0 && newTime >= effectiveEnd) {
        if (loopEnabled) {
          seek(effectiveStart); // 루프 시작점으로 되감기
        } else {
          seek(duration);
          pause();
          return;
        }
      } else {
        seek(newTime);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);
}
```

```typescript
// 수정: src/components/timeline/PlaybackControls.tsx — 속도/루프 UI 추가
const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

// 렌더링에 추가:
<select
  value={speed}
  onChange={(e) => setSpeed(Number(e.target.value))}
  className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-white"
>
  {SPEED_OPTIONS.map((s) => (
    <option key={s} value={s}>{s}x</option>
  ))}
</select>

<button
  onClick={toggleLoop}
  className={cn(
    "rounded px-1.5 py-0.5 text-xs",
    loopEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400",
  )}
>
  루프
</button>
```

**파일**: `src/stores/usePlaybackStore.ts` (수정), `src/hooks/usePlayback.ts` (수정), `src/components/timeline/PlaybackControls.tsx` (수정)
**테스트**: `tests/stores/usePlaybackStore.test.ts`, `tests/hooks/usePlayback.test.ts`

---

### 2.5 내보내기 포맷 옵션

**문제**: MP4(H.264) 단일 포맷만 지원. WebM(VP9), MOV 등 미지원.

```typescript
// 현재: src/utils/exportUtils.ts — 하드코딩
args.push("-c:v", "libx264", "-preset", "fast");
args.push("-c:a", "aac");
args.push("output.mp4");
```

**구현**:

```typescript
// 신규: src/types/exportSettings.ts
export type VideoFormat = "mp4" | "webm";
export type VideoCodec = "h264" | "vp9";
export type AudioCodec = "aac" | "opus";
export type QualityPreset = "high" | "medium" | "low";

export interface AdvancedExportSettings {
  format: VideoFormat;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  quality: QualityPreset;
}

export const FORMAT_CODEC_MAP: Record<VideoFormat, { video: VideoCodec; audio: AudioCodec }> = {
  mp4: { video: "h264", audio: "aac" },
  webm: { video: "vp9", audio: "opus" },
};

export const QUALITY_CRF_MAP: Record<QualityPreset, Record<VideoCodec, number>> = {
  high:   { h264: 18, vp9: 25 },
  medium: { h264: 23, vp9: 32 },
  low:    { h264: 28, vp9: 40 },
};

export const CODEC_FFMPEG_MAP: Record<VideoCodec, string> = {
  h264: "libx264",
  vp9: "libvpx-vp9",
};

export const AUDIO_CODEC_FFMPEG_MAP: Record<AudioCodec, string> = {
  aac: "aac",
  opus: "libopus",
};
```

```typescript
// 수정: src/utils/exportUtils.ts — 포맷 인자를 설정 기반으로 생성
import type { AdvancedExportSettings } from "@/types/exportSettings";
import { CODEC_FFMPEG_MAP, AUDIO_CODEC_FFMPEG_MAP, QUALITY_CRF_MAP } from "@/types/exportSettings";

function getCodecArgs(settings: AdvancedExportSettings): string[] {
  const args: string[] = [];
  const crf = QUALITY_CRF_MAP[settings.quality][settings.videoCodec];

  args.push("-c:v", CODEC_FFMPEG_MAP[settings.videoCodec]);
  args.push("-crf", String(crf));

  if (settings.videoCodec === "h264") {
    args.push("-preset", settings.quality === "high" ? "slow" : "fast");
    args.push("-movflags", "+faststart");
  } else if (settings.videoCodec === "vp9") {
    args.push("-b:v", "0"); // CRF 모드
    args.push("-row-mt", "1"); // 멀티스레딩
  }

  args.push("-c:a", AUDIO_CODEC_FFMPEG_MAP[settings.audioCodec]);
  args.push(`output.${settings.format}`);

  return args;
}
```

**파일**: `src/types/exportSettings.ts` (신규), `src/utils/exportUtils.ts` (수정), `src/stores/useExportStore.ts` (수정), `src/components/export/ExportPanel.tsx` (수정 — 포맷 선택 UI)
**테스트**: `tests/utils/exportUtils.test.ts`, `tests/types/exportSettings.test.ts`

---

## Phase 3: 전문가 워크플로우 (P2)

### 3.1 멀티 클립 선택

**문제**: 단일 클립만 선택 가능. 여러 클립을 한 번에 이동/삭제/복사할 수 없음.

**구현**:

```typescript
// 수정: src/stores/useTimelineStore.ts
interface TimelineState {
  tracks: Track[];
  selectedClipIds: Set<string>; // string | null → Set<string>으로 변경

  selectClip: (clipId: string, additive?: boolean) => void;
  selectClips: (clipIds: string[]) => void;
  deselectAll: () => void;
  removeSelectedClips: () => void;
}

// actions:
selectClip: (clipId, additive = false) => set((state) => {
  if (additive) {
    const next = new Set(state.selectedClipIds);
    if (next.has(clipId)) {
      next.delete(clipId); // 토글
    } else {
      next.add(clipId);
    }
    return { selectedClipIds: next };
  }
  return { selectedClipIds: new Set([clipId]) };
}),

selectClips: (clipIds) => set({ selectedClipIds: new Set(clipIds) }),
deselectAll: () => set({ selectedClipIds: new Set() }),
```

```typescript
// 수정: src/hooks/useEditorKeyboard.ts — Shift+Click으로 추가 선택
// ClipBlock의 onClick 핸들러에서:
onClick={(e) => {
  onSelect(clip.id, e.shiftKey || e.metaKey); // additive 플래그
}}
```

**파일**: `src/stores/useTimelineStore.ts` (수정), 모든 클립 블록 컴포넌트 (수정), `src/hooks/useEditorKeyboard.ts` (수정)
**테스트**: `tests/stores/useTimelineStore.test.ts`

---

### 3.2 키프레임 애니메이션 시스템

**문제**: 필터/트랜스폼 값이 클립 레벨에서 고정. 시간에 따라 값을 변화시킬 수 없음.

**구현**:

```typescript
// 신규: src/types/keyframe.ts
export type EasingType = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface Keyframe<T = number> {
  id: string;
  time: number;        // 클립 내 상대 시간 (초)
  value: T;
  easing: EasingType;
}

export interface KeyframeTrack<T = number> {
  property: string;    // "filter.brightness", "transform.x", "opacity"
  keyframes: Keyframe<T>[];
}

// Clip 타입 확장
export interface ClipKeyframes {
  tracks: KeyframeTrack[];
}
```

```typescript
// 신규: src/utils/keyframeUtils.ts
import type { Keyframe, EasingType } from "@/types/keyframe";

// 이징 함수
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  "linear": (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => t * (2 - t),
  "ease-in-out": (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// 두 키프레임 사이 보간
export function interpolateKeyframes(
  keyframes: Keyframe[],
  time: number,
): number {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  // 정렬
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // 범위 밖
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // 인접 키프레임 찾기
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (time >= curr.time && time <= next.time) {
      const t = (time - curr.time) / (next.time - curr.time);
      const easedT = EASING_FUNCTIONS[curr.easing](t);
      return curr.value + (next.value - curr.value) * easedT;
    }
  }

  return sorted[sorted.length - 1].value;
}
```

```typescript
// 수정: src/types/timeline.ts — Clip에 keyframes 추가
export interface Clip {
  // ...기존 필드
  keyframes?: ClipKeyframes;  // 신규: 키프레임 애니메이션 데이터
}
```

```typescript
// 수정: src/hooks/usePreviewRenderer.ts — 키프레임 값 반영
// 렌더링 루프에서:
const localTime = visibleClip.localTime;
if (clip.keyframes) {
  for (const kfTrack of clip.keyframes.tracks) {
    const value = interpolateKeyframes(kfTrack.keyframes, localTime);

    if (kfTrack.property === "filter.brightness") {
      // 필터에 보간된 값 적용
    } else if (kfTrack.property === "transform.x") {
      // 트랜스폼에 보간된 값 적용
    }
    // ...
  }
}
```

**파일**: `src/types/keyframe.ts` (신규), `src/utils/keyframeUtils.ts` (신규), `src/types/timeline.ts` (수정), `src/hooks/usePreviewRenderer.ts` (수정)
**향후**: `src/components/inspector/KeyframeEditor.tsx` (키프레임 편집 UI — Phase 3 이후)
**테스트**: `tests/utils/keyframeUtils.test.ts`

---

### 3.3 고급 편집 모드 (리플/롤/슬립/슬라이드)

**문제**: 기본 이동만 가능. 클립 이동 시 인접 클립과의 관계를 유지하는 편집 모드 없음.

**구현**:

```typescript
// 신규: src/types/editMode.ts
export type EditMode = "normal" | "ripple" | "roll" | "slip" | "slide";

// normal: 자유 이동 (현재 동작)
// ripple: 클립 이동/삭제 시 뒤의 클립이 자동으로 당겨옴
// roll: 두 클립 경계를 동시에 조정 (총 길이 유지)
// slip: 클립 위치는 유지, 내부 in/outPoint만 변경
// slide: 클립 자체를 이동하되 인접 클립의 in/outPoint를 자동 조정
```

```typescript
// 신규: src/stores/useEditModeStore.ts
import { create } from "zustand";
import type { EditMode } from "@/types/editMode";

interface EditModeState {
  mode: EditMode;
  setMode: (mode: EditMode) => void;
}

export const useEditModeStore = create<EditModeState>((set) => ({
  mode: "normal",
  setMode: (mode) => set({ mode }),
}));
```

```typescript
// 수정: src/stores/useTimelineStore.ts — 리플 삭제 추가
rippleDelete: (trackId: string, clipId: string) => {
  set(produce((state: TimelineState) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const clipIndex = track.clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return;

    const removedClip = track.clips[clipIndex];
    const gap = removedClip.duration;

    // 클립 제거
    track.clips.splice(clipIndex, 1);

    // 뒤의 클립들을 gap만큼 앞으로 당김
    for (let i = clipIndex; i < track.clips.length; i++) {
      track.clips[i].startTime = Math.max(0, track.clips[i].startTime - gap);
    }
  }));
},

// 롤 편집: 두 클립 경계를 동시에 조정
rollEdit: (trackId: string, clipAId: string, clipBId: string, deltaTime: number) => {
  set(produce((state: TimelineState) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const clipA = track.clips.find((c) => c.id === clipAId);
    const clipB = track.clips.find((c) => c.id === clipBId);
    if (!clipA || !clipB) return;

    // A의 끝을 늘리고 B의 시작을 줄임 (총 길이 유지)
    const maxDelta = clipB.duration - MIN_CLIP_DURATION;
    const minDelta = -(clipA.duration - MIN_CLIP_DURATION);
    const clamped = Math.max(minDelta, Math.min(maxDelta, deltaTime));

    clipA.duration += clamped;
    clipA.outPoint += clamped;
    clipB.startTime += clamped;
    clipB.duration -= clamped;
    clipB.inPoint += clamped;
  }));
},

// 슬립 편집: 클립 in/outPoint만 이동
slipEdit: (trackId: string, clipId: string, deltaTime: number) => {
  set(produce((state: TimelineState) => {
    const track = state.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const asset = useMediaStore.getState().assets.find((a) => a.id === clip.assetId);
    const maxDuration = asset?.metadata && "duration" in asset.metadata
      ? asset.metadata.duration
      : clip.outPoint;

    const newInPoint = Math.max(0, clip.inPoint + deltaTime);
    const newOutPoint = newInPoint + clip.duration;

    if (newOutPoint <= maxDuration && newInPoint >= 0) {
      clip.inPoint = newInPoint;
      clip.outPoint = newOutPoint;
    }
  }));
},
```

**파일**: `src/types/editMode.ts` (신규), `src/stores/useEditModeStore.ts` (신규), `src/stores/useTimelineStore.ts` (수정), `src/hooks/useTimelineDragDrop.ts` (수정 — 모드에 따라 동작 분기)
**테스트**: `tests/stores/useTimelineStore.test.ts` (리플/롤/슬립 테스트)

---

### 3.4 컨텍스트 메뉴 (우클릭)

**문제**: 클립에 우클릭 메뉴 없음. 복사/붙여넣기/삭제/분할 등 빠른 접근 불가.

**구현**:

```typescript
// 신규: src/components/timeline/ClipContextMenu.tsx
import { useCallback, useEffect, useRef, useState } from "react";

interface ContextMenuProps {
  clipId: string;
  trackId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

export function ClipContextMenu({ clipId, trackId, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const items: MenuItem[] = [
    {
      label: "복사",
      shortcut: "Ctrl+C",
      action: () => {
        // useClipboardStore.copy(...)
        onClose();
      },
    },
    {
      label: "붙여넣기",
      shortcut: "Ctrl+V",
      action: () => { /* ... */ onClose(); },
      disabled: !useClipboardStore.getState().hasItems(),
    },
    { label: "", separator: true, action: () => {} },
    {
      label: "분할",
      shortcut: "Ctrl+S",
      action: () => {
        const currentTime = usePlaybackStore.getState().currentTime;
        useTimelineStore.getState().splitClip(trackId, clipId, currentTime);
        onClose();
      },
    },
    {
      label: "삭제",
      shortcut: "Delete",
      action: () => {
        useTimelineStore.getState().removeClip(trackId, clipId);
        onClose();
      },
    },
    {
      label: "리플 삭제",
      action: () => {
        useTimelineStore.getState().rippleDelete(trackId, clipId);
        onClose();
      },
    },
  ];

  // 외부 클릭 닫기 + Escape 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 rounded-md border border-gray-700 bg-gray-800 py-1 shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="my-1 border-t border-gray-700" />
        ) : (
          <button
            key={item.label}
            disabled={item.disabled}
            onClick={item.action}
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-700 disabled:text-gray-500"
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-gray-500">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}
```

**파일**: `src/components/timeline/ClipContextMenu.tsx` (신규), 클립 블록 컴포넌트들에 `onContextMenu` 핸들러 추가
**테스트**: `tests/components/timeline/ClipContextMenu.test.tsx`

---

## Phase 4: 성능 최적화 (P3)

### 4.1 타임라인 가상 스크롤

**문제**: 모든 트랙을 동시에 렌더링. 20+ 트랙에서 스크롤 성능 저하.

**구현**:

```typescript
// 수정: src/components/timeline/Timeline.tsx — 가상 스크롤 도입
import { useVirtualizer } from "@tanstack/react-virtual"; // 신규 의존성

// Timeline 컴포넌트 내:
const trackListRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: tracks.length,
  getScrollElement: () => trackListRef.current,
  estimateSize: () => TRACK_HEIGHT + 8, // 48px + gap
  overscan: 3, // 화면 밖 3개 트랙 추가 렌더링
});

// 렌더링:
<div
  ref={trackListRef}
  className="relative overflow-auto"
  style={{ height: `${timelineHeight}px` }}
>
  <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
    {virtualizer.getVirtualItems().map((virtualRow) => {
      const track = tracks[virtualRow.index];
      return (
        <div
          key={track.id}
          style={{
            position: "absolute",
            top: `${virtualRow.start}px`,
            height: `${virtualRow.size}px`,
            width: "100%",
          }}
        >
          <TrackRow track={track} zoom={zoom} ... />
        </div>
      );
    })}
  </div>
</div>
```

**의존성 추가**: `pnpm add @tanstack/react-virtual`
**파일**: `src/components/timeline/Timeline.tsx` (수정)
**테스트**: 성능 벤치마크 추가

---

### 4.2 프리뷰 렌더링 최적화

**문제**: `getVisibleClipsAtTime()`이 매 프레임 O(tracks × clips) 호출. 캐싱/인덱싱 없음.

**구현**:

```typescript
// 신규: src/utils/clipIndex.ts — 시간 기반 클립 인덱스
import type { Track, Clip } from "@/types/timeline";

interface ClipIndexEntry {
  clip: Clip;
  trackId: string;
  endTime: number;
}

// 정렬된 클립 인덱스 (startTime 기준)
export class ClipTimeIndex {
  private entries: ClipIndexEntry[] = [];
  private version = 0;

  rebuild(tracks: Track[]): void {
    this.entries = [];
    for (const track of tracks) {
      if (track.muted) continue;
      for (const clip of track.clips) {
        this.entries.push({
          clip,
          trackId: track.id,
          endTime: clip.startTime + clip.duration,
        });
      }
    }
    // startTime 기준 정렬
    this.entries.sort((a, b) => a.clip.startTime - b.clip.startTime);
    this.version++;
  }

  // 이진 탐색으로 O(log n + k) 시간 복잡도
  getVisibleAt(time: number): ClipIndexEntry[] {
    const result: ClipIndexEntry[] = [];

    // 이진 탐색: time 이전에 시작하는 마지막 인덱스 찾기
    let lo = 0;
    let hi = this.entries.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.entries[mid].clip.startTime <= time) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // hi+1이 첫 번째 '아직 시작 안 된' 클립
    // 0~hi까지 중 endTime > time인 것들이 현재 보이는 클립
    for (let i = 0; i <= hi && i < this.entries.length; i++) {
      if (this.entries[i].endTime > time) {
        result.push(this.entries[i]);
      }
    }

    return result;
  }
}
```

**파일**: `src/utils/clipIndex.ts` (신규), `src/hooks/usePreviewRenderer.ts` (수정 — ClipTimeIndex 사용)
**테스트**: `tests/utils/clipIndex.test.ts`

---

### 4.3 FFmpeg WASM 캐싱

**문제**: 매 내보내기마다 FFmpeg WASM (약 25MB)을 CDN에서 다운로드.

```typescript
// 현재: src/services/ffmpegService.ts
const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
await ffmpeg.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
});
```

**구현**:

```typescript
// 수정: src/services/ffmpegService.ts — Cache API로 WASM 캐싱
const CACHE_NAME = "webcut-ffmpeg-v1";
const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

async function getCachedBlobURL(url: string, mimeType: string): Promise<string> {
  const cache = await caches.open(CACHE_NAME);
  let response = await cache.match(url);

  if (!response) {
    response = await fetch(url);
    await cache.put(url, response.clone());
  }

  const blob = await response.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

export async function getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;

  ffmpeg = new FFmpeg();
  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => onProgress(Math.round(progress * 100)));
  }

  await ffmpeg.load({
    coreURL: await getCachedBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await getCachedBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}
```

**파일**: `src/services/ffmpegService.ts` (수정)
**테스트**: `tests/services/ffmpegService.test.ts`

---

## Phase 5: UX 향상 (P3)

### 5.1 프리뷰 전체 화면

**구현**:

```typescript
// 수정: src/components/preview/PreviewPanel.tsx
const containerRef = useRef<HTMLDivElement>(null);

const toggleFullscreen = useCallback(() => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    containerRef.current?.requestFullscreen();
  }
}, []);

// 렌더링에 추가:
<button
  onClick={toggleFullscreen}
  className="absolute top-2 right-2 rounded bg-gray-700/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
  title="전체 화면"
>
  <ExpandIcon className="h-4 w-4" />
</button>
```

### 5.2 프로젝트 스키마 버전 관리

```typescript
// 수정: src/utils/projectSerializer.ts
const CURRENT_VERSION = "2.0";

interface VersionMigration {
  from: string;
  to: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

const MIGRATIONS: VersionMigration[] = [
  {
    from: "1.0",
    to: "2.0",
    migrate: (data) => {
      // v1 → v2: selectedClipId → selectedClipIds (Set)
      const timeline = data.timeline as Record<string, unknown>;
      const tracks = timeline.tracks as Track[];
      for (const track of tracks) {
        for (const clip of track.clips) {
          if (!clip.keyframes) clip.keyframes = { tracks: [] };
        }
      }
      return { ...data, version: "2.0" };
    },
  },
];

function applyMigrations(data: Record<string, unknown>): Record<string, unknown> {
  let current = data;
  let version = current.version as string;

  for (const migration of MIGRATIONS) {
    if (version === migration.from) {
      current = migration.migrate(current);
      version = migration.to;
    }
  }

  return current;
}

export function deserializeProject(json: string): void {
  let data = JSON.parse(json);
  data = applyMigrations(data); // 자동 마이그레이션
  // ...기존 복원 로직
}
```

### 5.3 미디어 업로드 병렬화 + 진행률

```typescript
// 수정: src/hooks/useMediaUpload.ts
const uploadFiles = useCallback(async (files: File[]) => {
  const errors: UploadError[] = [];

  // 병렬 처리 (최대 3개 동시)
  const CONCURRENCY = 3;
  const queue = [...files];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
    workers.push(processQueue(queue, errors));
  }

  await Promise.all(workers);
  setErrors(errors);
}, [addAsset, updateAsset]);

async function processQueue(queue: File[], errors: UploadError[]): Promise<void> {
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) break;

    try {
      // 기존 단일 파일 처리 로직
      await processSingleFile(file);
    } catch (err) {
      errors.push({ fileName: file.name, message: String(err) });
      // 에러가 나도 다음 파일 계속 처리
    }
  }
}
```

---

## 구현 일정 요약

| Phase | 기간 | 핵심 기능 | 우선순위 |
|-------|------|----------|---------|
| **Phase 1** | 1~2주 | 에러 바운더리, 자동 저장, 내보내기 취소, Undo 라벨 | P0 |
| **Phase 2** | 2~3주 | 트림 핸들, 클립보드, 오디오 파형, 재생 속도, 포맷 옵션 | P1 |
| **Phase 3** | 3~4주 | 멀티 선택, 키프레임, 편집 모드, 컨텍스트 메뉴 | P2 |
| **Phase 4** | 1~2주 | 가상 스크롤, 프리뷰 최적화, WASM 캐싱 | P3 |
| **Phase 5** | 1주 | 전체 화면, 스키마 마이그레이션, 업로드 병렬화 | P3 |

---

## 신규 의존성

| 패키지 | 용도 | 크기 |
|--------|------|------|
| `immer` | 히스토리 구조적 공유 | ~6KB gzip |
| `@tanstack/react-virtual` | 타임라인 가상 스크롤 | ~3KB gzip |

---

## 신규 파일 목록

```
src/
├── components/
│   ├── timeline/
│   │   ├── ClipContextMenu.tsx          # 우클릭 메뉴
│   │   └── WaveformDisplay.tsx          # 오디오 파형
│   └── ui/
│       └── ErrorBoundary.tsx            # 에러 바운더리
├── hooks/
│   └── useAutoSave.ts                   # 자동 저장
├── services/
│   ├── autoSaveService.ts              # IndexedDB 저장
│   └── waveformService.ts              # 파형 데이터 생성
├── stores/
│   ├── useClipboardStore.ts            # 클립보드
│   └── useEditModeStore.ts             # 편집 모드
├── types/
│   ├── editMode.ts                     # 편집 모드 타입
│   ├── exportSettings.ts              # 내보내기 설정 타입
│   └── keyframe.ts                    # 키프레임 타입
└── utils/
    ├── clipIndex.ts                    # 시간 기반 인덱스
    └── keyframeUtils.ts               # 키프레임 보간
```

---

## 수정 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `src/app/App.tsx` | ErrorBoundary 래핑 |
| `src/services/ffmpegService.ts` | 취소 지원, WASM 캐싱 |
| `src/stores/useHistoryStore.ts` | 액션 라벨, Immer, MAX_HISTORY 확대 |
| `src/stores/usePlaybackStore.ts` | 속도, 루프, 루프 범위 |
| `src/stores/useExportStore.ts` | 단계별 진행률, 취소 |
| `src/stores/useTimelineStore.ts` | 멀티 선택, 리플/롤/슬립, 트림 |
| `src/hooks/usePlayback.ts` | 속도 적용, 루프 재생 |
| `src/hooks/useExport.ts` | 취소, 포맷 옵션, 단계별 진행률 |
| `src/hooks/useEditorKeyboard.ts` | Ctrl+C/V, 편집 모드 단축키 |
| `src/hooks/useMediaUpload.ts` | 병렬 처리 |
| `src/hooks/usePreviewRenderer.ts` | 키프레임 반영, ClipTimeIndex 사용 |
| `src/components/timeline/ClipBlock.tsx` | 트림 핸들, 컨텍스트 메뉴 |
| `src/components/timeline/AudioClipBlock.tsx` | 트림 핸들, 파형 표시 |
| `src/components/timeline/Timeline.tsx` | 가상 스크롤 |
| `src/components/timeline/PlaybackControls.tsx` | 속도/루프 UI |
| `src/components/export/ExportPanel.tsx` | 포맷 선택, 취소 버튼 |
| `src/components/preview/PreviewPanel.tsx` | 전체 화면 |
| `src/utils/projectSerializer.ts` | 스키마 버전, 마이그레이션 |
| `src/utils/exportUtils.ts` | 포맷별 코덱 인자 |
