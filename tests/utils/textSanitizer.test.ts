import { describe, expect, it } from "vitest";
import { escapeForDrawtext, isValidHexColor, sanitizeTextInput } from "@/utils/textSanitizer";

describe("sanitizeTextInput", () => {
	it("HTML 태그를 제거한다", () => {
		expect(sanitizeTextInput("<script>alert(1)</script>", 200)).toBe("alert(1)");
	});

	it("중첩 HTML 태그를 제거한다", () => {
		expect(sanitizeTextInput("<b><i>텍스트</i></b>", 200)).toBe("텍스트");
	});

	it("제어 문자를 제거한다", () => {
		expect(sanitizeTextInput("안녕\x00하세\x01요", 200)).toBe("안녕하세요");
	});

	it("최대 길이로 잘라낸다", () => {
		const long = "가".repeat(300);
		expect(sanitizeTextInput(long, 200)).toHaveLength(200);
	});

	it("일반 텍스트는 그대로 반환한다", () => {
		expect(sanitizeTextInput("안녕하세요 Hello 123", 200)).toBe("안녕하세요 Hello 123");
	});

	it("빈 문자열을 처리한다", () => {
		expect(sanitizeTextInput("", 200)).toBe("");
	});

	it("앞뒤 공백을 유지한다", () => {
		expect(sanitizeTextInput("  텍스트  ", 200)).toBe("  텍스트  ");
	});

	it("줄바꿈 문자를 유지한다", () => {
		expect(sanitizeTextInput("줄1\n줄2", 200)).toBe("줄1\n줄2");
	});
});

describe("escapeForDrawtext", () => {
	it("콜론을 이스케이프한다", () => {
		expect(escapeForDrawtext("시간: 12:00")).toBe("시간\\: 12\\:00");
	});

	it("작은따옴표를 이스케이프한다", () => {
		expect(escapeForDrawtext("it's")).toBe("it\\'s");
	});

	it("백슬래시를 이스케이프한다", () => {
		expect(escapeForDrawtext("경로\\파일")).toBe("경로\\\\파일");
	});

	it("대괄호를 이스케이프한다", () => {
		expect(escapeForDrawtext("[태그]")).toBe("\\[태그\\]");
	});

	it("세미콜론을 이스케이프한다", () => {
		expect(escapeForDrawtext("a;b")).toBe("a\\;b");
	});

	it("일반 텍스트는 그대로 반환한다", () => {
		expect(escapeForDrawtext("안녕하세요")).toBe("안녕하세요");
	});

	it("빈 문자열을 처리한다", () => {
		expect(escapeForDrawtext("")).toBe("");
	});
});

describe("isValidHexColor", () => {
	it("#RRGGBB 형식을 유효로 판단한다", () => {
		expect(isValidHexColor("#FF0000")).toBe(true);
		expect(isValidHexColor("#ffffff")).toBe(true);
		expect(isValidHexColor("#000000")).toBe(true);
		expect(isValidHexColor("#abcdef")).toBe(true);
	});

	it("잘못된 형식을 무효로 판단한다", () => {
		expect(isValidHexColor("FF0000")).toBe(false);
		expect(isValidHexColor("#FFF")).toBe(false);
		expect(isValidHexColor("#GGGGGG")).toBe(false);
		expect(isValidHexColor("")).toBe(false);
		expect(isValidHexColor("#12345")).toBe(false);
		expect(isValidHexColor("#1234567")).toBe(false);
	});
});
