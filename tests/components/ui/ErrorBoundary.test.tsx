import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// 에러를 의도적으로 던지는 컴포넌트
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
	if (shouldThrow) {
		throw new Error("테스트 에러");
	}
	return <div>정상 렌더링</div>;
}

// console.error 스파이 (React가 에러 바운더리에서 콘솔 에러를 출력하므로)
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
	cleanup();
	consoleSpy.mockClear();
});

describe("ErrorBoundary", () => {
	it("자식 컴포넌트가 정상일 때 그대로 렌더링한다", () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("정상 렌더링")).toBeInTheDocument();
	});

	it("에러 발생 시 기본 폴백 UI를 표시한다", () => {
		render(
			<ErrorBoundary>
				<ThrowError />
			</ErrorBoundary>,
		);

		expect(screen.getByText("문제가 발생했습니다")).toBeInTheDocument();
		expect(screen.getByText("다시 시도")).toBeInTheDocument();
	});

	it("다시 시도 버튼 클릭 시 에러 상태를 리셋한다", async () => {
		const user = userEvent.setup();

		// 처음에는 에러 발생 → 리셋 후에는 정상 렌더링을 위해 key 활용
		let shouldThrow = true;

		function ConditionalThrow() {
			if (shouldThrow) {
				throw new Error("테스트 에러");
			}
			return <div>복구 성공</div>;
		}

		render(
			<ErrorBoundary>
				<ConditionalThrow />
			</ErrorBoundary>,
		);

		// 에러 폴백 표시 확인
		expect(screen.getByText("다시 시도")).toBeInTheDocument();

		// 에러 조건 제거 후 다시 시도
		shouldThrow = false;
		await user.click(screen.getByText("다시 시도"));

		// 정상 렌더링 확인
		expect(screen.getByText("복구 성공")).toBeInTheDocument();
	});

	it("커스텀 fallback을 지원한다", () => {
		const customFallback = <div>커스텀 에러 화면</div>;

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError />
			</ErrorBoundary>,
		);

		expect(screen.getByText("커스텀 에러 화면")).toBeInTheDocument();
		expect(screen.queryByText("다시 시도")).not.toBeInTheDocument();
	});

	it("fallbackRender prop으로 에러 정보와 리셋 함수를 전달한다", async () => {
		const user = userEvent.setup();
		let shouldThrow = true;

		function ConditionalThrow() {
			if (shouldThrow) {
				throw new Error("상세 에러 메시지");
			}
			return <div>복구됨</div>;
		}

		render(
			<ErrorBoundary
				fallbackRender={({ error, reset }) => (
					<div>
						<p>에러: {error.message}</p>
						<button type="button" onClick={reset}>
							복구하기
						</button>
					</div>
				)}
			>
				<ConditionalThrow />
			</ErrorBoundary>,
		);

		expect(screen.getByText("에러: 상세 에러 메시지")).toBeInTheDocument();

		shouldThrow = false;
		await user.click(screen.getByText("복구하기"));
		expect(screen.getByText("복구됨")).toBeInTheDocument();
	});
});
