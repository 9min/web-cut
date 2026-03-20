import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from "@/constants/timeline";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";

describe("useTimelineZoom", () => {
	it("초기 줌 레벨은 DEFAULT_ZOOM이다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		expect(result.current.zoom).toBe(DEFAULT_ZOOM);
	});

	it("zoomIn으로 줌을 증가시킨다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		act(() => result.current.zoomIn());
		expect(result.current.zoom).toBeGreaterThan(DEFAULT_ZOOM);
	});

	it("zoomOut으로 줌을 감소시킨다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		act(() => result.current.zoomOut());
		expect(result.current.zoom).toBeLessThan(DEFAULT_ZOOM);
	});

	it("MAX_ZOOM을 초과하지 않는다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		for (let i = 0; i < 100; i++) {
			act(() => result.current.zoomIn());
		}
		expect(result.current.zoom).toBeLessThanOrEqual(MAX_ZOOM);
	});

	it("MIN_ZOOM 미만으로 내려가지 않는다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		for (let i = 0; i < 100; i++) {
			act(() => result.current.zoomOut());
		}
		expect(result.current.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
	});

	it("setZoom으로 직접 줌 레벨을 설정한다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		act(() => result.current.setZoom(200));
		expect(result.current.zoom).toBe(200);
	});

	it("setZoom에서 범위를 클램핑한다", () => {
		const { result } = renderHook(() => useTimelineZoom());
		act(() => result.current.setZoom(9999));
		expect(result.current.zoom).toBe(MAX_ZOOM);

		act(() => result.current.setZoom(1));
		expect(result.current.zoom).toBe(MIN_ZOOM);
	});
});
