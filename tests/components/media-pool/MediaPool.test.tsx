import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MediaPool } from "@/components/media-pool/MediaPool";
import { useMediaStore } from "@/stores/useMediaStore";
import { createTestMediaAsset } from "../../factories/mediaFactory";

describe("MediaPool", () => {
	beforeEach(() => {
		useMediaStore.getState().reset();
	});

	it("에셋이 없으면 빈 상태 메시지를 표시한다", () => {
		render(<MediaPool />);
		expect(screen.getByText(/미디어 파일/)).toBeInTheDocument();
	});

	it("에셋이 있으면 목록을 표시한다", () => {
		const asset = createTestMediaAsset({ name: "test-clip.mp4" });
		useMediaStore.getState().addAsset(asset);

		render(<MediaPool />);
		expect(screen.getByText("test-clip.mp4")).toBeInTheDocument();
	});

	it("업로더를 표시한다", () => {
		render(<MediaPool />);
		expect(screen.getByText(/파일을 드래그하거나/)).toBeInTheDocument();
	});
});
