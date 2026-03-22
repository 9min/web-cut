# 개발 환경 셋업 가이드

## 사전 요구사항

| 도구 | 최소 버전 | 비고 |
|------|----------|------|
| Node.js | >= 20 | LTS 권장 |
| pnpm | >= 10 | 패키지 매니저 |

pnpm이 없으면 아래 명령어로 설치한다:

```bash
npm install -g pnpm
```

## 프로젝트 설치 및 실행

### 최초 설치

```bash
# 의존성 설치
pnpm install

# pre-commit hook 설치 (lefthook)
pnpm lefthook install
```

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:5173`으로 접속한다.

> **참고**: FFmpeg.wasm 동작을 위해 COOP/COEP 헤더가 필요하다. `vite.config.ts`에 설정되어 있으며, 개발 서버 실행 시 자동 적용된다.

## 환경변수 설정

WebCut은 순수 클라이언트 앱으로 현재 필수 환경변수가 없다. 필요 시 `.env.example`을 복사하여 `.env.local`을 생성한다.

```bash
cp .env.example .env.local
```

Vite 프로젝트에서는 클라이언트에서 접근할 환경변수에 `VITE_` 접두사를 붙인다.

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 (`tsc -b && vite build`) |
| `pnpm preview` | 프로덕션 빌드 미리보기 |
| `pnpm lint` | Biome 린트 검사 + 자동 수정 |
| `pnpm lint:check` | Biome 린트 검사 (수정 없음) |
| `pnpm test` | Vitest 테스트 실행 (watch 모드) |
| `pnpm test:run` | Vitest 테스트 1회 실행 |
| `pnpm test:coverage` | 커버리지 포함 테스트 실행 |

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

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| FFmpeg 로딩 실패 | COOP/COEP 헤더 미적용 | `vite.config.ts`의 헤더 설정 확인 |
| SharedArrayBuffer 오류 | 크로스 오리진 격리 미적용 | COOP/COEP 헤더 확인, 개발 서버 재시작 |
| PixiJS 렌더링 안 됨 | WebGL 미지원 브라우저 | Chrome/Firefox/Safari 최신 버전 사용 |
| `.env.local` 미인식 | Vite 환경변수 접두사 누락 | `VITE_` 접두사 확인 |
| pnpm 명령어 없음 | pnpm 미설치 | `npm install -g pnpm` 실행 |

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [린트 설정](lint-config.md)
- [CI/CD 가이드](cicd-guide.md)
