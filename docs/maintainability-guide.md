# 유지보수 가이드

> **범위**: 이 문서는 코드를 **어떻게 설계할지**를 다룬다.
> 파일을 **어디에 놓을지**는 [project-structure.md](project-structure.md)를 참조한다.

---

## 1. 레이어드 아키텍처

프로젝트는 다음 4개 레이어로 구성한다.

```
Presentation  →  src/components/, src/pages/
Application   →  src/hooks/, src/stores/
Domain        →  src/types/, src/utils/
Infrastructure→  src/services/, src/lib/
```

### 의존성 방향 규칙

- 의존성은 **위에서 아래로만** 흐른다. (Presentation → Infrastructure)
- Infrastructure가 Presentation을 import하면 안 된다.
- 같은 레이어 내 순환 import도 금지한다.

```ts
// ✅ 올바른 방향: Presentation → Infrastructure
// src/components/feature/TodoList.tsx
import { useTodoList } from "@/hooks/useTodoList"; // Application 레이어

// ✅ 올바른 방향: Application → Infrastructure
// src/hooks/useTodoList.ts
import { getTodos, createTodo } from "@/services/todoService"; // Infrastructure 레이어

// ❌ 잘못된 방향: Infrastructure → Presentation
// src/services/todoService.ts
import { TodoList } from "@/components/feature/TodoList"; // 금지
```

---

## 2. 컴포넌트 설계 원칙

### 단일 책임 원칙 (SRP)

컴포넌트 하나는 한 가지 역할만 담당한다.

```tsx
// ❌ 하나의 컴포넌트가 목록 조회 + 항목 렌더링 + 폼 모두 담당
function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => { /* 데이터 조회 로직 */ }, []);
  const handleSubmit = () => { /* 생성 로직 */ };

  return (
    <div>
      <form onSubmit={handleSubmit}>{/* 폼 UI */}</form>
      <ul>{todos.map(todo => <li key={todo.id}>{/* 항목 UI */}</li>)}</ul>
    </div>
  );
}

// ✅ 역할별로 분리
function TodoPage() {
  return (
    <div>
      <TodoForm />
      <TodoList />
    </div>
  );
}
```

### 컴포넌트 분리 기준

다음 조건 중 하나라도 해당하면 컴포넌트 분리를 검토한다.

| 조건 | 기준 |
|------|------|
| JSX 반환부 길이 | 50줄 초과 |
| props 수 | 5개 초과 |
| 조건부 렌더링 | 서로 다른 UI를 조건에 따라 렌더링 |
| 반복 렌더링 | `.map()`으로 항목을 렌더링하는 블록 |
| 독립적인 상태 | 분리해도 부모 상태에 영향 없는 로컬 상태 |

---

## 3. 커스텀 훅으로 비즈니스 로직 분리

컴포넌트에서 비즈니스 로직을 제거하고 커스텀 훅에 캡슐화한다.

### 훅이 담아야 할 것

- 서비스 함수 호출 (`services/`)
- 서버 상태 관리 (`isLoading`, `error`, `data`)
- 파생 상태 계산
- 사이드이펙트 (`useEffect`)

### 훅이 담지 말아야 할 것

- JSX 렌더링 로직
- 스타일 관련 코드
- 컴포넌트 레이아웃 결정

### 예시

```ts
// src/hooks/useTodoList.ts
import { useState, useEffect } from "react";
import { getTodos, createTodo, deleteTodo } from "@/services/todoService";
import type { Todo, CreateTodoInput } from "@/types/todo";

export function useTodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getTodos()
      .then(setTodos)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (input: CreateTodoInput) => {
    const newTodo = await createTodo(input);
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return { todos, isLoading, error, handleCreate, handleDelete };
}
```

```tsx
// src/components/feature/TodoList.tsx
import { useTodoList } from "@/hooks/useTodoList";

export function TodoList() {
  const { todos, isLoading, error, handleDelete } = useTodoList();

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p>오류가 발생했습니다.</p>;

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onDelete={handleDelete} />
      ))}
    </ul>
  );
}
```

---

## 4. 기능(Feature) 단위 모듈화

기능이 커지면 관련 코드를 feature 폴더로 응집시켜 관리한다.

### 적용 시점

- 하나의 기능에 컴포넌트, 훅, 타입이 3개 이상 생겼을 때
- 기능 간 코드가 뒤섞여 변경 영향 범위를 파악하기 어려울 때

### feature 폴더 구조 예시

```
src/
├── components/
│   ├── ui/                     # 범용 UI 컴포넌트
│   └── feature/
│       ├── todo/               # Todo 기능 모듈
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   └── TodoForm.tsx
│       └── auth/               # Auth 기능 모듈
│           ├── LoginForm.tsx
│           └── SignupForm.tsx
├── hooks/
│   ├── useTodoList.ts
│   └── useAuth.ts
└── types/
    ├── todo.ts
    └── auth.ts
```

---

## 5. 코드 복잡도 기준

### 함수 길이

- **30줄 이하**를 권장한다.
- 초과 시 세부 로직을 별도 함수로 추출한다.

### 중첩 depth

- **3단계 이하**를 유지한다.
- 초과 시 early return 또는 함수 추출을 사용한다.

```ts
// ❌ 중첩이 깊은 코드
function processOrder(order: Order) {
  if (order) {
    if (order.items.length > 0) {
      for (const item of order.items) {
        if (item.inStock) {
          // 처리 로직 (depth 4)
        }
      }
    }
  }
}

// ✅ early return으로 평탄화
function processOrder(order: Order) {
  if (!order) return;
  if (order.items.length === 0) return;

  for (const item of order.items) {
    if (!item.inStock) continue;
    processItem(item); // 세부 로직은 함수로 추출
  }
}
```

### Prop Drilling 방지

- props가 **2단계를 초과**하여 전달된다면 Context 또는 컴포지션 패턴을 사용한다.

```tsx
// ❌ Prop Drilling: A → B → C → D로 userId 전달
function PageA() {
  const { userId } = useAuth();
  return <ComponentB userId={userId} />;
}

// ✅ Context 사용
const UserContext = createContext<string | null>(null);

function PageA() {
  const { userId } = useAuth();
  return (
    <UserContext.Provider value={userId}>
      <ComponentB />
    </UserContext.Provider>
  );
}

function ComponentD() {
  const userId = useContext(UserContext); // 필요한 곳에서 직접 소비
}
```

---

## 6. 기술 부채 관리

### TODO / FIXME 주석 규칙

임시 코드나 개선이 필요한 부분은 다음 형식으로 기록한다.

```ts
// TODO: [담당자] #이슈번호 - 개선 내용
// TODO: @김철수 #123 - 페이지네이션 적용 필요

// FIXME: [담당자] #이슈번호 - 버그 내용
// FIXME: @이영희 #456 - 삭제 후 목록이 갱신되지 않는 문제
```

- 담당자와 이슈 번호를 반드시 포함한다.
- 이슈 없이 작성된 `TODO`/`FIXME`는 코드 리뷰에서 반려한다.

### 리팩토링 시점 판단 기준

| 상황 | 조치 |
|------|------|
| 같은 코드 블록을 3번 이상 복사했다 | 공통 함수 또는 훅으로 추상화 |
| 함수 이름을 이해하는 데 5분 이상 걸린다 | 이름 개선 또는 주석 보강 |
| 변경 하나가 3개 이상의 파일을 건드린다 | 책임 분리 재검토 |
| 테스트 작성이 어렵다 | 의존성이 강하게 결합된 신호 — 인터페이스 분리 검토 |

---

## 관련 문서

- [프로젝트 폴더 구조](project-structure.md) — 파일을 어디에 놓을지
- [상태 관리 전략](state-management.md) — stores/ 사용 기준
- [테스트 가이드](testing-guide.md) — 설계와 테스트 가능성의 관계
- [코드 리뷰 체크리스트](code-review-checklist.md) — 리뷰 시 유지보수성 항목
