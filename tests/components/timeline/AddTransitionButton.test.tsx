import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddTransitionButton } from "@/components/timeline/AddTransitionButton";
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
		...overrides,
	};
}

describe("AddTransitionButton", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("인접한 두 클립 사이에 트랜지션 추가 버튼을 렌더링한다", () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });

		render(<AddTransitionButton clip={clip} nextClip={nextClip} zoom={100} trackId="track-1" />);

		expect(screen.getByTestId("add-transition-button")).toBeInTheDocument();
	});

	it("이미 트랜지션이 있으면 렌더링하지 않는다", () => {
		const clip = makeClip({ outTransition: { type: "fade", duration: 0.5 } });
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });

		const { container } = render(
			<AddTransitionButton clip={clip} nextClip={nextClip} zoom={100} trackId="track-1" />,
		);

		expect(container.innerHTML).toBe("");
	});

	it("클릭 시 addTransition을 호출한다", async () => {
		const clip = makeClip();
		const nextClip = makeClip({ id: "clip-2", startTime: 5 });
		const onAdded = vi.fn();
		const addTransitionSpy = vi.spyOn(useTimelineStore.getState(), "addTransition");

		render(
			<AddTransitionButton
				clip={clip}
				nextClip={nextClip}
				zoom={100}
				trackId="track-1"
				onAdded={onAdded}
			/>,
		);

		await userEvent.click(screen.getByTestId("add-transition-button"));

		expect(addTransitionSpy).toHaveBeenCalledWith("track-1", "clip-1", {
			type: "fade",
			duration: 0.5,
		});
		expect(onAdded).toHaveBeenCalledWith("clip-1");
	});
});
