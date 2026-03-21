import { describe, expect, it } from "vitest";
import type { ClipFilter } from "@/types/filter";
import {
	buildEqFilterString,
	clampFilterValue,
	isDefaultFilter,
	toFFmpegBrightness,
	toFFmpegContrast,
	toFFmpegSaturation,
	toPixiBrightness,
	toPixiContrast,
	toPixiSaturation,
} from "@/utils/filterUtils";

describe("isDefaultFilter", () => {
	it("모든 값이 0이면 true를 반환한다", () => {
		const filter: ClipFilter = { brightness: 0, contrast: 0, saturation: 0 };
		expect(isDefaultFilter(filter)).toBe(true);
	});

	it("하나라도 0이 아니면 false를 반환한다", () => {
		expect(isDefaultFilter({ brightness: 10, contrast: 0, saturation: 0 })).toBe(false);
		expect(isDefaultFilter({ brightness: 0, contrast: -5, saturation: 0 })).toBe(false);
		expect(isDefaultFilter({ brightness: 0, contrast: 0, saturation: 1 })).toBe(false);
	});
});

describe("clampFilterValue", () => {
	it("-100 미만 값을 -100으로 클램핑한다", () => {
		expect(clampFilterValue(-200)).toBe(-100);
	});

	it("+100 초과 값을 +100으로 클램핑한다", () => {
		expect(clampFilterValue(150)).toBe(100);
	});

	it("범위 내 값은 그대로 반환한다", () => {
		expect(clampFilterValue(0)).toBe(0);
		expect(clampFilterValue(50)).toBe(50);
		expect(clampFilterValue(-100)).toBe(-100);
		expect(clampFilterValue(100)).toBe(100);
	});
});

describe("toPixiBrightness", () => {
	it("UI 0 → PixiJS 1 (기본값)", () => {
		expect(toPixiBrightness(0)).toBeCloseTo(1);
	});

	it("UI -100 → PixiJS 0", () => {
		expect(toPixiBrightness(-100)).toBeCloseTo(0);
	});

	it("UI +100 → PixiJS 2", () => {
		expect(toPixiBrightness(100)).toBeCloseTo(2);
	});

	it("UI +50 → PixiJS 1.5", () => {
		expect(toPixiBrightness(50)).toBeCloseTo(1.5);
	});
});

describe("toPixiContrast", () => {
	it("UI 0 → PixiJS 0 (기본값, 내부적으로 +1 적용됨)", () => {
		expect(toPixiContrast(0)).toBeCloseTo(0);
	});

	it("UI -100 → PixiJS -1", () => {
		expect(toPixiContrast(-100)).toBeCloseTo(-1);
	});

	it("UI +100 → PixiJS 1", () => {
		expect(toPixiContrast(100)).toBeCloseTo(1);
	});
});

describe("toPixiSaturation", () => {
	it("UI 0 → PixiJS 0 (기본값)", () => {
		expect(toPixiSaturation(0)).toBeCloseTo(0);
	});

	it("UI -100 → PixiJS -1", () => {
		expect(toPixiSaturation(-100)).toBeCloseTo(-1);
	});

	it("UI +100 → PixiJS 1", () => {
		expect(toPixiSaturation(100)).toBeCloseTo(1);
	});
});

describe("toFFmpegBrightness", () => {
	it("UI 0 → FFmpeg 0 (기본값)", () => {
		expect(toFFmpegBrightness(0)).toBeCloseTo(0);
	});

	it("UI -100 → FFmpeg -1", () => {
		expect(toFFmpegBrightness(-100)).toBeCloseTo(-1);
	});

	it("UI +100 → FFmpeg 1", () => {
		expect(toFFmpegBrightness(100)).toBeCloseTo(1);
	});
});

describe("toFFmpegContrast", () => {
	it("UI 0 → FFmpeg 1 (기본값)", () => {
		expect(toFFmpegContrast(0)).toBeCloseTo(1);
	});

	it("UI -100 → FFmpeg 0", () => {
		expect(toFFmpegContrast(-100)).toBeCloseTo(0);
	});

	it("UI +100 → FFmpeg 2", () => {
		expect(toFFmpegContrast(100)).toBeCloseTo(2);
	});
});

describe("toFFmpegSaturation", () => {
	it("UI 0 → FFmpeg 1 (기본값)", () => {
		expect(toFFmpegSaturation(0)).toBeCloseTo(1);
	});

	it("UI -100 → FFmpeg 0", () => {
		expect(toFFmpegSaturation(-100)).toBeCloseTo(0);
	});

	it("UI +100 → FFmpeg 2", () => {
		expect(toFFmpegSaturation(100)).toBeCloseTo(2);
	});
});

describe("buildEqFilterString", () => {
	it("기본값이면 null을 반환한다", () => {
		const filter: ClipFilter = { brightness: 0, contrast: 0, saturation: 0 };
		expect(buildEqFilterString(filter)).toBeNull();
	});

	it("밝기만 변경된 경우 eq 문자열을 생성한다", () => {
		const filter: ClipFilter = { brightness: 50, contrast: 0, saturation: 0 };
		const result = buildEqFilterString(filter);
		expect(result).toContain("eq=");
		expect(result).toContain("brightness=0.5000");
		expect(result).toContain("contrast=1.0000");
		expect(result).toContain("saturation=1.0000");
	});

	it("모든 값이 변경된 경우 eq 문자열을 생성한다", () => {
		const filter: ClipFilter = { brightness: 50, contrast: -50, saturation: 100 };
		const result = buildEqFilterString(filter);
		expect(result).toContain("eq=");
		expect(result).toContain("brightness=0.5000");
		expect(result).toContain("contrast=0.5000");
		expect(result).toContain("saturation=2.0000");
	});
});
