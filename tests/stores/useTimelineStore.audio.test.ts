import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore - 오디오 트랙", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	describe("addAudioTrack", () => {
		it("오디오 타입의 트랙을 추가한다", () => {
			useTimelineStore.getState().addAudioTrack();
			const tracks = useTimelineStore.getState().tracks;
			const audioTrack = tracks.find((t) => t.type === "audio");

			expect(audioTrack).toBeDefined();
			expect(audioTrack?.name).toBe("오디오 1");
			expect(audioTrack?.type).toBe("audio");
		});

		it("오디오 트랙 번호가 순차적으로 증가한다", () => {
			useTimelineStore.getState().addAudioTrack();
			useTimelineStore.getState().addAudioTrack();
			const tracks = useTimelineStore.getState().tracks;
			const audioTracks = tracks.filter((t) => t.type === "audio");

			expect(audioTracks).toHaveLength(2);
			expect(audioTracks[0]?.name).toBe("오디오 1");
			expect(audioTracks[1]?.name).toBe("오디오 2");
		});
	});

	describe("updateClipVolume", () => {
		it("클립 볼륨을 업데이트한다", () => {
			const track = createTestTrack({ id: "audio-1", type: "audio" });
			const clip = createTestClip({ id: "clip-1", trackId: "audio-1" });
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().updateClipVolume("audio-1", "clip-1", 0.5);
			const updated = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");

			expect(updated?.volume).toBe(0.5);
		});

		it("볼륨 1.0은 undefined로 저장한다 (기본값)", () => {
			const track = createTestTrack({ id: "audio-1", type: "audio" });
			const clip = createTestClip({ id: "clip-1", trackId: "audio-1", volume: 0.5 });
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().updateClipVolume("audio-1", "clip-1", 1);
			const updated = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");

			expect(updated?.volume).toBeUndefined();
		});

		it("볼륨을 0~1 범위로 클램핑한다", () => {
			const track = createTestTrack({ id: "audio-1", type: "audio" });
			const clip = createTestClip({ id: "clip-1", trackId: "audio-1" });
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().updateClipVolume("audio-1", "clip-1", -0.5);
			const clamped = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");
			expect(clamped?.volume).toBe(0);

			useTimelineStore.getState().updateClipVolume("audio-1", "clip-1", 1.5);
			const clampedMax = useTimelineStore
				.getState()
				.tracks[0]?.clips.find((c) => c.id === "clip-1");
			expect(clampedMax?.volume).toBeUndefined(); // 1.0 clamped → undefined
		});
	});
});
