# CI/CD 설정 가이드

## Vercel 자동 배포

### 기본 설정

- `main` 브랜치 푸시 시 프로덕션 자동 배포
- PR 생성 시 Preview 배포 자동 생성
- Preview URL은 PR 코멘트에 자동 첨부

### 배포 환경 구분

| 환경 | 트리거 | URL 패턴 |
|------|--------|---------|
| Production | `main` 머지 | `project.vercel.app` |
| Preview | PR 생성/업데이트 | `project-{hash}.vercel.app` |
| Development | 로컬 | `localhost:5173` |

### Preview 배포 활용

- PR 리뷰 시 Preview URL로 실제 동작을 확인한다.
- QA 팀과 Preview URL을 공유하여 사전 검증한다.
- Preview 배포에는 테스트용 환경변수를 사용한다.

## 환경변수 관리

### Vercel 환경변수 설정

각 환경변수에 적용 범위를 지정한다:

| 스코프 | 용도 |
|--------|------|
| Production | 프로덕션 환경에만 적용 |
| Preview | Preview 배포에만 적용 |
| Development | `vercel dev` 실행 시 적용 |

### 민감 정보 관리

- 시크릿은 Vercel 대시보드에서 직접 설정한다.
- `vercel env pull`로 로컬에 동기화할 수 있다.
- `.env*.local` 파일은 `.gitignore`에 포함한다.

## GitHub Actions 연동

### 기본 워크플로우

PR 생성 및 업데이트 시 다음을 자동 실행한다:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint:
    name: 린트 검사
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx biome check .

  type-check:
    name: 타입 검사
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    name: 테스트
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx vitest run --coverage

  build:
    name: 빌드
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run build

  e2e:
    name: E2E 테스트
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 워크플로우 구성

| Job | 설명 | 필수 |
|-----|------|------|
| `lint` | Biome 린트/포매팅 검사 | O |
| `type-check` | TypeScript 타입 검사 | O |
| `test` | Vitest 테스트 실행 | O |
| `build` | 빌드 성공 확인 | O |
| `e2e` | Playwright E2E 테스트 실행 | O |

### 브랜치 보호 규칙과 연동

CI 실패 시 PR 머지를 차단하려면 GitHub Branch Protection Rules 설정이 필수다.

`GitHub → Repository Settings → Branches → Add branch protection rule`에서 `main` 또는 `master` 브랜치에 다음을 설정한다.

**1. "Require status checks to pass before merging" 활성화**

검색창에 아래 항목을 **정확히** 입력하여 필수 상태 체크로 추가한다.

> 상태 체크 이름 형식: `{workflow name} / {job name}`
> 이 워크플로우의 `name: CI`이므로 앞에 `CI / `가 붙는다.

| 검색어 (정확히 입력) | 설명 |
|---------------------|------|
| `CI / 린트 검사` | Biome 린트/포매팅 검사 |
| `CI / 타입 검사` | TypeScript 타입 검사 |
| `CI / 테스트` | Vitest 단위·통합 테스트 |
| `CI / 빌드` | 빌드 성공 확인 |
| `CI / E2E 테스트` | Playwright E2E 테스트 |

**2. "Require branches to be up to date before merging" 활성화**

머지 전 `main` 브랜치 최신 상태 동기화를 강제한다.

**3. "Do not allow bypassing the above settings" 활성화**

Repository Admin도 CI를 우회하여 머지할 수 없도록 설정한다.

> 상태 체크 항목은 GitHub Actions CI가 최소 1회 실행된 후 검색창에 표시된다.
> workflow `name:` 또는 job `name:` 값을 변경하면 보호 규칙에 재등록해야 한다.

모든 필수 체크가 통과해야만 PR 머지 버튼이 활성화된다. 상세 설정 방법은 [Git 워크플로우](git-workflow.md)를 참조한다.

## Supabase 배포

### 로컬 개발 환경

```bash
# Supabase CLI로 로컬 환경 실행
npx supabase start

# 로컬 환경 중지
npx supabase stop

# DB 리셋 (마이그레이션 재적용)
npx supabase db reset

# 타입 재생성
npx supabase gen types typescript --local > src/types/database.ts
```

### 마이그레이션 배포

Supabase 프로젝트에 마이그레이션을 적용하는 방법:

```bash
# Supabase 프로젝트 연결
npx supabase link --project-ref <project-id>

# 원격에 마이그레이션 적용
npx supabase db push
```

### Edge Functions 배포

```bash
# 특정 함수 배포
npx supabase functions deploy <function-name>

# 모든 함수 배포
npx supabase functions deploy
```

### 환경 분리

| 환경 | Supabase 프로젝트 | 프론트엔드 |
|------|------------------|----------|
| 로컬 | `supabase start` (로컬 Docker) | `localhost:5173` |
| Preview | Staging 프로젝트 | Vercel Preview |
| Production | Production 프로젝트 | Vercel Production |

프로덕션과 스테이징 Supabase 프로젝트를 별도로 운영하여 데이터를 격리한다.

## 배포 체크리스트

### 프로덕션 배포 전 확인 사항

- [ ] 모든 CI 체크 통과
- [ ] PR 리뷰 승인 완료
- [ ] Preview 배포에서 기능 검증 완료
- [ ] Vercel 환경변수 설정 확인 (SUPABASE_URL, ANON_KEY)
- [ ] Supabase 마이그레이션 적용 여부 확인 (`supabase db push`)
- [ ] RLS 정책이 모든 테이블에 적용되었는지 확인
- [ ] Edge Functions 배포 여부 확인 (변경된 경우)
- [ ] 타입 파일(`database.ts`) 최신 상태 확인
- [ ] E2E 테스트 통과 확인
- [ ] 롤백 계획 수립

## 관련 문서

- [Git 워크플로우](git-workflow.md)
- [테스트 가이드](testing-guide.md)
- [린트 설정](lint-config.md)
- [보안 가이드](security-guide.md)
