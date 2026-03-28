import type { Locator, Page } from "@playwright/test";
import { MediaPoolSection } from "./MediaPoolSection";
import { PreviewSection } from "./PreviewSection";
import { TimelineSection } from "./TimelineSection";

export class EditorPage {
	readonly mediaPool: MediaPoolSection;
	readonly preview: PreviewSection;
	readonly timeline: TimelineSection;
	readonly layout: Locator;
	readonly header: Locator;

	constructor(private readonly page: Page) {
		this.layout = page.getByTestId("editor-layout");
		this.header = page.getByTestId("header");
		this.mediaPool = new MediaPoolSection(page);
		this.preview = new PreviewSection(page);
		this.timeline = new TimelineSection(page);
	}

	async goto() {
		await this.page.goto("/");
		await this.layout.waitFor({ state: "visible" });
	}
}
