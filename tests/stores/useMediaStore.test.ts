import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaStore } from "@/stores/useMediaStore";
import { createTestMediaAsset } from "../factories/mediaFactory";

describe("useMediaStore", () => {
	beforeEach(() => {
		useMediaStore.getState().reset();
		vi.restoreAllMocks();
	});

	it("초기 상태는 빈 에셋 목록이다", () => {
		const state = useMediaStore.getState();
		expect(state.assets).toEqual([]);
	});

	it("에셋을 추가한다", () => {
		const asset = createTestMediaAsset();
		useMediaStore.getState().addAsset(asset);
		expect(useMediaStore.getState().assets).toHaveLength(1);
		expect(useMediaStore.getState().assets[0]).toEqual(asset);
	});

	it("에셋을 제거하고 objectURL을 해제한다", () => {
		const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		const asset = createTestMediaAsset({ objectUrl: "blob:http://localhost/test" });
		useMediaStore.getState().addAsset(asset);

		useMediaStore.getState().removeAsset(asset.id);

		expect(useMediaStore.getState().assets).toHaveLength(0);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test");
	});

	it("이미지 에셋 제거 시 thumbnailUrl도 해제한다", () => {
		const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		const asset = createTestMediaAsset({
			type: "image",
			objectUrl: "blob:http://localhost/obj",
			thumbnailUrl: "blob:http://localhost/thumb",
		});
		useMediaStore.getState().addAsset(asset);

		useMediaStore.getState().removeAsset(asset.id);

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/obj");
		// thumbnailUrl === objectUrl인 경우 한 번만 호출될 수 있으나, 다른 경우 두 번 호출
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/thumb");
	});

	it("에셋 상태를 업데이트한다", () => {
		const asset = createTestMediaAsset({ status: "loading" });
		useMediaStore.getState().addAsset(asset);

		useMediaStore.getState().updateAsset(asset.id, { status: "ready" });

		expect(useMediaStore.getState().assets[0]?.status).toBe("ready");
	});

	it("에셋 메타데이터를 업데이트한다", () => {
		const asset = createTestMediaAsset();
		useMediaStore.getState().addAsset(asset);

		const metadata = { width: 1920, height: 1080, duration: 60, fps: 30 };
		useMediaStore.getState().updateAsset(asset.id, { metadata, status: "ready" });

		expect(useMediaStore.getState().assets[0]?.metadata).toEqual(metadata);
	});

	it("존재하지 않는 에셋 제거 시 에러가 발생하지 않는다", () => {
		expect(() => useMediaStore.getState().removeAsset("non-existent")).not.toThrow();
	});

	it("reset으로 모든 에셋을 제거하고 objectURL을 해제한다", () => {
		const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		const asset1 = createTestMediaAsset({ objectUrl: "blob:1" });
		const asset2 = createTestMediaAsset({ objectUrl: "blob:2" });
		useMediaStore.getState().addAsset(asset1);
		useMediaStore.getState().addAsset(asset2);

		useMediaStore.getState().reset();

		expect(useMediaStore.getState().assets).toHaveLength(0);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:1");
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:2");
	});
});
