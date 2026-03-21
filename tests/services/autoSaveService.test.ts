import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
	AUTO_SAVE_DB_NAME,
	AUTO_SAVE_STORE_NAME,
	clearAutoSave,
	loadFromIndexedDB,
	openDB,
	saveToIndexedDB,
} from "@/services/autoSaveService";

describe("autoSaveService", () => {
	beforeEach(async () => {
		// 테스트 간 DB 초기화
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			if (db.name) {
				indexedDB.deleteDatabase(db.name);
			}
		}
	});

	describe("openDB", () => {
		it("IndexedDB를 열고 object store를 생성한다", async () => {
			const db = await openDB();
			expect(db.name).toBe(AUTO_SAVE_DB_NAME);
			expect(db.objectStoreNames.contains(AUTO_SAVE_STORE_NAME)).toBe(true);
			db.close();
		});
	});

	describe("saveToIndexedDB", () => {
		it("프로젝트 데이터를 IndexedDB에 저장한다", async () => {
			const testData = { version: "1.0", project: { name: "테스트" } };
			await saveToIndexedDB(testData);

			const loaded = await loadFromIndexedDB();
			expect(loaded).toEqual(testData);
		});
	});

	describe("loadFromIndexedDB", () => {
		it("저장된 데이터가 없으면 null을 반환한다", async () => {
			const loaded = await loadFromIndexedDB();
			expect(loaded).toBeNull();
		});

		it("저장된 데이터를 정상적으로 반환한다", async () => {
			const testData = { version: "1.0", tracks: [{ id: "1" }] };
			await saveToIndexedDB(testData);

			const loaded = await loadFromIndexedDB();
			expect(loaded).toEqual(testData);
		});
	});

	describe("clearAutoSave", () => {
		it("저장된 자동 저장 데이터를 삭제한다", async () => {
			await saveToIndexedDB({ test: true });
			await clearAutoSave();

			const loaded = await loadFromIndexedDB();
			expect(loaded).toBeNull();
		});
	});
});
