import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaItem } from "@/components/media-pool/MediaItem";
import { createTestMediaAsset } from "../../factories/mediaFactory";

describe("MediaItem", () => {
	it("파일명을 표시한다", () => {
		const asset = createTestMediaAsset({ name: "my-video.mp4" });
		render(<MediaItem asset={asset} onRemove={vi.fn()} />);
		expect(screen.getByText("my-video.mp4")).toBeInTheDocument();
	});

	it("파일 크기를 표시한다", () => {
		const asset = createTestMediaAsset({ size: 1024 * 1024 });
		render(<MediaItem asset={asset} onRemove={vi.fn()} />);
		expect(screen.getByText("1.0 MB")).toBeInTheDocument();
	});

	it("삭제 버튼 클릭 시 onRemove를 호출한다", async () => {
		const onRemove = vi.fn();
		const asset = createTestMediaAsset();
		render(<MediaItem asset={asset} onRemove={onRemove} />);

		await userEvent.click(screen.getByRole("button", { name: /삭제/ }));
		expect(onRemove).toHaveBeenCalledWith(asset.id);
	});

	it("로딩 상태를 표시한다", () => {
		const asset = createTestMediaAsset({ status: "loading" });
		render(<MediaItem asset={asset} onRemove={vi.fn()} />);
		expect(screen.getByText("로딩 중...")).toBeInTheDocument();
	});

	it("에러 상태를 표시한다", () => {
		const asset = createTestMediaAsset({ status: "error" });
		render(<MediaItem asset={asset} onRemove={vi.fn()} />);
		expect(screen.getByText("오류 발생")).toBeInTheDocument();
	});

	it("이미지 에셋은 썸네일을 표시한다", () => {
		const asset = createTestMediaAsset({
			type: "image",
			thumbnailUrl: "blob:http://localhost/thumb",
		});
		render(<MediaItem asset={asset} onRemove={vi.fn()} />);
		expect(screen.getByRole("img")).toBeInTheDocument();
	});
});
