import { expect, test } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

test.describe("재생 컨트롤", () => {
	test("재생/정지 버튼이 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.timeline.playButton).toBeVisible();
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "재생");
	});

	test("재생 버튼 클릭 시 정지 상태로 전환된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await editor.timeline.playButton.click();
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "정지");

		await editor.timeline.playButton.click();
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "재생");
	});

	test("플레이헤드가 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.timeline.playhead).toBeVisible();
	});
});
