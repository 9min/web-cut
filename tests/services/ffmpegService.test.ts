import { describe, expect, it, vi } from "vitest";

// fetchFile을 모킹하여 병렬 fetch 동작을 테스트
vi.mock("@ffmpeg/util", () => ({
	fetchFile: vi.fn((url: string) => Promise.resolve(new Uint8Array([1, 2, 3]))),
	toBlobURL: vi.fn(),
}));

describe("fetchInputFiles", () => {
	it("여러 에셋의 fetch를 병렬로 수행한다", async () => {
		const { fetchFile } = await import("@ffmpeg/util");
		const { fetchInputFiles } = await import("@/services/ffmpegService");

		const assets = [
			{ fileName: "input_a1.mp4", url: "blob:http://localhost/a1" },
			{ fileName: "input_a2.mp4", url: "blob:http://localhost/a2" },
			{ fileName: "input_a3.mp4", url: "blob:http://localhost/a3" },
		];

		const result = await fetchInputFiles(assets);

		// 모든 URL에 대해 fetchFile이 호출되었는지 확인
		expect(fetchFile).toHaveBeenCalledTimes(3);
		expect(fetchFile).toHaveBeenCalledWith("blob:http://localhost/a1");
		expect(fetchFile).toHaveBeenCalledWith("blob:http://localhost/a2");
		expect(fetchFile).toHaveBeenCalledWith("blob:http://localhost/a3");

		// 결과가 fileName-data 쌍의 배열인지 확인
		expect(result).toHaveLength(3);
		expect(result[0]?.fileName).toBe("input_a1.mp4");
		expect(result[0]?.data).toBeInstanceOf(Uint8Array);
	});

	it("빈 배열을 전달하면 빈 배열을 반환한다", async () => {
		const { fetchInputFiles } = await import("@/services/ffmpegService");
		const result = await fetchInputFiles([]);
		expect(result).toHaveLength(0);
	});
});
