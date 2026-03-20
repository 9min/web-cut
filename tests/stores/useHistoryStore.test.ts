import { beforeEach, describe, expect, it } from "vitest";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestTrack } from "../factories/timelineFactory";

describe("useHistoryStore", () => {
	beforeEach(() => {
		useHistoryStore.getState().reset();
		useTimelineStore.getState().reset();
	});

	it("초기 상태에서 undo/redo 불가하다", () => {
		const state = useHistoryStore.getState();
		expect(state.canUndo()).toBe(false);
		expect(state.canRedo()).toBe(false);
	});

	it("스냅샷을 저장하면 undo 가능하다", () => {
		useHistoryStore.getState().pushSnapshot();
		expect(useHistoryStore.getState().canUndo()).toBe(true);
	});

	it("undo로 이전 상태를 복원한다", () => {
		// 초기 상태 저장
		useHistoryStore.getState().pushSnapshot();

		// 트랙 추가
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		expect(useTimelineStore.getState().tracks).toHaveLength(1);

		// undo → 트랙이 없어야 함
		useHistoryStore.getState().undo();
		expect(useTimelineStore.getState().tracks).toHaveLength(0);
	});

	it("redo로 undo한 상태를 다시 적용한다", () => {
		// 트랙 추가 전 스냅샷 저장
		useHistoryStore.getState().pushSnapshot();
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));

		// undo → 트랙 없는 상태로 복원
		useHistoryStore.getState().undo();
		expect(useTimelineStore.getState().tracks).toHaveLength(0);

		// redo → 트랙 있는 상태로 복원
		useHistoryStore.getState().redo();
		expect(useTimelineStore.getState().tracks).toHaveLength(1);
	});

	it("새 변경을 하면 redo 스택이 초기화된다", () => {
		useHistoryStore.getState().pushSnapshot();
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useHistoryStore.getState().pushSnapshot();

		useHistoryStore.getState().undo();
		expect(useHistoryStore.getState().canRedo()).toBe(true);

		// 새 변경
		useHistoryStore.getState().pushSnapshot();
		expect(useHistoryStore.getState().canRedo()).toBe(false);
	});

	it("undo 스택이 비어있으면 undo를 무시한다", () => {
		expect(() => useHistoryStore.getState().undo()).not.toThrow();
	});

	it("redo 스택이 비어있으면 redo를 무시한다", () => {
		expect(() => useHistoryStore.getState().redo()).not.toThrow();
	});

	it("reset으로 모든 히스토리를 초기화한다", () => {
		useHistoryStore.getState().pushSnapshot();
		useHistoryStore.getState().pushSnapshot();
		useHistoryStore.getState().reset();

		expect(useHistoryStore.getState().canUndo()).toBe(false);
		expect(useHistoryStore.getState().canRedo()).toBe(false);
	});
});
