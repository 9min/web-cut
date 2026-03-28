import { expect, test } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

test.describe("키보드 단축키", () => {
	test("Space 키로 재생/정지를 토글할 수 있다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		// 초기 상태: 정지
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "재생");

		// Space 키로 재생
		await page.keyboard.press("Space");
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "정지");

		// Space 키로 정지
		await page.keyboard.press("Space");
		await expect(editor.timeline.playButton).toHaveAttribute("aria-label", "재생");
	});

	test("? 키로 단축키 도움말을 열고 닫을 수 있다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		// ? 키로 도움말 열기
		await page.keyboard.press("Shift+/");
		await expect(page.getByTestId("shortcut-help-overlay")).toBeVisible();

		// 닫기 버튼으로 닫기
		await page.getByTestId("shortcut-help-close").click();
		await expect(page.getByTestId("shortcut-help-overlay")).not.toBeVisible();
	});
});
