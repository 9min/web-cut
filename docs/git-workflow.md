# Git 워크플로우

## 브랜치 전략 (GitHub Flow)

### 메인 브랜치

- `main` 또는 `master`: 프로덕션 브랜치. 항상 배포 가능한 상태를 유지한다.
- 프로젝트마다 메인 브랜치 이름이 다를 수 있으므로, 작업 시작 전 `git branch` 또는 `git remote show origin`으로 반드시 확인한다.

### 작업 브랜치 네이밍

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feature/` | 새로운 기능 개발 | `feature/user-login` |
| `fix/` | 버그 수정 | `fix/token-expiry-redirect` |
| `hotfix/` | 프로덕션 긴급 수정 | `hotfix/critical-auth-error` |
| `refactor/` | 리팩토링 | `refactor/api-client-structure` |
| `docs/` | 문서 작업 | `docs/api-documentation` |
| `chore/` | 설정, 의존성 등 | `chore/update-dependencies` |

### 브랜치 네이밍 규칙

- 소문자와 하이픈(`-`)만 사용한다.
- 간결하되 작업 내용을 명확히 표현한다.
- 이슈 번호가 있는 경우 포함한다: `feature/123-user-login`

## PR 프로세스

### 1. 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b feature/기능명
```

### 2. 작업 및 커밋

- [커밋 컨벤션](commit-convention.md)을 따른다.
- 논리적 단위별로 커밋을 분리한다. (예: UI 구현, API 연동, 테스트 각각 별도 커밋)
- 하나의 커밋이 하나의 목적을 갖도록 한다.
- WIP(작업 중) 커밋은 PR 전에 rebase로 정리한다.

### 3. PR 생성

- PR 제목은 작업 내용을 간결하게 요약한다.
- PR 본문에 다음을 포함한다:
  - 변경 사항 요약
  - 테스트 방법
  - 관련 이슈 번호 (있는 경우)
  - 스크린샷 (UI 변경 시)

### 4. 코드 리뷰

- 최소 1명 이상의 승인을 받는다.
- [코드 리뷰 체크리스트](code-review-checklist.md)를 참고한다.
- 리뷰 코멘트에 대해 모두 응답한다.

### 5. 머지

- Squash and Merge를 기본으로 사용한다.
- 머지 후 작업 브랜치를 삭제한다.

## 브랜치 보호 규칙

CI가 실패하면 PR 머지를 차단한다. 아래 설정을 반드시 적용한다.

### GitHub 설정 경로

`GitHub → Repository Settings → Branches → Add branch protection rule`

- **Branch name pattern**: `main` 또는 `master` (프로젝트의 기본 브랜치명에 맞게 설정)

### 적용 규칙

| 규칙 | 설정 |
|------|------|
| Require a pull request before merging | ✅ 활성화 |
| Required approvals | 1명 이상 |
| Dismiss stale reviews when new commits are pushed | ✅ 활성화 |
| Require status checks to pass before merging | ✅ 활성화 |
| Require branches to be up to date before merging | ✅ 활성화 |
| Do not allow bypassing the above settings | ✅ 활성화 (관리자도 예외 없음) |

### 필수 상태 체크 등록 방법

> **주의**: 상태 체크 이름은 GitHub Actions workflow 이름과 job 이름을 `/`로 구분한 형식이다.
> 예: workflow 이름이 `CI`, job 이름이 `린트 검사`이면 → `CI / 린트 검사`

#### 등록 절차

1. `Require status checks to pass before merging`을 체크한다.
2. `Require branches to be up to date before merging`을 체크한다.
3. 검색창에 아래 항목을 **정확히** 입력하여 추가한다.

| 검색어 | 설명 |
|--------|------|
| `CI / 린트 검사` | Biome 린트/포매팅 검사 |
| `CI / 타입 검사` | TypeScript 타입 검사 |
| `CI / 테스트` | Vitest 단위·통합 테스트 |
| `CI / 빌드` | 빌드 성공 확인 |
| `CI / E2E 테스트` | Playwright E2E 테스트 |

> 검색창에 항목이 표시되지 않으면 GitHub Actions CI가 해당 브랜치에서 최소 1회 실행된 후 다시 시도한다.

#### workflow 이름 확인 방법

`cicd-guide.md`의 워크플로우 파일에서 `name:` 필드가 workflow 이름이다:

```yaml
name: CI  # ← 이 값이 상태 체크 이름의 앞부분
jobs:
  lint:
    name: 린트 검사  # ← 이 값이 상태 체크 이름의 뒷부분
    # 최종 상태 체크 이름: "CI / 린트 검사"
```

### 설정 완료 후 동작

- CI 체크 실패 시 PR 머지 버튼이 비활성화된다.
- "Some checks were not successful" 메시지와 함께 실패한 Job 목록이 표시된다.
- 모든 필수 체크가 통과해야만 머지 버튼이 활성화된다.
- `Do not allow bypassing` 옵션 활성화 시 Repository Admin도 CI를 우회하여 머지할 수 없다.

### 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 검색창에 상태 체크가 표시 안 됨 | CI가 1회도 실행된 적 없음 | PR을 하나 열어 CI를 먼저 실행한다 |
| CI 실패해도 머지 가능 | 필수 체크로 등록 안 됨 | 위 절차대로 Job 이름을 정확히 등록한다 |
| 이름이 달라서 매칭 안 됨 | workflow `name:` 또는 job `name:` 변경됨 | GitHub Actions 실행 후 실제 이름을 확인하여 재등록한다 |

CI 워크플로우 설정은 [CI/CD 가이드](cicd-guide.md)를 참조한다.

## 관련 문서

- [커밋 컨벤션](commit-convention.md)
- [코드 리뷰 체크리스트](code-review-checklist.md)
- [CI/CD 가이드](cicd-guide.md)
