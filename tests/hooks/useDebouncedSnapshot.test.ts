import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedSnapshot } from "@/hooks/useDebouncedSnapshot";
import { useHistoryStore } from "@/stores/useHistoryStore";

describe("useDebouncedSnapshot", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		useHistoryStore.getState().reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("연속 5회 호출 시 pushSnapshot을 1회만 호출한다", () => {
		const pushSpy = vi.spyOn(useHistoryStore.getState(), "pushSnapshot");
		const { result } = renderHook(() => useDebouncedSnapshot());

		act(() => {
			for (let i = 0; i < 5; i++) {
				result.current.scheduleSnapshot();
			}
		});

		expect(pushSpy).toHaveBeenCalledTimes(1);
		pushSpy.mockRestore();
	});

	it("디바운스 만료 후 재호출 시 2번째 pushSnapshot을 호출한다", () => {
		const pushSpy = vi.spyOn(useHistoryStore.getState(), "pushSnapshot");
		const { result } = renderHook(() => useDebouncedSnapshot());

		act(() => {
			result.current.scheduleSnapshot();
		});
		expect(pushSpy).toHaveBeenCalledTimes(1);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		act(() => {
			result.current.scheduleSnapshot();
		});
		expect(pushSpy).toHaveBeenCalledTimes(2);

		pushSpy.mockRestore();
	});
});
