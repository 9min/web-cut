# 테스트 코드 가이드

## 개발 방법론: TDD (Test-Driven Development)

본 프로젝트는 **TDD 방식**으로 개발한다. 모든 기능 개발 시 아래 사이클을 따른다.

### TDD 사이클

1. **Red**: 실패하는 테스트를 먼저 작성한다.
2. **Green**: 테스트를 통과하는 **최소한의** 구현 코드를 작성한다.
3. **Refactor**: 테스트가 통과하는 상태를 유지하면서 코드를 개선한다.

### TDD 개발 흐름

```
1. 요구사항 분석
2. 테스트 케이스 설계 (정상 케이스 + 엣지 케이스)
3. 테스트 코드 작성 (Red - 컴파일/실행 실패 확인)
4. 최소 구현 (Green - 테스트 통과 확인)
5. 리팩토링 (Refactor - 테스트 통과 유지)
6. 2~5 반복
```

### TDD 실천 예시

```ts
// 1단계: Red - 실패하는 테스트 작성
import { describe, it, expect } from "vitest";
import { formatDuration } from "@/utils/formatDuration";

describe("formatDuration", () => {
  it("초를 mm:ss 형식으로 변환한다", () => {
    expect(formatDuration(90)).toBe("01:30");
  });

  it("0초는 00:00을 반환한다", () => {
    expect(formatDuration(0)).toBe("00:00");
  });
});

// 2단계: Green - 테스트를 통과하는 최소 구현
// src/utils/formatDuration.ts
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 3단계: Refactor - 필요 시 코드 개선 (테스트 통과 유지)
```

### TDD 적용 범위

| 대상 | TDD 적용 | 비고 |
|------|---------|------|
| 유틸리티 함수 | 필수 | 순수 함수이므로 TDD에 가장 적합 |
| 서비스 함수 | 필수 | 비즈니스 로직의 핵심 |
| 커스텀 훅 | 필수 | 상태 로직 검증 |
| 컴포넌트 | 권장 | 사용자 인터랙션 중심으로 테스트 |
| E2E 시나리오 | 선택 | 핵심 플로우에 한해 적용 |

### TDD 주의사항

- 한 번에 하나의 테스트만 추가한다. 여러 테스트를 동시에 작성하지 않는다.
- Green 단계에서는 테스트를 통과하는 **가장 단순한 코드**를 작성한다. 과도한 설계를 하지 않는다.
- Refactor 단계에서 새로운 기능을 추가하지 않는다. 기능 추가는 새 테스트부터 시작한다.
- 테스트가 실패하는 상태에서 다른 기능 개발로 넘어가지 않는다.

### TDD + 보안 검토 통합 프로세스

기능 개발 시 TDD 사이클과 보안 검토를 아래 순서로 통합하여 진행한다.

```
1. 요구사항 분석
2. 테스트 케이스 설계 (기능 + 보안 테스트 포함)
3. TDD 사이클 (Red → Green → Refactor)
4. 보안 검토 (아래 체크리스트 점검)
5. 코드 리뷰
```

#### 기능 개발 시 보안 검토 체크리스트

기능 구현을 완료할 때마다 아래 항목을 점검한다.

- [ ] **입력 검증**: 사용자 입력(텍스트 오버레이 등)에 대해 검증 및 새니타이제이션을 적용했는가?
- [ ] **XSS 방지**: `dangerouslySetInnerHTML`을 사용하지 않았는가? 불가피한 경우 새니타이즈했는가?
- [ ] **파일 검증**: 미디어 파일 업로드 시 MIME 타입과 파일 크기를 검증했는가?
- [ ] **메모리 관리**: `URL.createObjectURL()`로 생성한 URL은 사용 후 `URL.revokeObjectURL()`로 해제했는가?
- [ ] **시크릿 노출**: 코드에 API 키, 민감 정보 등이 하드코딩되지 않았는가?
- [ ] **에러 노출**: 에러 메시지에 내부 구현 세부사항이 노출되지 않는가?

#### 보안 테스트 작성 예시

```ts
describe("textSanitizer 보안", () => {
  it("HTML 태그가 포함된 입력을 새니타이즈한다", () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const result = sanitizeText(maliciousInput);
    expect(result).not.toContain("<script>");
  });

  it("허용된 최대 길이를 초과하면 잘라낸다", () => {
    const longInput = "가".repeat(1001);
    expect(sanitizeText(longInput).length).toBeLessThanOrEqual(1000);
  });
});
```

## 테스트 도구

- **테스트 프레임워크**: Vitest
- **컴포넌트 테스트**: @testing-library/react
- **E2E 테스트**: Playwright (필요 시)

## 테스트 파일 위치 및 네이밍

### 파일 위치

테스트 파일은 `tests/` 디렉토리에 소스 구조를 미러링하여 배치한다.

```
프로젝트-루트/
├── src/
│   ├── components/timeline/Timeline.tsx
│   ├── hooks/usePlayback.ts
│   └── services/ffmpegService.ts
├── tests/
│   ├── components/timeline/Timeline.test.tsx
│   ├── hooks/usePlayback.test.ts
│   ├── services/ffmpegService.test.ts (필요 시)
│   ├── stores/          # Zustand 스토어 테스트
│   ├── utils/           # 유틸리티 함수 테스트
│   └── factories/       # 테스트 데이터 팩토리
└── e2e/
    └── editor.e2e.spec.ts
```

### 파일 네이밍

- 단위/통합 테스트: `*.test.ts` 또는 `*.test.tsx`
- 분야별 특화 테스트: `*.audio.test.ts`, `*.snap.test.ts` 등 접미사로 구분
- E2E 테스트: `*.e2e.spec.ts` (Playwright 관례)

## 테스트 종류 및 범위

### 단위 테스트 (Unit Test)

- **대상**: 유틸리티 함수, 커스텀 훅, 서비스 함수, 순수 함수
- **목표**: 개별 함수/모듈의 입출력 검증
- **비율**: 전체 테스트의 약 70%

```ts
import { describe, it, expect } from "vitest";
import { formatDuration } from "@/utils/formatDuration";

describe("formatDuration", () => {
  it("90초를 01:30으로 변환한다", () => {
    expect(formatDuration(90)).toBe("01:30");
  });

  it("유효하지 않은 값에 대해 00:00을 반환한다", () => {
    expect(formatDuration(0)).toBe("00:00");
  });
});
```

### 통합 테스트 (Integration Test)

- **대상**: 컴포넌트, 여러 모듈의 연동, Zustand 스토어
- **목표**: 모듈 간 상호작용 검증
- **비율**: 전체 테스트의 약 20%

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaybackControls } from "@/components/timeline/PlaybackControls";

describe("PlaybackControls", () => {
  it("재생 버튼 클릭 시 재생 상태로 전환된다", async () => {
    render(<PlaybackControls />);
    await userEvent.click(screen.getByRole("button", { name: /재생/i }));
    expect(screen.getByRole("button", { name: /정지/i })).toBeInTheDocument();
  });
});
```

### E2E 테스트 (End-to-End Test)

- **대상**: 핵심 사용자 시나리오 (파일 업로드, 타임라인 편집, 내보내기 등)
- **목표**: 전체 시스템의 동작 검증
- **비율**: 전체 테스트의 약 10%
- **도구**: Playwright (`@playwright/test`)

#### Playwright 설치

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

#### playwright.config.ts 설정

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "pnpm build && pnpm preview",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

## 테스트 커버리지

### 목표

| 항목 | 최소 목표 |
|------|----------|
| 전체 커버리지 | 70% |
| 비즈니스 로직 (services) | 90% |
| 유틸리티 함수 (utils) | 90% |
| 컴포넌트 | 60% |
| Zustand 스토어 | 80% |

### 커버리지 실행

```bash
pnpm test:coverage
```

## 테스트 작성 규칙

### describe/it 네이밍

- `describe`: 테스트 대상을 명시한다.
- `it`: 기대 동작을 한국어로 서술한다.

```ts
describe("useTimelineStore", () => {
  describe("splitClip", () => {
    it("지정한 시간에서 클립을 두 개로 분할한다", () => {});
    it("클립 범위 밖의 시간이면 분할하지 않는다", () => {});
  });
});
```

### AAA 패턴

모든 테스트는 Arrange-Act-Assert 패턴을 따른다.

```ts
it("클립을 타임라인에 추가한다", () => {
  // Arrange: 테스트 데이터 및 환경 설정
  const store = useTimelineStore.getState();
  const clip = createTestClip({ startTime: 0, duration: 5 });

  // Act: 테스트 대상 실행
  store.addClip("track-1", clip);

  // Assert: 결과 검증
  expect(store.tracks[0].clips).toHaveLength(1);
});
```

### 테스트 격리

- 각 테스트는 독립적으로 실행 가능해야 한다.
- 테스트 간 상태를 공유하지 않는다.
- `beforeEach`에서 Zustand 스토어를 초기화한다.

```ts
beforeEach(() => {
  useTimelineStore.setState(initialState);
});
```

## 모킹 전략

### 외부 의존성 모킹

FFmpeg, PixiJS, Web API(IndexedDB, File API 등) 같은 외부 의존성은 모킹한다.

```ts
import { vi } from "vitest";

// FFmpeg 서비스 모킹
vi.mock("@/services/ffmpegService", () => ({
  ffmpegService: {
    load: vi.fn().mockResolvedValue(undefined),
    encode: vi.fn().mockResolvedValue(new Uint8Array()),
  },
}));
```

### IndexedDB 모킹 (fake-indexeddb)

자동 저장 기능 테스트 시 `fake-indexeddb`를 사용한다.

```ts
import "fake-indexeddb/auto";

it("프로젝트 상태를 IndexedDB에 저장한다", async () => {
  await autoSaveService.save(projectState);
  const loaded = await autoSaveService.load();
  expect(loaded).toEqual(projectState);
});
```

### 모킹 최소화 원칙

- 외부 시스템 (FFmpeg, PixiJS, File API, IndexedDB)만 모킹한다.
- 내부 모듈의 모킹은 최소화한다.
- 모킹이 과도하면 테스트 대상의 설계를 재검토한다.

### 타이머 모킹

```ts
import { vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("디바운스 후 스냅샷을 저장한다", () => {
  // ...
  vi.advanceTimersByTime(500);
  // ...
});
```

## 테스트 데이터 팩토리

`tests/factories/` 디렉토리에 팩토리 함수를 작성한다.

```ts
// tests/factories/mediaFactory.ts
import type { MediaAsset } from "@/types/media";

export function createTestMediaAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: crypto.randomUUID(),
    name: "test-video.mp4",
    originalName: "test-video.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 1024 * 1024,
    objectUrl: "blob:test-url",
    thumbnailUrl: null,
    metadata: { width: 1920, height: 1080, duration: 10, fps: 30 },
    status: "ready",
    addedAt: Date.now(),
    ...overrides,
  };
}
```

```ts
// tests/factories/timelineFactory.ts
import type { Clip, Track } from "@/types/timeline";

export function createTestClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: crypto.randomUUID(),
    trackId: "track-1",
    assetId: "asset-1",
    name: "test-clip",
    startTime: 0,
    duration: 5,
    inPoint: 0,
    outPoint: 5,
    ...overrides,
  };
}
```

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [CI/CD 가이드](cicd-guide.md)
- [데이터 모델링 가이드](data-modeling.md)
