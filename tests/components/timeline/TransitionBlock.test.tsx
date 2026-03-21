import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TransitionBlock } from "@/components/timeline/TransitionBlock";
import type { Clip } from "@/types/timeline";

function makeClip(overrides: Partial<Clip> = {}): Clip {
	return {
		id: "clip-1",
		trackId: "track-1",
		assetId: "asset-1",
		name: "테스트",
		startTime: 0,
		duration: 10,
		inPoint: 0,
		outPoint: 10,
		...overrides,
	};
}

describe("TransitionBlock", () => {
	it("outTransition이 있으면 블록을 렌더링한다", () => {
		const clip = makeClip({
			outTransition: { type: "fade", duration: 1 },
		});
		const nextClip = makeClip({ id: "clip-2", startTime: 10, duration: 5 });

		render(<TransitionBlock clip={clip} nextClip={nextClip} zoom={60} trackId="track-1" />);

		expect(screen.getByTestId("transition-block")).toBeInTheDocument();
		expect(screen.getByText("페이드")).toBeInTheDocument();
	});

	it("outTransition이 없으면 아무것도 렌더링하지 않는다", () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 10, duration: 5 });

		const { container } = render(
			<TransitionBlock clip={clip} nextClip={nextClip} zoom={60} trackId="track-1" />,
		);

		expect(container.firstChild).toBeNull();
	});

	it("클릭 시 팝오버를 표시한다", async () => {
		const user = userEvent.setup();
		const clip = makeClip({
			outTransition: { type: "dissolve", duration: 0.5 },
		});
		const nextClip = makeClip({ id: "clip-2", startTime: 10, duration: 5 });

		render(<TransitionBlock clip={clip} nextClip={nextClip} zoom={60} trackId="track-1" />);

		await user.click(screen.getByTestId("transition-block"));
		expect(screen.getByTestId("transition-popover")).toBeInTheDocument();
	});
});
