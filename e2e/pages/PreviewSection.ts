import type { Locator, Page } from "@playwright/test";

export class PreviewSection {
	readonly container: Locator;

	constructor(_page: Page) {
		this.container = _page.getByTestId("preview-panel");
	}
}
