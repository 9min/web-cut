import { describe, expect, it } from "vitest";
import { getVisibleAudioClipsAtTime } from "@/utils/previewUtils";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("getVisibleAudioClipsAtTime", () => {
	it("현재 시간에 재생 중인 오디오 클립을 반환한다", () => {
		const clip = createTestClip({ startTime: 2, duration: 5, inPoint: 0 });
		const track = createTestTrack({ type: "audio", clips: [clip] });

		const result = getVisibleAudioClipsAtTime([track], 4);

		expect(result).toHaveLength(1);
		expect(result[0]?.clip.id).toBe(clip.id);
		expect(result[0]?.localTime).toBe(2); // 4 - 2 + 0
	});

	it("범위 밖의 시간에는 빈 배열을 반환한다", () => {
		const clip = createTestClip({ startTime: 2, duration: 5 });
		const track = createTestTrack({ type: "audio", clips: [clip] });

		expect(getVisibleAudioClipsAtTime([track], 0)).toHaveLength(0);
		expect(getVisibleAudioClipsAtTime([track], 8)).toHaveLength(0);
	});

	it("비디오 트랙은 무시한다", () => {
		const clip = createTestClip({ startTime: 0, duration: 5 });
		const track = createTestTrack({ type: "video", clips: [clip] });

		expect(getVisibleAudioClipsAtTime([track], 2)).toHaveLength(0);
	});
});
