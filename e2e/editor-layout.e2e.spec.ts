import { expect, test } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

test.describe("편집기 레이아웃", () => {
	test("편집기 주요 영역이 정상 렌더링된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.layout).toBeVisible();
		await expect(editor.header).toBeVisible();
		await expect(editor.mediaPool.container).toBeVisible();
		await expect(editor.preview.container).toBeVisible();
		await expect(editor.timeline.container).toBeVisible();
	});

	test("페이지 타이틀에 WebCut이 포함된다", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/WebCut/);
	});

	test("헤더에 프로젝트 이름과 주요 버튼이 표시된다", async ({ page }) => {
		const editor = new EditorPage(page);
		await editor.goto();

		await expect(editor.header.getByText("WebCut")).toBeVisible();
		await expect(editor.header.getByRole("button", { name: "프로젝트 저장" })).toBeVisible();
		await expect(editor.header.getByRole("button", { name: "프로젝트 불러오기" })).toBeVisible();
		await expect(editor.header.getByText("내보내기")).toBeVisible();
	});
});
