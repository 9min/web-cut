import { beforeEach, describe, expect, it } from "vitest";
import { useClipboardStore } from "@/stores/useClipboardStore";
import { createTestClip } from "../factories/timelineFactory";

describe("useClipboardStore", () => {
	beforeEach(() => {
		useClipboardStore.getState().clear();
	});

	it("초기 상태에서 아이템이 없다", () => {
		expect(useClipboardStore.getState().items).toHaveLength(0);
		expect(useClipboardStore.getState().hasItems()).toBe(false);
	});

	it("클립을 복사한다 (deep clone)", () => {
		const clip = createTestClip({ id: "c1", name: "원본" });
		useClipboardStore.getState().copy([clip]);

		const items = useClipboardStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0]?.name).toBe("원본");
		// deep clone 확인: 원본 수정이 복사본에 영향 없음
		expect(items[0]).not.toBe(clip);
	});

	it("hasItems가 아이템 유무를 반환한다", () => {
		expect(useClipboardStore.getState().hasItems()).toBe(false);

		const clip = createTestClip({ id: "c1" });
		useClipboardStore.getState().copy([clip]);
		expect(useClipboardStore.getState().hasItems()).toBe(true);
	});

	it("paste가 새 ID로 클립을 반환한다", () => {
		const clip = createTestClip({ id: "c1", name: "원본" });
		useClipboardStore.getState().copy([clip]);

		const pasted = useClipboardStore.getState().paste(5);
		expect(pasted).toHaveLength(1);
		expect(pasted[0]?.id).not.toBe("c1");
		expect(pasted[0]?.name).toBe("원본");
		expect(pasted[0]?.startTime).toBe(5);
	});

	it("여러 클립을 복사/붙여넣기한다", () => {
		const clips = [
			createTestClip({ id: "c1", startTime: 0, duration: 5 }),
			createTestClip({ id: "c2", startTime: 5, duration: 3 }),
		];
		useClipboardStore.getState().copy(clips);

		const pasted = useClipboardStore.getState().paste(10);
		expect(pasted).toHaveLength(2);
		expect(pasted[0]?.startTime).toBe(10);
		expect(pasted[1]?.startTime).toBe(15);
	});

	it("clear가 모든 아이템을 삭제한다", () => {
		const clip = createTestClip({ id: "c1" });
		useClipboardStore.getState().copy([clip]);
		useClipboardStore.getState().clear();
		expect(useClipboardStore.getState().hasItems()).toBe(false);
	});
});
