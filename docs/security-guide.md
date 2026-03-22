# 보안 가이드

> WebCut은 순수 클라이언트 앱으로 모든 미디어 처리가 브라우저 내에서 이루어지며 외부 서버로 데이터를 전송하지 않는다.

## OWASP Top 10 체크리스트

### 1. XSS (Cross-Site Scripting) 방지

- React의 기본 이스케이핑을 활용한다.
- `dangerouslySetInnerHTML` 사용을 금지한다. 불가피한 경우 DOMPurify로 새니타이즈한다.
- 사용자 입력(텍스트 오버레이 등)은 반드시 새니타이즈 후 저장/렌더링한다.
- CSP(Content Security Policy) 헤더를 설정한다.

```ts
// 좋은 예: React 기본 이스케이핑
<p>{userInput}</p>

// 나쁜 예
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 2. 파일 업로드 보안

모든 미디어 파일은 업로드 전에 검증한다.

```ts
// src/utils/validateMediaFile.ts
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ["video/mp4", "video/webm", "audio/mp3", "audio/wav", "image/png", "image/jpeg"];
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "지원하지 않는 파일 형식입니다." };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "파일 크기가 2GB를 초과합니다." };
  }
  return { valid: true };
}
```

- MIME 타입을 allowlist 방식으로 검증한다.
- 파일 크기 상한을 설정한다.
- 파일 이름을 `sanitizeFileName()`으로 새니타이즈한다.

### 3. 입력 새니타이제이션

텍스트 오버레이 등 사용자 입력은 렌더링 전에 새니타이즈한다.

```ts
// src/utils/textSanitizer.ts
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 1000); // 최대 길이 제한
}
```

### 4. 메모리 보안 — ObjectURL 관리

`URL.createObjectURL()`로 생성한 URL은 사용 후 반드시 해제한다.

```ts
// 좋은 예: 사용 후 해제
const objectUrl = URL.createObjectURL(file);
// ... 사용
URL.revokeObjectURL(objectUrl);

// 나쁜 예: 해제하지 않으면 메모리 누수 발생
const objectUrl = URL.createObjectURL(file);
```

### 5. 보안 설정 오류 방지

- 프로덕션에서 디버그 모드를 비활성화한다.
- 불필요한 HTTP 헤더를 제거한다.
- 보안 관련 HTTP 헤더를 설정한다.

```ts
// Vercel vercel.json 또는 vite.config.ts 서버 설정
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // FFmpeg.wasm SharedArrayBuffer 지원을 위한 COOP/COEP
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```

### 6. SharedArrayBuffer 보안 (FFmpeg.wasm)

FFmpeg.wasm은 멀티스레드 기능을 위해 `SharedArrayBuffer`를 사용한다.
이를 위해 COOP/COEP 헤더가 반드시 설정되어야 한다.

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

이 헤더 없이는 `SharedArrayBuffer`가 비활성화되어 FFmpeg.wasm이 단일 스레드로만 동작한다.

## 입력 검증 원칙

- 모든 사용자 입력을 신뢰하지 않는다.
- 길이 제한을 적용한다.
- 허용 문자 집합(allowlist)을 명시한다.
- 새니타이즈 후 저장, 저장된 값을 다시 새니타이즈하여 렌더링한다.

## 환경변수 및 시크릿 관리

WebCut은 현재 외부 서비스를 사용하지 않으므로 필수 환경변수가 없다. 향후 외부 API가 추가될 경우 다음 규칙을 따른다.

- `.env` 파일을 `.gitignore`에 반드시 포함한다.
- `.env.example` 파일에 필요한 환경변수 키만 기재한다 (값 없이).
- 코드에 시크릿을 하드코딩하지 않는다.
- `VITE_` 접두사가 붙은 변수는 클라이언트 번들에 포함되므로 민감 정보를 담지 않는다.

## 기능 개발 시 보안 검토 프로세스

모든 기능 개발은 TDD 사이클 완료 후 아래 보안 검토를 수행한다.

### 검토 시점

- 기능 구현 완료 시 (PR 생성 전)
- 코드 리뷰 시 (리뷰어가 재확인)

### 보안 검토 체크리스트

| 검토 항목 | 확인 내용 |
|-----------|----------|
| 입력 검증 | 사용자 입력에 검증 및 새니타이제이션 적용 여부 |
| XSS 방지 | `dangerouslySetInnerHTML` 미사용 또는 새니타이즈 적용 |
| 파일 검증 | 미디어 파일 MIME 타입·크기 검증 여부 |
| 메모리 관리 | ObjectURL 해제 여부 |
| 시크릿 관리 | 코드 내 API 키·비밀번호 하드코딩 없음 |
| 에러 메시지 | 내부 구현 세부사항 미노출 |
| COOP/COEP | FFmpeg.wasm 사용 페이지에 헤더 설정 여부 |

### 보안 테스트 작성 가이드

기능 테스트와 함께 보안 관련 테스트를 반드시 작성한다.

**필수 보안 테스트 유형:**

1. **입력 검증 테스트**: 비정상 입력(빈 값, 초과 길이, 특수문자, 스크립트 태그)에 대한 처리 확인
2. **파일 검증 테스트**: 허용되지 않는 MIME 타입, 초과 크기 파일에 대한 거부 확인

```ts
// 파일 검증 테스트 예시
it("허용되지 않는 파일 형식을 거부한다", () => {
  const file = new File(["content"], "test.exe", { type: "application/x-msdownload" });
  const result = validateMediaFile(file);
  expect(result.valid).toBe(false);
});

// 입력 검증 테스트 예시
it("HTML 태그가 포함된 텍스트를 새니타이즈한다", () => {
  const malicious = '<script>alert("xss")</script>';
  const result = sanitizeText(malicious);
  expect(result).not.toContain("<script>");
});
```

## 의존성 취약점 스캔

- `pnpm audit`를 정기적으로 실행한다.
- CI 파이프라인에 의존성 스캔을 포함한다.
- 알려진 취약점이 있는 의존성은 즉시 업데이트한다.
- 사용하지 않는 의존성은 제거한다.

```bash
# 취약점 스캔
pnpm audit

# 자동 수정 시도
pnpm audit --fix
```

## 관련 문서

- [에러 핸들링](error-handling.md)
- [CI/CD 가이드](cicd-guide.md)
- [코드 리뷰 체크리스트](code-review-checklist.md)
- [프로젝트 구조](project-structure.md)
