import { describe, expect, it } from "vitest";
import { extractPeaks, waveformCache } from "@/services/waveformService";

describe("waveformService", () => {
	it("extractPeaks가 AudioBuffer에서 피크 배열을 추출한다", () => {
		// Float32Array 모의 오디오 데이터 생성
		const sampleRate = 44100;
		const length = sampleRate; // 1초
		const channelData = new Float32Array(length);
		for (let i = 0; i < length; i++) {
			channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
		}

		const peaks = extractPeaks(channelData, 100);
		expect(peaks).toHaveLength(100);
		expect(peaks.every((p) => p >= 0 && p <= 1)).toBe(true);
	});

	it("waveformCache는 Map 인터페이스를 가진다", () => {
		expect(waveformCache).toBeInstanceOf(Map);
	});
});
