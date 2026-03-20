import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_FPS,
	DEFAULT_HEIGHT,
	DEFAULT_PROJECT_NAME,
	DEFAULT_WIDTH,
} from "@/constants/project";
import { useProjectStore } from "@/stores/useProjectStore";

describe("useProjectStore", () => {
	beforeEach(() => {
		useProjectStore.getState().reset();
	});

	it("기본 프로젝트 설정을 가진다", () => {
		const state = useProjectStore.getState();
		expect(state.name).toBe(DEFAULT_PROJECT_NAME);
		expect(state.width).toBe(DEFAULT_WIDTH);
		expect(state.height).toBe(DEFAULT_HEIGHT);
		expect(state.fps).toBe(DEFAULT_FPS);
	});

	it("프로젝트 이름을 변경한다", () => {
		useProjectStore.getState().setName("내 프로젝트");
		expect(useProjectStore.getState().name).toBe("내 프로젝트");
	});

	it("해상도를 변경한다", () => {
		useProjectStore.getState().setResolution(1280, 720);
		const state = useProjectStore.getState();
		expect(state.width).toBe(1280);
		expect(state.height).toBe(720);
	});

	it("FPS를 변경한다", () => {
		useProjectStore.getState().setFps(60);
		expect(useProjectStore.getState().fps).toBe(60);
	});

	it("설정을 초기화한다", () => {
		useProjectStore.getState().setName("변경됨");
		useProjectStore.getState().setFps(60);
		useProjectStore.getState().reset();

		const state = useProjectStore.getState();
		expect(state.name).toBe(DEFAULT_PROJECT_NAME);
		expect(state.fps).toBe(DEFAULT_FPS);
	});
});
