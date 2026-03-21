import { beforeEach, describe, expect, it } from "vitest";
import { EXPORT_RESOLUTIONS } from "@/constants/export";
import { useExportStore } from "@/stores/useExportStore";

describe("useExportStore", () => {
	beforeEach(() => {
		useExportStore.getState().reset();
	});

	it("초기 상태를 가진다", () => {
		const state = useExportStore.getState();
		expect(state.status).toBe("idle");
		expect(state.progress).toBe(0);
		expect(state.resolution.label).toBe("1080p");
		expect(state.error).toBeNull();
	});

	it("해상도를 변경한다", () => {
		const res = EXPORT_RESOLUTIONS[0];
		if (!res) return;
		useExportStore.getState().setResolution(res);
		expect(useExportStore.getState().resolution).toBe(res);
	});

	it("진행률을 업데이트한다", () => {
		useExportStore.getState().setProgress(50);
		expect(useExportStore.getState().progress).toBe(50);
	});

	it("상태를 변경한다", () => {
		useExportStore.getState().setStatus("encoding");
		expect(useExportStore.getState().status).toBe("encoding");
	});

	it("에러를 설정한다", () => {
		useExportStore.getState().setError("인코딩 실패");
		expect(useExportStore.getState().error).toBe("인코딩 실패");
		expect(useExportStore.getState().status).toBe("error");
	});

	it("reset으로 초기화한다", () => {
		useExportStore.getState().setStatus("encoding");
		useExportStore.getState().setProgress(80);
		useExportStore.getState().reset();

		expect(useExportStore.getState().status).toBe("idle");
		expect(useExportStore.getState().progress).toBe(0);
	});
});
