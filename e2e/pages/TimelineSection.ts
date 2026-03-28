import type { Locator, Page } from "@playwright/test";

export class TimelineSection {
	readonly container: Locator;
	readonly playbackControls: Locator;
	readonly playButton: Locator;
	readonly playhead: Locator;
	readonly timeRuler: Locator;

	constructor(private readonly page: Page) {
		this.container = page.getByTestId("timeline");
		this.playbackControls = page.getByTestId("playback-controls");
		this.playButton = page.getByTestId("play-button");
		this.playhead = page.getByTestId("playhead");
		this.timeRuler = page.getByTestId("time-ruler");
	}

	getClipBlock(index = 0) {
		return this.page.getByTestId("clip-block").nth(index);
	}

	getTrackRow(index = 0) {
		return this.page.getByTestId("track-row").nth(index);
	}
}
