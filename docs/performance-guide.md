# 성능 최적화 가이드

> WebCut은 미디어 처리 앱으로 렌더링 성능, 메모리 관리, 대용량 파일 처리가 핵심 성능 요소다.

## React 렌더링 최적화

### React.memo 사용 기준

부모 리렌더링 시 props가 변경되지 않는 **무거운** 자식 컴포넌트에만 적용한다.

```tsx
// 좋은 예: 타임라인에서 반복 렌더링되는 무거운 컴포넌트
const ClipBlock = React.memo(function ClipBlock({ clip }: ClipBlockProps) {
  return <div>{/* 복잡한 렌더링 */}</div>;
});

// 나쁜 예: 단순한 컴포넌트에 불필요하게 적용
const Label = React.memo(function Label({ text }: { text: string }) {
  return <span>{text}</span>;
});
```

### useMemo/useCallback 사용 기준

**기본적으로 사용하지 않고, 성능 문제가 확인된 후 적용한다.**

```tsx
// 좋은 예: 비용이 큰 계산 (클립 레이아웃 계산 등)
const visibleClips = useMemo(
  () => clips.filter((clip) => clip.startTime < viewportEnd),
  [clips, viewportEnd]
);

// 좋은 예: React.memo된 자식에 전달하는 콜백
const handleClipSelect = useCallback(
  (id: string) => selectClip(id),
  [selectClip]
);

// 나쁜 예: 단순한 값에 불필요하게 적용
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
```

### 리렌더링 디버깅

React DevTools Profiler를 사용하여 불필요한 리렌더링을 확인한다.

1. React DevTools > Profiler 탭 열기
2. "Highlight updates when components render" 활성화
3. 인터랙션 수행 후 렌더링 결과 분석

## 타임라인 가상화

타임라인의 클립이 많아질 경우 `@tanstack/react-virtual`을 활용하여 보이는 영역의 클립만 렌더링한다.

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function TrackRow({ clips }: TrackRowProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: clips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 클립의 예상 너비
    horizontal: true,
  });

  return (
    <div ref={parentRef} style={{ overflow: "auto" }}>
      <div style={{ width: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <ClipBlock key={item.key} clip={clips[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

## 미디어 파일 최적화

### ObjectURL 관리

`URL.createObjectURL()`로 생성한 URL은 반드시 사용 후 해제하여 메모리 누수를 방지한다.

```ts
// 좋은 예: 컴포넌트 언마운트 시 해제
useEffect(() => {
  const url = URL.createObjectURL(file);
  setObjectUrl(url);

  return () => {
    URL.revokeObjectURL(url);
  };
}, [file]);
```

### 썸네일 생성 최적화

비디오 썸네일은 저해상도로 생성하여 메모리를 절약한다.

```ts
async function generateThumbnail(videoUrl: string): Promise<string> {
  const video = document.createElement("video");
  video.src = videoUrl;

  const canvas = document.createElement("canvas");
  canvas.width = 160;  // 저해상도
  canvas.height = 90;

  // ... 프레임 캡처
  return canvas.toDataURL("image/jpeg", 0.7); // 압축률 적용
}
```

## PixiJS 렌더링 최적화

### requestAnimationFrame 기반 렌더링 루프

```ts
// src/hooks/usePreviewRenderer.ts
useEffect(() => {
  let animationId: number;

  const render = () => {
    // 현재 시간에 해당하는 클립 렌더링
    renderFrame(currentTime);
    animationId = requestAnimationFrame(render);
  };

  if (isPlaying) {
    animationId = requestAnimationFrame(render);
  }

  return () => {
    cancelAnimationFrame(animationId);
  };
}, [isPlaying, currentTime]);
```

### 텍스처 재사용

같은 미디어 에셋의 텍스처는 캐싱하여 재사용한다.

```ts
const textureCache = new Map<string, PIXI.Texture>();

function getTexture(assetId: string): PIXI.Texture {
  if (!textureCache.has(assetId)) {
    const texture = PIXI.Texture.from(objectUrl);
    textureCache.set(assetId, texture);
  }
  return textureCache.get(assetId)!;
}
```

## FFmpeg.wasm 최적화

### 인코딩은 별도 처리 (메인 스레드 블로킹 방지)

FFmpeg.wasm 인코딩 중 UI가 멈추지 않도록 진행률을 표시하며 비동기로 처리한다.

```ts
ffmpeg.on("progress", ({ progress }) => {
  setExportProgress(Math.round(progress * 100));
});

await ffmpeg.exec(["-i", "input.mp4", "output.mp4"]);
```

> Web Worker 기반 처리는 향후 개선 과제다. 현재는 메인 스레드에서 실행되지만, `ffmpeg.on("progress")` 콜백으로 UI 업데이트는 정상 동작한다.

## 번들 크기 관리

### 코드 스플리팅

무거운 라이브러리(FFmpeg.wasm, PixiJS)는 지연 로딩을 고려한다.

```tsx
import { lazy, Suspense } from "react";

const ExportPanel = lazy(() => import("@/components/export/ExportPanel"));

function App() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ExportPanel />
    </Suspense>
  );
}
```

### 트리 셰이킹

named import를 사용하여 필요한 것만 가져온다.

```ts
// 좋은 예: named import
import { Container, Sprite } from "pixi.js";

// 나쁜 예: 전체 import
import * as PIXI from "pixi.js";
```

### 번들 분석

`rollup-plugin-visualizer`로 번들 구성을 확인한다.

```ts
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true }),
  ],
});
```

## Core Web Vitals 기준

### 목표

| 지표 | 목표 | 설명 |
|------|------|------|
| LCP (Largest Contentful Paint) | < 2.5초 | 가장 큰 콘텐츠 렌더링 시간 |
| INP (Interaction to Next Paint) | < 200ms | 사용자 인터랙션 응답 시간 |
| CLS (Cumulative Layout Shift) | < 0.1 | 레이아웃 이동 정도 |

### 측정 도구

- **Lighthouse**: Chrome DevTools > Lighthouse 탭
- **web-vitals 라이브러리**: 실제 사용자 데이터 수집

```ts
import { onLCP, onINP, onCLS } from "web-vitals";

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

## 관련 문서

- [상태 관리 전략](state-management.md)
- [디자인 가이드](design-guide.md)
- [데이터 모델링 가이드](data-modeling.md)
