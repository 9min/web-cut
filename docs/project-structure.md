# 프로젝트 구조 가이드

## 프로젝트 루트 구조

순수 클라이언트 앱으로, 별도의 백엔드 없이 브라우저에서 모든 처리를 수행한다.

```
web-cut/
├── .vscode/                    # VSCode 설정 (settings.json, extensions.json 등)
├── .github/                    # GitHub Actions 워크플로우
│   └── workflows/
├── src/
│   ├── app/                    # 앱 진입점
│   ├── components/             # 컴포넌트
│   │   ├── ui/                 # 기본 UI 컴포넌트 (shadcn/ui)
│   │   ├── layout/             # 레이아웃 컴포넌트 (Header, Sidebar 등)
│   │   ├── media-pool/         # 미디어 라이브러리 관련 컴포넌트
│   │   ├── timeline/           # 타임라인 관련 컴포넌트
│   │   ├── preview/            # 프리뷰 캔버스 관련 컴포넌트
│   │   ├── toolbar/            # 편집 도구 모음 컴포넌트
│   │   └── export/             # 내보내기 관련 컴포넌트
│   ├── hooks/                  # 커스텀 훅
│   ├── lib/                    # 외부 라이브러리 설정 (PixiJS, FFmpeg 등)
│   ├── stores/                 # Zustand 상태 관리
│   ├── types/                  # TypeScript 타입 정의
│   ├── utils/                  # 유틸리티 함수
│   ├── constants/              # 상수 정의
│   └── workers/                # Web Worker (FFmpeg 인코딩 등)
├── tests/                      # 테스트 파일
├── docs/                       # 프로젝트 문서
├── public/                     # 정적 파일
├── index.html
├── biome.json                  # Biome 설정
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js          # Tailwind CSS 설정
├── postcss.config.js           # PostCSS 설정
└── CLAUDE.md                   # Claude Code 규칙
```

## 주요 디렉토리 설명

### `src/lib/` — 외부 라이브러리 설정

PixiJS, FFmpeg.wasm 등 외부 라이브러리의 초기화 및 설정 파일을 포함한다.

```ts
// src/lib/pixi.ts — PixiJS 애플리케이션 설정
// src/lib/ffmpeg.ts — FFmpeg.wasm 초기화 및 래퍼
```

### `src/stores/` — Zustand 상태 관리

편집기의 핵심 상태를 관리하는 Zustand 스토어를 포함한다.

```
src/stores/
├── useProjectStore.ts          # 프로젝트 전역 설정 (해상도, fps 등)
├── useMediaStore.ts            # 미디어 라이브러리 상태
├── useTimelineStore.ts         # 타임라인, 트랙, 클립 상태
├── usePlaybackStore.ts         # 재생 상태 (현재 시간, 재생/정지)
└── useHistoryStore.ts          # Undo/Redo 히스토리
```

### `src/workers/` — Web Worker

무거운 연산을 메인 스레드에서 분리한다.

```
src/workers/
└── ffmpegWorker.ts             # FFmpeg.wasm 인코딩 처리
```

### `src/types/` — 타입 정의

```ts
// src/types/media.ts — 미디어 파일 관련 타입
// src/types/timeline.ts — 타임라인, 트랙, 클립 타입
// src/types/project.ts — 프로젝트 설정 타입
```

### `src/components/` — 기능별 컴포넌트 구조

편집기의 주요 영역별로 컴포넌트를 분리한다.

```
components/
├── ui/                 # shadcn/ui 기본 컴포넌트 (Button, Slider, Dialog 등)
├── layout/
│   └── EditorLayout.tsx        # 전체 편집기 레이아웃 (미디어풀 + 프리뷰 + 타임라인)
├── media-pool/
│   ├── MediaPool.tsx           # 미디어 라이브러리 컨테이너
│   ├── MediaItem.tsx           # 개별 미디어 아이템
│   └── MediaUploader.tsx       # 파일 업로드 영역
├── timeline/
│   ├── Timeline.tsx            # 타임라인 컨테이너
│   ├── Track.tsx               # 개별 트랙
│   ├── Clip.tsx                # 개별 클립
│   ├── Playhead.tsx            # 플레이헤드
│   └── TimeRuler.tsx           # 시간 눈금자
├── preview/
│   ├── PreviewCanvas.tsx       # PixiJS 프리뷰 캔버스
│   └── PreviewControls.tsx     # 재생/정지, 시간 표시
├── toolbar/
│   └── Toolbar.tsx             # 편집 도구 모음 (자르기, 트림 등)
└── export/
    ├── ExportDialog.tsx        # 내보내기 설정 다이얼로그
    └── ExportProgress.tsx      # 인코딩 진행률
```

## 경로 Alias 설정

`@/` 경로 alias를 설정하여 상대 경로 대신 절대 경로를 사용한다.

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### vite.config.ts

```ts
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

사용 예시:

```ts
// 좋은 예: alias 사용
import { useTimelineStore } from "@/stores/useTimelineStore";

// 나쁜 예: 상대 경로
import { useTimelineStore } from "../../../stores/useTimelineStore";
```

## 환경변수 파일 구조

| 파일 | 역할 | Git 추적 | 비고 |
|------|------|----------|------|
| `.env.example` | 환경변수 키 목록 (값 없음) | O | 팀원 온보딩용 |
| `.env.local` | 로컬 개발용 실제 값 | X | 각 개발자가 생성 |

Vite 프로젝트에서는 클라이언트에서 접근할 환경변수에 `VITE_` 접두사를 붙인다.

## 네이밍 컨벤션

### 파일/폴더 이름

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 파일 | `PascalCase.tsx` | `Timeline.tsx` |
| 훅 파일 | `camelCase.ts` | `usePlayback.ts` |
| 스토어 파일 | `camelCase.ts` | `useTimelineStore.ts` |
| 유틸리티 파일 | `camelCase.ts` | `formatTime.ts` |
| 타입 파일 | `camelCase.ts` | `timeline.ts` |
| 테스트 파일 | `*.test.ts(x)` | `Timeline.test.tsx` |
| 상수 파일 | `camelCase.ts` | `editorDefaults.ts` |
| Worker 파일 | `camelCase.ts` | `ffmpegWorker.ts` |

### 코드 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | `PascalCase` | `Timeline`, `PreviewCanvas` |
| 함수 | `camelCase` | `splitClip`, `formatTime` |
| 변수 | `camelCase` | `currentTime`, `isPlaying` |
| 상수 | `UPPER_SNAKE_CASE` | `DEFAULT_FPS`, `MAX_TRACKS` |
| 타입/인터페이스 | `PascalCase` | `Clip`, `Track`, `MediaAsset` |
| 커스텀 훅 | `use` 접두사 + `camelCase` | `usePlayback`, `useTimeline` |
| 이벤트 핸들러 | `handle` 접두사 | `handleSplit`, `handleTrim` |
| Boolean 변수 | `is`/`has`/`should` 접두사 | `isPlaying`, `hasUnsavedChanges` |

### 컴포넌트 구조

하나의 컴포넌트 파일은 다음 순서로 구성한다:

```tsx
// 1. import 문
import { useState } from "react";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip } from "@/types/timeline";

// 2. 타입 정의
interface ClipItemProps {
  clip: Clip;
  onSelect: (id: string) => void;
}

// 3. 컴포넌트 함수
export function ClipItem({ clip, onSelect }: ClipItemProps) {
  // 3-1. 훅
  const [isHovered, setIsHovered] = useState(false);

  // 3-2. 이벤트 핸들러
  const handleClick = () => {
    onSelect(clip.id);
  };

  // 3-3. 렌더링
  return <div onClick={handleClick}>{/* ... */}</div>;
}
```

## 관련 문서

- [디자인 가이드](design-guide.md)
- [린트 설정](lint-config.md)
- [보안 가이드](security-guide.md)
- [개발 환경 셋업](dev-environment.md)
- [상태 관리 전략](state-management.md)
