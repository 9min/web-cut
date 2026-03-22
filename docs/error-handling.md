# 에러 핸들링 가이드

> WebCut은 순수 클라이언트 앱으로 외부 API가 없다. 에러는 미디어 처리(FFmpeg.wasm, PixiJS), 파일 I/O, 브라우저 API 관련이 주를 이룬다.

## 프론트엔드 에러 처리

### Error Boundary

React Error Boundary를 사용하여 컴포넌트 트리의 에러를 포착한다.
프로젝트에는 `src/components/ui/ErrorBoundary.tsx`가 구현되어 있다.

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("에러 발생:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### Error Boundary 배치 전략

```
App
├── ErrorBoundary (전체 앱 - 치명적 에러)
│   ├── EditorLayout
│   │   ├── ErrorBoundary (패널 단위)
│   │   │   ├── PreviewPanel
│   │   │   ├── Timeline
│   │   │   └── ExportPanel
```

- **전체 앱**: 예상치 못한 치명적 에러 포착
- **패널 단위**: 한 패널의 에러가 전체 편집기에 영향을 주지 않도록 격리

## 서비스 함수에서의 에러 처리

### FFmpeg 서비스 에러

```ts
// src/services/ffmpegService.ts
export async function encode(params: EncodeParams): Promise<Uint8Array> {
  try {
    await ffmpeg.exec([/* FFmpeg 인수 */]);
    const data = await ffmpeg.readFile("output.mp4");
    return data as Uint8Array;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`인코딩 실패: ${error.message}`);
    }
    throw new Error("인코딩 중 알 수 없는 오류가 발생했습니다.");
  }
}
```

### 미디어 업로드 에러

```ts
// src/hooks/useMediaUpload.ts
export function useMediaUpload() {
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: File[]) => {
    try {
      for (const file of files) {
        const validation = validateMediaFile(file);
        if (!validation.valid) {
          setError(validation.error ?? "파일 검증 실패");
          return;
        }
        // 업로드 처리
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return { uploadFiles, error };
}
```

## 앱 에러 타입 및 헬퍼

```ts
// src/utils/error.ts (또는 관련 유틸)
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류가 발생했습니다.";
}
```

## 컴포넌트에서의 에러 처리

```tsx
function ExportPanel() {
  const [error, setError] = useState<string | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);

  const handleExport = async () => {
    setError(null);
    setIsEncoding(true);
    try {
      await encode(exportParams);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsEncoding(false);
    }
  };

  if (error) return <ErrorMessage message={error} onRetry={handleExport} />;
  return <button onClick={handleExport}>내보내기</button>;
}
```

## 에러 종류별 처리 방법

| 에러 종류 | 원인 | 처리 방법 |
|----------|------|----------|
| FFmpeg 로딩 실패 | COOP/COEP 헤더 미설정, 네트워크 오류 | 사용자에게 안내 + 재시도 버튼 |
| 파일 형식 오류 | 지원하지 않는 MIME 타입 | 즉시 에러 메시지 표시 |
| 파일 크기 초과 | 브라우저 메모리 한도 | 크기 제한 안내 |
| 인코딩 실패 | FFmpeg 처리 오류 | 에러 메시지 + 재시도 |
| PixiJS 렌더링 실패 | WebGL 미지원 또는 초기화 실패 | 폴백 렌더러 또는 안내 |
| IndexedDB 실패 | 스토리지 용량 초과 | 자동 저장 비활성화 안내 |

## 에러 응답 형식

앱 전체에서 일관된 에러 형식을 사용한다:

```ts
// 앱 에러
interface AppError {
  code: string;
  message: string;    // 사용자에게 표시할 메시지
  details?: string;   // 추가 정보 (선택)
}
```

## 로깅 전략

### 로그 레벨

| 레벨 | 용도 | 예시 |
|------|------|------|
| `error` | 즉시 대응이 필요한 오류 | FFmpeg 인코딩 실패, PixiJS 초기화 실패 |
| `warn` | 잠재적 문제 | 파일 검증 경고, 메모리 사용량 높음 |
| `info` | 주요 이벤트 | 파일 업로드 완료, 내보내기 완료 |
| `debug` | 디버깅용 상세 정보 | 클립 타임라인 계산, FFmpeg 진행률 |

### 로깅 규칙

- 프로덕션에서는 `info` 이상만 출력한다.
- 개인정보(파일 내용, 경로 등)를 로그에 포함하지 않는다.

```ts
// 좋은 예
console.error("파일 업로드 실패", { fileName: file.name, errorCode: "INVALID_TYPE" });

// 나쁜 예
console.error(`에러: ${error}`);  // 구조화되지 않음
```

## 사용자 에러 메시지 가이드라인

### 원칙

1. **사용자 친화적**: 기술 용어 대신 이해하기 쉬운 표현을 사용한다.
2. **구체적**: 무엇이 잘못되었는지 명확히 설명한다.
3. **해결 방법 제시**: 가능하면 사용자가 취할 수 있는 행동을 안내한다.
4. **내부 구현 숨김**: 스택 트레이스, FFmpeg 에러 코드 등을 노출하지 않는다.

### 예시

| 상황 | 나쁜 메시지 | 좋은 메시지 |
|------|-----------|-----------|
| FFmpeg 로딩 실패 | `SharedArrayBuffer is not defined` | `동영상 편집 기능을 불러오는 데 실패했습니다. 페이지를 새로고침해주세요.` |
| 파일 형식 오류 | `MIME type application/x-msdownload not allowed` | `지원하지 않는 파일 형식입니다. MP4, WebM, MP3, WAV, PNG, JPG 파일을 사용해주세요.` |
| 인코딩 실패 | `ffmpeg error code -1` | `동영상 내보내기에 실패했습니다. 다시 시도해주세요.` |
| 파일 크기 초과 | `File size exceeds maximum` | `파일 크기가 2GB를 초과합니다. 더 작은 파일을 사용해주세요.` |

## 관련 문서

- [보안 가이드](security-guide.md)
- [테스트 가이드](testing-guide.md)
- [코드 리뷰 체크리스트](code-review-checklist.md)
