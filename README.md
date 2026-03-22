# WebCut

브라우저에서 동작하는 웹 기반 동영상 편집기

[![CI](https://github.com/9min/web-cut/actions/workflows/ci.yml/badge.svg)](https://github.com/9min/web-cut/actions/workflows/ci.yml)

## 소개

WebCut은 **설치 없이, 서버 없이, 브라우저에서 완결**되는 동영상 편집기입니다.
모든 미디어 처리가 클라이언트에서 이루어지므로 파일이 외부 서버로 전송되지 않습니다.

- **대상 사용자**: 비전문가, 숏폼 콘텐츠 제작자
- **핵심 가치**: 접근성 — 누구나 브라우저만 있으면 영상을 편집할 수 있습니다

## 주요 기능

- 미디어 업로드 및 라이브러리 관리
- 멀티트랙 타임라인 편집 (드래그 앤 드롭)
- 실시간 프리뷰 (PixiJS WebGL 렌더링)
- 클립 분할 / 트림 / 복사 / 붙여넣기
- 트랜지션 & 필터
- 텍스트 오버레이
- 오디오 트랙 & 볼륨 조절
- MP4 / WebM 내보내기 (FFmpeg.wasm)
- Undo / Redo
- 프로젝트 자동저장 (IndexedDB)
- 키보드 단축키

## 기술 스택

| 카테고리 | 기술 |
|----------|------|
| 프레임워크 | React 19, TypeScript 5 |
| 빌드 도구 | Vite 8 |
| 상태 관리 | Zustand 5, Immer |
| 렌더링 엔진 | PixiJS 8 (Canvas/WebGL) |
| 인코딩 | FFmpeg.wasm 0.12 |
| UI 컴포넌트 | shadcn/ui (Radix + Tailwind) |
| CSS | Tailwind CSS 4 |
| 드래그 앤 드롭 | dnd-kit |
| 가상화 | TanStack Virtual |
| 린트/포매팅 | Biome |
| 테스트 | Vitest, Testing Library |
| 배포 | Vercel |

## 시작하기

### 필수 요구사항

- Node.js >= 20 (LTS 권장)
- pnpm

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

### 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm test` | 테스트 실행 (watch 모드) |
| `pnpm test:run` | 테스트 1회 실행 |
| `pnpm test:coverage` | 커버리지 포함 테스트 |
| `pnpm lint` | 린트 검사 및 자동 수정 |
| `pnpm lint:check` | 린트 검사 (수정 없이) |

## 프로젝트 구조

```
web-cut/
├── src/
│   ├── app/                # 앱 진입점
│   ├── components/
│   │   ├── ui/             # 기본 UI 컴포넌트 (shadcn/ui)
│   │   ├── layout/         # 레이아웃 (EditorLayout)
│   │   ├── media-pool/     # 미디어 라이브러리
│   │   ├── timeline/       # 타임라인
│   │   ├── preview/        # PixiJS 프리뷰 패널
│   │   ├── inspector/      # 인스펙터 패널
│   │   └── export/         # 내보내기
│   ├── hooks/              # 커스텀 훅
│   ├── services/           # 서비스 레이어 (FFmpeg 등)
│   ├── stores/             # Zustand 스토어
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   └── constants/          # 상수
├── tests/                  # 테스트 파일
├── docs/                   # 프로젝트 문서
└── public/                 # 정적 파일
```

## 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Space` | 재생 / 일시정지 |
| `S` | 클립 분할 |
| `Delete` / `Backspace` | 선택 클립 삭제 |
| `Ctrl/⌘ + Z` | 실행 취소 |
| `Ctrl/⌘ + Shift + Z` | 다시 실행 |
| `Ctrl/⌘ + C` | 클립 복사 |
| `Ctrl/⌘ + V` | 클립 붙여넣기 |
| `Ctrl/⌘ + A` | 전체 선택 |
| `←` / `→` | 프레임 단위 이동 |
| `Home` | 타임라인 시작으로 이동 |
| `End` | 타임라인 끝으로 이동 |

## 문서

| 문서 | 설명 |
|------|------|
| [PRD](docs/prd.md) | 제품 요구사항 문서 |
| [프로젝트 구조](docs/project-structure.md) | 폴더 구조 가이드 |
| [상태 관리](docs/state-management.md) | 상태 관리 전략 |
| [데이터 모델링](docs/data-modeling.md) | 데이터 모델링 가이드 |
| [디자인 가이드](docs/design-guide.md) | UI 컨벤션 + 디자인 시스템 |
| [테스트 가이드](docs/testing-guide.md) | 테스트 코드 가이드 |
| [보안 가이드](docs/security-guide.md) | 보안 가이드 |
| [성능 최적화](docs/performance-guide.md) | 성능 최적화 가이드 |
| [에러 핸들링](docs/error-handling.md) | 에러 핸들링 가이드 |
| [Git 워크플로우](docs/git-workflow.md) | 브랜치 전략 |
| [커밋 컨벤션](docs/commit-convention.md) | 커밋 메시지 규칙 |
| [린트 설정](docs/lint-config.md) | Biome 설정 |
| [CI/CD](docs/cicd-guide.md) | CI/CD 설정 가이드 |
| [코드 리뷰](docs/code-review-checklist.md) | 코드 리뷰 체크리스트 |
| [개발 환경](docs/dev-environment.md) | 개발 환경 셋업 |
| [유지보수](docs/maintainability-guide.md) | 아키텍처 · 설계 원칙 |

## 브라우저 지원

| 브라우저 | 지원 |
|----------|------|
| Chrome | 권장 |
| Edge | 지원 |
| Firefox | 지원 |
| Safari | 부분 지원 |

> **참고**: FFmpeg.wasm은 `SharedArrayBuffer`를 사용하므로 COOP/COEP 헤더 설정이 필요합니다.
> 개발 서버(Vite)에서는 자동으로 설정되며, 프로덕션 배포 시 서버에서 아래 헤더를 설정해야 합니다:
>
> ```
> Cross-Origin-Opener-Policy: same-origin
> Cross-Origin-Embedder-Policy: require-corp
> ```

## 라이센스

라이센스 미지정 (추후 결정 예정)
