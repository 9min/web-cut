import { describe, expect, it } from "vitest";
import { generateId } from "@/utils/generateId";

describe("generateId", () => {
	it("UUID 형식의 문자열을 반환한다", () => {
		const id = generateId();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it("호출할 때마다 고유한 값을 반환한다", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId()));
		expect(ids.size).toBe(100);
	});
});
