import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransformPanel } from "@/components/inspector/TransformPanel";
import { TRANSFORM_DEFAULTS } from "@/constants/transform";

describe("TransformPanel", () => {
	it("트랜스폼 슬라이더들을 렌더링한다", () => {
		render(<TransformPanel trackId="track-1" clipId="clip-1" transform={TRANSFORM_DEFAULTS} />);

		expect(screen.getByTestId("transform-x")).toBeInTheDocument();
		expect(screen.getByTestId("transform-y")).toBeInTheDocument();
		expect(screen.getByTestId("transform-scaleX")).toBeInTheDocument();
		expect(screen.getByTestId("transform-scaleY")).toBeInTheDocument();
		expect(screen.getByTestId("transform-rotation")).toBeInTheDocument();
	});

	it("초기화 버튼을 렌더링한다", () => {
		render(<TransformPanel trackId="track-1" clipId="clip-1" transform={TRANSFORM_DEFAULTS} />);

		expect(screen.getByTestId("transform-reset-button")).toBeInTheDocument();
	});

	it("현재 트랜스폼 값을 표시한다", () => {
		render(
			<TransformPanel
				trackId="track-1"
				clipId="clip-1"
				transform={{ x: 30, y: 70, scaleX: 1.5, scaleY: 0.8, rotation: 45 }}
			/>,
		);

		expect(screen.getByText("30%")).toBeInTheDocument();
		expect(screen.getByText("70%")).toBeInTheDocument();
		expect(screen.getByText("1.50")).toBeInTheDocument();
		expect(screen.getByText("0.80")).toBeInTheDocument();
		expect(screen.getByText("45°")).toBeInTheDocument();
	});
});
