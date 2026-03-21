import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransitionPopover } from "@/components/timeline/TransitionPopover";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip } from "@/types/timeline";

function makeClip(overrides: Partial<Clip> = {}): Clip {
	return {
		id: "clip-1",
		trackId: "track-1",
		assetId: "asset-1",
		name: "clip",
		startTime: 0,
		duration: 5,
		inPoint: 0,
		outPoint: 5,
		outTransition: { type: "fade", duration: 0.5 },
		...overrides,
	};
}

describe("TransitionPopover", () => {
	const anchorRef = createRef<HTMLElement>();

	beforeEach(() => {
		useTimelineStore.getState().reset();
		const anchor = document.createElement("div");
		document.body.appendChild(anchor);
		Object.defineProperty(anchorRef, "current", { value: anchor, writable: true });
	});

	it("트랜지션 타입 버튼들을 렌더링한다", () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });

		render(
			<TransitionPopover
				clip={clip}
				nextClip={nextClip}
				trackId="track-1"
				anchorRef={anchorRef}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText("페이드")).toBeInTheDocument();
		expect(screen.getByText("디졸브")).toBeInTheDocument();
		expect(screen.getByText("왼쪽 와이프")).toBeInTheDocument();
		expect(screen.getByText("오른쪽 와이프")).toBeInTheDocument();
	});

	it("타입 버튼 클릭 시 updateTransition을 호출한다", async () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });
		const updateSpy = vi.spyOn(useTimelineStore.getState(), "updateTransition");

		render(
			<TransitionPopover
				clip={clip}
				nextClip={nextClip}
				trackId="track-1"
				anchorRef={anchorRef}
				onClose={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByText("디졸브"));
		expect(updateSpy).toHaveBeenCalledWith("track-1", "clip-1", { type: "dissolve" });
	});

	it("삭제 버튼 클릭 시 removeTransition을 호출하고 onClose를 실행한다", async () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });
		const onClose = vi.fn();
		const removeSpy = vi.spyOn(useTimelineStore.getState(), "removeTransition");

		render(
			<TransitionPopover
				clip={clip}
				nextClip={nextClip}
				trackId="track-1"
				anchorRef={anchorRef}
				onClose={onClose}
			/>,
		);

		await userEvent.click(screen.getByText("삭제"));
		expect(removeSpy).toHaveBeenCalledWith("track-1", "clip-1");
		expect(onClose).toHaveBeenCalled();
	});

	it("지속 시간 슬라이더를 렌더링한다", () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });

		render(
			<TransitionPopover
				clip={clip}
				nextClip={nextClip}
				trackId="track-1"
				anchorRef={anchorRef}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText("지속 시간: 0.5초")).toBeInTheDocument();
	});

	it("outTransition이 없으면 렌더링하지 않는다", () => {
		const clip = makeClip({ outTransition: undefined });
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });

		render(
			<TransitionPopover
				clip={clip}
				nextClip={nextClip}
				trackId="track-1"
				anchorRef={anchorRef}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.queryByTestId("transition-popover")).not.toBeInTheDocument();
	});
});
