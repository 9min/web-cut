# CLAUDE.md - WebCut 프로젝트 규칙

## 프로젝트 개요
브라우저에서 동작하는 웹 기반 동영상 편집기. 비전문가가 설치 없이 영상 컷 편집, 트랜지션, 필터, 텍스트 오버레이, 내보내기를 수행할 수 있다.

## 기술 스택

- **프론트엔드**: Vite + React + TypeScript
- **상태 관리**: Zustand
- **렌더링 엔진**: PixiJS (Canvas/WebGL 프리뷰)
- **인코딩**: FFmpeg.wasm
- **UI 컴포넌트**: shadcn/ui (Radix + Tailwind)
- **CSS**: Tailwind CSS
- **드래그 앤 드롭**: dnd-kit
- **린트/포매팅**: Biome
- **테스트**: Vitest
- **배포**: Vercel
- **백엔드**: 없음 (순수 클라이언트 앱)
- **버전 관리**: Git (GitHub Flow)

## 핵심 규칙

### 언어

- 코드 내 주석, 커밋 메시지, PR 설명 등 모든 문서는 **한국어**로 작성한다.

### 코드 스타일

- Biome 설정을 따른다. (`biome.json` 참조)
- TypeScript strict 모드를 사용한다.
- `any` 타입 사용을 금지한다. 불가피한 경우 `unknown`을 사용하고 타입 가드를 적용한다.
- 함수형 컴포넌트와 훅을 사용한다. 클래스 컴포넌트는 사용하지 않는다.
- 네이밍 컨벤션:
  - 컴포넌트: `PascalCase`
  - 함수/변수: `camelCase`
  - 상수: `UPPER_SNAKE_CASE`
  - 타입/인터페이스: `PascalCase`
  - 파일명: 컴포넌트는 `PascalCase.tsx`, 그 외는 `camelCase.ts`

### 커밋 및 푸시

- **작업 완료 후 커밋/푸시는 직접 요청받았을 때만 진행한다.** 명시적 요청 없이 자동으로 커밋하거나 푸시하지 않는다.

### 브랜치 전략

- GitHub Flow 기반: `main`(또는 `master`) → `feature/*`, `fix/*`, `hotfix/*`
- **`main` 또는 `master` 브랜치에 직접 커밋하거나 푸시하는 것은 절대 금지한다.** 어떤 상황에서도 예외 없이 반드시 feature 브랜치를 생성한 후 PR을 통해 머지한다.
- 작업 시작 전 현재 브랜치를 반드시 확인한다. `main` 또는 `master` 브랜치에 있다면 즉시 작업 브랜치로 전환한다.
- `git push --force` 및 프로덕션 브랜치(`main`, `master`)로의 직접 푸시는 사용하지 않는다.

### 커밋 컨벤션

- Gitmoji + Conventional Commits 형식
- 예: `✨ feat: 사용자 로그인 기능 추가`
- 예: `🐛 fix: 토큰 만료 시 리다이렉트 오류 수정`

### 테스트 (TDD)

- **TDD(Test-Driven Development) 방식으로 개발한다.** 테스트 코드를 먼저 작성한 후 구현 코드를 작성한다.
- TDD 사이클: Red(실패하는 테스트 작성) → Green(테스트를 통과하는 최소 구현) → Refactor(코드 개선)
- 새로운 기능에는 반드시 테스트 코드를 포함한다.
- Vitest를 사용하며, 테스트 파일은 `*.test.ts` 또는 `*.test.tsx` 형식을 따른다.

### 보안

- **기능 개발 시 보안 검토를 필수로 수행한다.** 구현 완료 후 보안 체크리스트를 점검한다.
- 모든 미디어 파일은 클라이언트 측에서만 처리하며, 외부 서버로 전송하지 않는다.
- 사용자 입력(텍스트 오버레이 등)은 반드시 검증하고 새니타이즈한다 (XSS 방지).
- OWASP Top 10을 준수한다.
- 보안 관련 상세 체크리스트는 [security-guide.md](docs/security-guide.md)를 참조한다.

### 에러 처리

- 프론트엔드: Error Boundary + try-catch 패턴

### 프로젝트 고유 규칙

- 모든 미디어 처리는 브라우저 내에서 수행한다 (서버 통신 없음).
- 대용량 미디어 파일은 `URL.createObjectURL()`로 참조하여 메모리 부하를 최소화한다.
- FFmpeg.wasm 인코딩은 메인 스레드에서 처리하되, `ffmpeg.on("progress")` 콜백으로 UI 업데이트를 유지한다. (Web Worker 분리는 향후 개선 과제)
- 타임라인 상태는 Zustand 스토어에서 중앙 관리한다.
- PixiJS 렌더링 루프는 `requestAnimationFrame` 기반으로 구현한다.
- COOP/COEP 헤더 설정이 필요하다 (FFmpeg.wasm의 SharedArrayBuffer 지원).

## 상세 문서 참조

각 항목에 대한 상세 내용은 아래 문서를 참조한다.

| 문서 | 설명 |
|------|------|
| [docs/prd.md](docs/prd.md) | 제품 요구사항 문서 (PRD) |
| [docs/git-workflow.md](docs/git-workflow.md) | Git 워크플로우 및 브랜치 전략 |
| [docs/commit-convention.md](docs/commit-convention.md) | 커밋 메시지 컨벤션 |
| [docs/project-structure.md](docs/project-structure.md) | 프로젝트 폴더 구조 가이드 |
| [docs/lint-config.md](docs/lint-config.md) | Biome 린트/포매팅 설정 |
| [docs/design-guide.md](docs/design-guide.md) | 디자인 가이드 (UI 컨벤션 + 디자인 시스템) |
| [docs/testing-guide.md](docs/testing-guide.md) | 테스트 코드 가이드 |
| [docs/security-guide.md](docs/security-guide.md) | 보안 가이드 |
| [docs/cicd-guide.md](docs/cicd-guide.md) | CI/CD 설정 가이드 |
| [docs/code-review-checklist.md](docs/code-review-checklist.md) | 코드 리뷰 체크리스트 |
| [docs/error-handling.md](docs/error-handling.md) | 에러 핸들링 가이드 |
| [docs/dev-environment.md](docs/dev-environment.md) | 개발 환경 셋업 가이드 |
| [docs/state-management.md](docs/state-management.md) | 상태 관리 전략 |
| [docs/performance-guide.md](docs/performance-guide.md) | 성능 최적화 가이드 |
| [docs/data-modeling.md](docs/data-modeling.md) | 데이터 모델링 가이드 |
| [docs/maintainability-guide.md](docs/maintainability-guide.md) | 유지보수 가이드 (아키텍처·설계 원칙) |
