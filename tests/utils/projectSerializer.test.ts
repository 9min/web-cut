import { beforeEach, describe, expect, it } from "vitest";
import { useMediaStore } from "@/stores/useMediaStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { deserializeProject, serializeProject } from "@/utils/projectSerializer";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("프로젝트 직렬화/역직렬화", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
		useProjectStore.getState().reset();
		useMediaStore.getState().reset();
	});

	describe("serializeProject", () => {
		it("프로젝트 데이터를 직렬화한다", () => {
			useProjectStore.getState().setName("테스트 프로젝트");
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);

			const data = serializeProject();
			expect(data.version).toBe("1.0");
			expect(data.project.name).toBe("테스트 프로젝트");
			expect(data.timeline.tracks).toHaveLength(2); // 기본 트랙 + 추가 트랙
			expect(data.savedAt).toBeGreaterThan(0);
		});

		it("objectUrl은 직렬화에 포함되지 않는다", () => {
			useMediaStore.getState().addAsset({
				id: "a1",
				name: "video.mp4",
				originalName: "video.mp4",
				type: "video",
				mimeType: "video/mp4",
				size: 1024,
				objectUrl: "blob:http://localhost/abc",
				thumbnailUrl: null,
				metadata: null,
				status: "ready",
				addedAt: Date.now(),
			});

			const data = serializeProject();
			const json = JSON.stringify(data);
			expect(json).not.toContain("blob:");
		});

		it("mediaRefs에 미디어 메타정보를 포함한다", () => {
			useMediaStore.getState().addAsset({
				id: "a1",
				name: "video.mp4",
				originalName: "original.mp4",
				type: "video",
				mimeType: "video/mp4",
				size: 2048,
				objectUrl: "blob:http://localhost/abc",
				thumbnailUrl: null,
				metadata: null,
				status: "ready",
				addedAt: Date.now(),
			});

			const data = serializeProject();
			expect(data.mediaRefs).toHaveLength(1);
			expect(data.mediaRefs[0]?.originalName).toBe("original.mp4");
			expect(data.mediaRefs[0]?.size).toBe(2048);
		});
	});

	describe("deserializeProject", () => {
		it("직렬화된 데이터를 역직렬화하여 스토어를 복원한다", () => {
			useProjectStore.getState().setName("원본 프로젝트");
			const clip = createTestClip({ id: "c1", trackId: "default-video-track" });
			useTimelineStore.getState().addClip("default-video-track", clip);

			const data = serializeProject();
			const json = JSON.stringify(data);

			// 스토어 초기화
			useTimelineStore.getState().reset();
			useProjectStore.getState().reset();

			// 역직렬화
			deserializeProject(json);

			expect(useProjectStore.getState().name).toBe("원본 프로젝트");
			const tracks = useTimelineStore.getState().tracks;
			const restoredClip = tracks[0]?.clips[0];
			expect(restoredClip?.id).toBe("c1");
		});

		it("잘못된 JSON을 거부한다", () => {
			expect(() => deserializeProject("not json")).toThrow();
		});

		it("버전 필드가 없으면 거부한다", () => {
			const invalid = JSON.stringify({ project: {}, timeline: {} });
			expect(() => deserializeProject(invalid)).toThrow();
		});

		it("필수 필드 누락 시 거부한다", () => {
			const invalid = JSON.stringify({ version: "1.0" });
			expect(() => deserializeProject(invalid)).toThrow();
		});

		it("라운드트립: 직렬화 → 역직렬화 후 상태가 동일하다", () => {
			useProjectStore.getState().setName("라운드트립 테스트");
			useProjectStore.getState().setResolution(1280, 720);
			useProjectStore.getState().setFps(30);

			const clip = createTestClip({
				id: "c1",
				trackId: "default-video-track",
				startTime: 2,
				duration: 5,
			});
			useTimelineStore.getState().addClip("default-video-track", clip);

			const serialized = serializeProject();
			const json = JSON.stringify(serialized);

			useTimelineStore.getState().reset();
			useProjectStore.getState().reset();

			deserializeProject(json);

			expect(useProjectStore.getState().name).toBe("라운드트립 테스트");
			expect(useProjectStore.getState().width).toBe(1280);
			expect(useProjectStore.getState().height).toBe(720);
			expect(useProjectStore.getState().fps).toBe(30);

			const restoredClip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(restoredClip?.startTime).toBe(2);
			expect(restoredClip?.duration).toBe(5);
		});
	});
});
