import { describe, expect, it } from "vitest";
import type { TextOverlay } from "@/types/textOverlay";
import { buildDrawtextFilter } from "@/utils/textOverlayExport";

function makeOverlay(overrides: Partial<TextOverlay> = {}): TextOverlay {
	return {
		content: "테스트 텍스트",
		x: 50,
		y: 80,
		fontSize: 36,
		fontColor: "#FFFFFF",
		opacity: 100,
		...overrides,
	};
}

describe("buildDrawtextFilter", () => {
	it("기본 drawtext 필터 문자열을 생성한다", () => {
		const result = buildDrawtextFilter(makeOverlay(), 1920, 1080);
		expect(result).not.toBeNull();
		expect(result).toContain("drawtext=");
		expect(result).toContain("fontsize=36");
		expect(result).toContain("fontcolor=#FFFFFF");
	});

	it("content가 빈 문자열이면 null을 반환한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ content: "" }), 1920, 1080);
		expect(result).toBeNull();
	});

	it("X 위치를 anchor 0.5 기준으로 계산한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ x: 50 }), 1920, 1080);
		expect(result).toContain("x=(w*0.50-tw/2)");
	});

	it("다른 X 위치도 동일한 공식을 사용한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ x: 30 }), 1920, 1080);
		expect(result).toContain("x=(w*0.30-tw/2)");
	});

	it("Y 위치를 계산한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ y: 80 }), 1920, 1080);
		expect(result).toContain("y=(h*0.80)");
	});

	it("불투명도를 변환한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ opacity: 80 }), 1920, 1080);
		expect(result).toContain("@0.80");
	});

	it("불투명도 100은 @1.00으로 변환한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ opacity: 100 }), 1920, 1080);
		expect(result).toContain("@1.00");
	});

	it("특수문자를 이스케이프한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ content: "시간: 12:00" }), 1920, 1080);
		expect(result).toContain("시간\\: 12\\:00");
	});

	it("HTML 태그를 제거한다", () => {
		const result = buildDrawtextFilter(makeOverlay({ content: "<b>텍스트</b>" }), 1920, 1080);
		expect(result).not.toContain("<b>");
		expect(result).toContain("텍스트");
	});

	it("startTime/endTime이 주어지면 enable=between을 추가한다", () => {
		const result = buildDrawtextFilter(makeOverlay(), 1920, 1080, 2, 5);
		expect(result).toContain("enable='between(t,2.000,5.000)'");
	});

	it("startTime/endTime이 없으면 enable을 추가하지 않는다", () => {
		const result = buildDrawtextFilter(makeOverlay(), 1920, 1080);
		expect(result).not.toContain("enable");
	});
});
