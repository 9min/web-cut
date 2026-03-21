import "fake-indexeddb/auto";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "@/hooks/useAutoSave";
import * as autoSaveService from "@/services/autoSaveService";
import { useTimelineStore } from "@/stores/useTimelineStore";

describe("useAutoSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		useTimelineStore.getState().reset();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("30초 주기로 자동 저장을 실행한다", () => {
		const spy = vi.spyOn(autoSaveService, "autoSaveProject").mockResolvedValue();

		// 타임라인에 변경을 만들어서 저장이 트리거되도록
		useTimelineStore.getState().addTrack({
			id: "test-track",
			name: "테스트",
			type: "video",
			clips: [],
			textClips: [],
			muted: false,
			locked: false,
			order: 1,
		});

		renderHook(() => useAutoSave());

		// 30초 경과
		vi.advanceTimersByTime(30000);

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("변경이 없으면 저장하지 않는다", () => {
		const spy = vi.spyOn(autoSaveService, "autoSaveProject").mockResolvedValue();

		renderHook(() => useAutoSave());

		// 첫 30초: 최초이므로 저장
		vi.advanceTimersByTime(30000);
		expect(spy).toHaveBeenCalledTimes(1);

		// 다음 30초: 변경 없으므로 저장하지 않음
		vi.advanceTimersByTime(30000);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("언마운트 시 인터벌을 정리한다", () => {
		const spy = vi.spyOn(autoSaveService, "autoSaveProject").mockResolvedValue();

		const { unmount } = renderHook(() => useAutoSave());
		unmount();

		vi.advanceTimersByTime(60000);
		expect(spy).not.toHaveBeenCalled();
	});
});
