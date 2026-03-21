import { Component, type ErrorInfo, type ReactNode } from "react";

interface FallbackRenderProps {
	error: Error;
	reset: () => void;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	/** 정적 폴백 UI */
	fallback?: ReactNode;
	/** 에러 정보와 리셋 함수를 받는 동적 폴백 렌더러 */
	fallbackRender?: (props: FallbackRenderProps) => ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// biome-ignore lint/suspicious/noConsole: ErrorBoundary는 에러 로깅이 필수
		console.error("[ErrorBoundary]", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			if (this.props.fallbackRender) {
				return this.props.fallbackRender({
					error: this.state.error,
					reset: this.handleReset,
				});
			}

			return (
				<div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
					<h2 className="text-lg font-semibold text-white">문제가 발생했습니다</h2>
					<p className="text-sm text-gray-400">{this.state.error.message}</p>
					<button
						type="button"
						onClick={this.handleReset}
						className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
					>
						다시 시도
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
