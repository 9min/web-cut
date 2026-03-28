import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

const SAMPLE_IMAGE = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/sample-image.png");

test.describe("미디어 업로드", () => {
	test("이미지 파일을 업로드하면 미디어풀에 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await editor.mediaPool.uploadFile(SAMPLE_IMAGE);

		await expect(editor.mediaPool.getMediaItem("sample-image.png")).toBeVisible();
	});

	test("미디어 업로드 전에는 안내 문구가 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.mediaPool.container.getByText("미디어 파일을 추가해주세요")).toBeVisible();
	});

	test("업로드된 미디어를 삭제할 수 있다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await editor.mediaPool.uploadFile(SAMPLE_IMAGE);
		await expect(editor.mediaPool.getMediaItem("sample-image.png")).toBeVisible();

		await editor.mediaPool.container.getByRole("button", { name: "삭제", exact: true }).click();
		await expect(editor.mediaPool.getMediaItem("sample-image.png")).not.toBeVisible();
	});
});
