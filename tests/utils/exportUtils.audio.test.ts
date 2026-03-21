import { describe, expect, it } from "vitest";
import { getSortedAudioClips } from "@/utils/exportUtils";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("getSortedAudioClips", () => {
	it("오디오 트랙에서 클립을 정렬하여 반환한다", () => {
		const clip1 = createTestClip({ startTime: 5 });
		const clip2 = createTestClip({ startTime: 2 });
		const audioTrack = createTestTrack({ type: "audio", clips: [clip1, clip2] });
		const videoTrack = createTestTrack({ type: "video", clips: [createTestClip()] });

		const result = getSortedAudioClips([videoTrack, audioTrack]);

		expect(result).toHaveLength(2);
		expect(result[0]?.startTime).toBe(2);
		expect(result[1]?.startTime).toBe(5);
	});

	it("오디오 트랙이 없으면 빈 배열을 반환한다", () => {
		const videoTrack = createTestTrack({ type: "video" });
		expect(getSortedAudioClips([videoTrack])).toHaveLength(0);
	});
});
