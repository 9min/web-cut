# 개발 환경 셋업 가이드

## 사전 요구사항

| 도구 | 최소 버전 | 비고 |
|------|----------|------|
| Node.js | >= 20 | LTS 권장 |
| npm | >= 10 | Node.js 20과 함께 설치됨 |
| Docker Desktop | 최신 | Supabase 로컬 실행용 |
| Supabase CLI | 최신 | `npm install -D supabase`로 설치 |

## Supabase 로컬 환경

### 초기화 및 실행

```bash
# 최초 1회: Supabase 프로젝트 초기화
npx supabase init

# 로컬 Supabase 서비스 시작 (Docker 필요)
npx supabase start
```

시작 후 로컬 서비스 URL:

| 서비스 | URL | 설명 |
|--------|-----|------|
| Studio | http://localhost:54323 | 데이터베이스 관리 UI |
| API | http://localhost:54321 | REST/GraphQL API |
| DB | localhost:54322 | PostgreSQL 직접 접속 |
| Inbucket | http://localhost:54324 | 로컬 이메일 테스트 |

### 중지/리셋

```bash
# 로컬 서비스 중지
npx supabase stop

# 데이터베이스 리셋 (마이그레이션 재적용 + 시드 데이터)
npx supabase db reset
```

## 환경변수 설정

### 파일 역할

| 파일 | 역할 | Git 추적 |
|------|------|----------|
| `.env.example` | 환경변수 키 목록 (값 없음). 팀원 온보딩용 | O |
| `.env.local` | 로컬 개발용 실제 값. 각 개발자가 생성 | X |
| `.env` | 빌드/배포 시 사용. CI/CD에서 주입 | X |

### .env.local 구성 예시

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...로컬_anon_key...
```

`npx supabase start` 실행 후 출력되는 `anon key`를 복사하여 사용한다.

### 환경별 관리

| 환경 | SUPABASE_URL | ANON_KEY | 관리 방식 |
|------|-------------|----------|----------|
| 로컬 | localhost:54321 | 로컬 키 | `.env.local` |
| Preview | Supabase 프로젝트 URL | 프로젝트 키 | Vercel 환경변수 |
| Production | Supabase 프로젝트 URL | 프로젝트 키 | Vercel 환경변수 |

## IDE 설정

### VSCode 필수 확장

| 확장 | ID | 용도 |
|------|----|------|
| Biome | `biomejs.biome` | 린트/포매팅 |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Tailwind 자동완성 |
| ES7+ React Snippets | `dsznajder.es7-react-js-snippets` | React 스니펫 |

### .vscode/settings.json 예제

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

### .vscode/extensions.json 예제

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

### 디버깅 설정 (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Vite 디버깅",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## 로컬 개발 실행

### 실행 순서

```bash
# 1. Supabase 로컬 서비스 시작
npx supabase start

# 2. .env.local 파일 확인 (없으면 .env.example 복사 후 값 입력)
cp .env.example .env.local

# 3. 개발 서버 실행
npm run dev
```

### package.json scripts 예제

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome check --write .",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:start": "npx supabase start",
    "db:stop": "npx supabase stop",
    "db:reset": "npx supabase db reset",
    "db:types": "npx supabase gen types typescript --local > src/types/database.ts"
  }
}
```

## Supabase 타입 생성

### 명령어

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

### 타입 생성 시점

- 마이그레이션 파일 추가/변경 후
- `npx supabase db reset` 실행 후
- 테이블 구조가 변경된 경우

### package.json 스크립트 등록

```json
{
  "scripts": {
    "db:types": "npx supabase gen types typescript --local > src/types/database.ts"
  }
}
```

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `supabase start` 실패 | Docker Desktop 미실행 | Docker Desktop 실행 후 재시도 |
| 포트 충돌 (54321 등) | 다른 프로세스가 포트 사용 중 | `supabase stop` 후 재시작, 또는 충돌 프로세스 종료 |
| 타입 생성 실패 | 로컬 Supabase 미실행 | `supabase start` 먼저 실행 |
| `.env.local` 미인식 | Vite 환경변수 접두사 누락 | `VITE_` 접두사 확인 |
| 마이그레이션 충돌 | 원격과 로컬 마이그레이션 불일치 | `supabase db reset`으로 로컬 초기화 |
| `supabase start` 느림 | Docker 이미지 최초 다운로드 | 최초 실행 시 정상. 이후 빠름 |

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [린트 설정](lint-config.md)
- [CI/CD 가이드](cicd-guide.md)
