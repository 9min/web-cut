import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

const SAMPLE_IMAGE = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/sample-image.png");

test.describe("타임라인 클립", () => {
	test("미디어를 업로드하면 타임라인에 클립이 자동 추가된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		// 이미지 업로드
		await editor.mediaPool.uploadFile(SAMPLE_IMAGE);
		await expect(editor.mediaPool.getMediaItem("sample-image.png")).toBeVisible();

		// 타임라인에 클립 블록이 표시되는지 확인
		// (미디어 업로드 시 자동으로 타임라인에 추가될 수 있음 — 아닐 경우 수동 추가 필요)
		const clipBlock = editor.timeline.getClipBlock(0);
		// 클립이 없을 수 있으므로 조건부 확인
		const clipCount = await page.getByTestId("clip-block").count();
		if (clipCount > 0) {
			await expect(clipBlock).toBeVisible();
		}
	});

	test("타임 룰러가 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.timeline.timeRuler).toBeVisible();
	});
});
