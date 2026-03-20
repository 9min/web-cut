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
import { validateEmail } from "@/utils/validateEmail";

describe("validateEmail", () => {
  it("올바른 이메일 형식이면 true를 반환한다", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("@가 없으면 false를 반환한다", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("빈 문자열이면 false를 반환한다", () => {
    expect(validateEmail("")).toBe(false);
  });
});

// 2단계: Green - 테스트를 통과하는 최소 구현
// src/utils/validateEmail.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

- [ ] **입력 검증**: 사용자 입력에 대해 zod 등으로 스키마 검증을 적용했는가?
- [ ] **인젝션 방지**: Supabase Client 메서드를 사용하고, 직접 SQL 문자열 결합을 하지 않았는가?
- [ ] **XSS 방지**: `dangerouslySetInnerHTML`을 사용하지 않았는가? 불가피한 경우 새니타이즈했는가?
- [ ] **인증/인가**: 보호가 필요한 데이터/페이지에 인증 확인이 적용되었는가?
- [ ] **RLS 정책**: 새로 추가한 테이블에 RLS가 활성화되고 적절한 정책이 설정되었는가?
- [ ] **시크릿 노출**: 코드에 API 키, 비밀번호 등이 하드코딩되지 않았는가?
- [ ] **에러 노출**: 에러 메시지에 내부 구현 세부사항(스택 트레이스, DB 스키마 등)이 노출되지 않는가?
- [ ] **권한 경계**: 다른 사용자의 데이터에 접근할 수 없는가? (수평적 권한 상승 방지)

#### 보안 테스트 작성 예시

```ts
describe("TodoService 보안", () => {
  it("다른 사용자의 할 일을 수정할 수 없다", async () => {
    mockAuthenticated({ id: "user-1" });
    const otherUserTodo = createTestTodo({ user_id: "user-2" });

    await expect(
      updateTodo(otherUserTodo.id, { title: "변경 시도" })
    ).rejects.toThrow();
  });

  it("제목이 200자를 초과하면 생성에 실패한다", async () => {
    const longTitle = "가".repeat(201);
    await expect(createTodo({ title: longTitle })).rejects.toThrow();
  });

  it("HTML 태그가 포함된 입력을 안전하게 처리한다", () => {
    const maliciousInput = '<script>alert("xss")</script>';
    render(<TodoItem title={maliciousInput} />);
    expect(screen.queryByText(maliciousInput)).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
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
│   ├── components/LoginForm.tsx
│   ├── hooks/useAuth.ts
│   └── services/authService.ts
├── tests/
│   ├── components/LoginForm.test.tsx
│   ├── hooks/useAuth.test.ts
│   └── services/authService.test.ts
└── e2e/
    └── auth.e2e.spec.ts
```

### 파일 네이밍

- 단위/통합 테스트: `*.test.ts` 또는 `*.test.tsx`
- E2E 테스트: `*.e2e.spec.ts` (Playwright 관례, Vitest `*.test.ts` 패턴과 명확히 구분)

## 테스트 종류 및 범위

### 단위 테스트 (Unit Test)

- **대상**: 유틸리티 함수, 커스텀 훅, 서비스 함수, 순수 함수
- **목표**: 개별 함수/모듈의 입출력 검증
- **비율**: 전체 테스트의 약 70%

```ts
import { describe, it, expect } from "vitest";
import { formatDate } from "@/utils/formatDate";

describe("formatDate", () => {
  it("Date 객체를 YYYY-MM-DD 형식으로 변환한다", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("2024-01-15");
  });

  it("유효하지 않은 날짜에 대해 빈 문자열을 반환한다", () => {
    expect(formatDate(new Date("invalid"))).toBe("");
  });
});
```

### 통합 테스트 (Integration Test)

- **대상**: 컴포넌트, API 엔드포인트, 여러 모듈의 연동
- **목표**: 모듈 간 상호작용 검증
- **비율**: 전체 테스트의 약 20%

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";

describe("LoginForm", () => {
  it("유효한 입력으로 폼을 제출하면 onSubmit이 호출된다", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} isLoading={false} />);

    await userEvent.type(screen.getByLabelText("이메일"), "test@example.com");
    await userEvent.type(screen.getByLabelText("비밀번호"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(handleSubmit).toHaveBeenCalledWith("test@example.com", "password123");
  });
});
```

### E2E 테스트 (End-to-End Test)

- **대상**: 핵심 사용자 시나리오 (로그인, 결제 등)
- **목표**: 전체 시스템의 동작 검증
- **비율**: 전체 테스트의 약 10%
- **도구**: Playwright (`@playwright/test`)

#### Playwright 설치

```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### playwright.config.ts 설정

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "npm run build && npx vite preview",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

> `reuseExistingServer: !process.env.CI` 설정으로 로컬에서는 기존 서버를 재사용하고, CI에서는 항상 새로 빌드한다.

#### E2E 테스트 예시 (`e2e/auth.e2e.spec.ts`)

```ts
import { test, expect } from "@playwright/test";

test.describe("인증 플로우", () => {
  test("로그인 후 대시보드로 이동한다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("이메일").fill("test@example.com");
    await page.getByLabel("비밀번호").fill("password123");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("잘못된 비밀번호로 오류 메시지가 표시된다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("이메일").fill("test@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
```

#### 로컬 실행 명령어

```bash
# 헤드리스 실행
npx playwright test

# UI 모드 (디버깅 시 유용)
npx playwright test --ui

# 특정 파일만 실행
npx playwright test e2e/auth.e2e.spec.ts
```

## 테스트 커버리지

### 목표

| 항목 | 최소 목표 |
|------|----------|
| 전체 커버리지 | 70% |
| 비즈니스 로직 (services) | 90% |
| 유틸리티 함수 (utils) | 90% |
| 컴포넌트 | 60% |
| API 라우트 | 80% |

### 커버리지 실행

```bash
npx vitest run --coverage
```

## 테스트 작성 규칙

### describe/it 네이밍

- `describe`: 테스트 대상을 명시한다.
- `it`: 기대 동작을 한국어로 서술한다.

```ts
describe("AuthService", () => {
  describe("login", () => {
    it("올바른 자격 증명으로 토큰을 반환한다", () => {});
    it("잘못된 비밀번호로 에러를 던진다", () => {});
    it("존재하지 않는 사용자로 에러를 던진다", () => {});
  });
});
```

### AAA 패턴

모든 테스트는 Arrange-Act-Assert 패턴을 따른다.

```ts
it("사용자 이름을 업데이트한다", async () => {
  // Arrange: 테스트 데이터 및 환경 설정
  const user = createTestUser({ name: "기존이름" });

  // Act: 테스트 대상 실행
  const result = await updateUserName(user.id, "새이름");

  // Assert: 결과 검증
  expect(result.name).toBe("새이름");
});
```

### 테스트 격리

- 각 테스트는 독립적으로 실행 가능해야 한다.
- 테스트 간 상태를 공유하지 않는다.
- `beforeEach`에서 상태를 초기화한다.

## 모킹 전략

### 외부 의존성 모킹

API 호출, 데이터베이스 등 외부 의존성은 모킹한다.

```ts
import { vi } from "vitest";
import { fetchUser } from "@/services/userService";

vi.mock("@/services/userService");

const mockedFetchUser = vi.mocked(fetchUser);

it("사용자 정보를 정상적으로 표시한다", async () => {
  mockedFetchUser.mockResolvedValue({ id: "1", name: "홍길동" });
  // ...
});
```

### 모킹 최소화 원칙

- 외부 시스템 (API, DB, 파일 시스템)만 모킹한다.
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

it("5초 후에 자동으로 알림을 닫는다", () => {
  // ...
  vi.advanceTimersByTime(5000);
  // ...
});
```

## Supabase 모킹 전략

### supabase-js 클라이언트 모킹

Supabase 클라이언트의 체이닝 메서드를 모킹한다.

```ts
import { vi } from "vitest";

// supabase 클라이언트 모킹
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));
```

### 모킹 헬퍼 패턴

재사용 가능한 모킹 헬퍼를 `tests/helpers/supabaseMock.ts`에 작성한다.

```ts
// tests/helpers/supabaseMock.ts
import { vi } from "vitest";
import { supabase } from "@/lib/supabase";

export function mockSupabaseSelect<T>(table: string, data: T[], error: null | { message: string } = null) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] ?? null, error }),
    then: vi.fn((resolve) => resolve({ data, error })),
  };

  // select 이후 체이닝 지원
  Object.assign(mockChain.select, mockChain);

  vi.mocked(supabase.from).mockReturnValue(mockChain as never);
  return mockChain;
}
```

사용 예시:

```ts
import { mockSupabaseSelect } from "../helpers/supabaseMock";

it("할 일 목록을 조회한다", async () => {
  const mockTodos = [{ id: "1", title: "테스트", is_completed: false }];
  mockSupabaseSelect("todos", mockTodos);

  const result = await getTodos();
  expect(result).toEqual(mockTodos);
});
```

### 인증 상태 모킹

```ts
import { vi } from "vitest";
import { supabase } from "@/lib/supabase";

// 인증된 상태
function mockAuthenticated(user = { id: "user-1", email: "test@example.com" }) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user, access_token: "token", refresh_token: "refresh" } as never },
    error: null,
  });
}

// 미인증 상태
function mockUnauthenticated() {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null,
  });
}
```

### 테스트 데이터 팩토리

`tests/factories/` 디렉토리에 팩토리 함수를 작성한다.

```ts
// tests/factories/todoFactory.ts
import type { Todo } from "@/types/todo";

export function createTestTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: crypto.randomUUID(),
    user_id: "test-user-id",
    title: "테스트 할 일",
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestTodos(count: number, overrides: Partial<Todo> = {}): Todo[] {
  return Array.from({ length: count }, (_, i) =>
    createTestTodo({ title: `테스트 할 일 ${i + 1}`, ...overrides })
  );
}
```

### Supabase 에러 시뮬레이션

```ts
it("Supabase 에러 시 예외를 던진다", async () => {
  const mockError = { message: "테이블을 찾을 수 없습니다", code: "42P01" };

  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
  } as never);

  await expect(getTodos()).rejects.toThrow();
});
```

### RLS 정책 테스트

Supabase 로컬 환경에서 실제 RLS 정책을 테스트한다.

```ts
// tests/rls/todos.rls.test.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://localhost:54321";
const SERVICE_ROLE_KEY = "서비스_롤_키"; // supabase start 출력값

// 특정 사용자로 인증된 클라이언트 생성
function createAuthenticatedClient(userId: string) {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${generateJwt(userId)}`,
      },
    },
  });
}

describe("todos RLS 정책", () => {
  it("본인의 할 일만 조회할 수 있다", async () => {
    const client = createAuthenticatedClient("user-1");
    const { data } = await client.from("todos").select("*");

    for (const todo of data ?? []) {
      expect(todo.user_id).toBe("user-1");
    }
  });
});
```

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [CI/CD 가이드](cicd-guide.md)
- [데이터 모델링 가이드](data-modeling.md)
