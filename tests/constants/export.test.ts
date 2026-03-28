import { describe, expect, it } from "vitest";
import { EXPORT_RESOLUTIONS, SPEED_HINTS } from "@/constants/export";

describe("EXPORT_RESOLUTIONS", () => {
	it("360p 옵션을 포함한다", () => {
		const res360 = EXPORT_RESOLUTIONS.find((r) => r.label === "360p");
		expect(res360).toBeDefined();
		expect(res360?.width).toBe(640);
		expect(res360?.height).toBe(360);
	});

	it("해상도가 낮은 순서에서 높은 순서로 정렬되어 있다", () => {
		for (let i = 1; i < EXPORT_RESOLUTIONS.length; i++) {
			const prev = EXPORT_RESOLUTIONS[i - 1];
			const curr = EXPORT_RESOLUTIONS[i];
			if (prev && curr) {
				expect(prev.height).toBeLessThan(curr.height);
			}
		}
	});
});

describe("SPEED_HINTS", () => {
	it("360p는 '빠름' 힌트를 가진다", () => {
		expect(SPEED_HINTS["360p"]).toBe("빠름");
	});

	it("480p는 '보통' 힌트를 가진다", () => {
		expect(SPEED_HINTS["480p"]).toBe("보통");
	});

	it("720p는 '보통' 힌트를 가진다", () => {
		expect(SPEED_HINTS["720p"]).toBe("보통");
	});

	it("1080p는 '느림' 힌트를 가진다", () => {
		expect(SPEED_HINTS["1080p"]).toBe("느림");
	});
});
