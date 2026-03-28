import type { Locator, Page } from "@playwright/test";

export class MediaPoolSection {
	readonly container: Locator;
	readonly uploader: Locator;
	readonly fileInput: Locator;

	constructor(page: Page) {
		this.container = page.getByTestId("media-pool");
		this.uploader = page.getByTestId("media-uploader");
		this.fileInput = page.locator('[data-testid="media-uploader"] input[type="file"]');
	}

	async uploadFile(filePath: string) {
		await this.fileInput.setInputFiles(filePath);
	}

	getMediaItem(name: string) {
		return this.container.getByText(name);
	}
}
