import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaUploader } from "@/components/media-pool/MediaUploader";

describe("MediaUploader", () => {
	it("드래그 앤 드롭 영역을 렌더링한다", () => {
		render(<MediaUploader onFiles={vi.fn()} />);
		expect(screen.getByText(/파일을 드래그하거나/)).toBeInTheDocument();
	});

	it("파일 선택 버튼을 렌더링한다", () => {
		render(<MediaUploader onFiles={vi.fn()} />);
		expect(screen.getByRole("button", { name: /파일 선택/ })).toBeInTheDocument();
	});

	it("파일 선택 시 onFiles를 호출한다", async () => {
		const onFiles = vi.fn();
		render(<MediaUploader onFiles={onFiles} />);

		const file = new File(["content"], "video.mp4", { type: "video/mp4" });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await userEvent.upload(input, file);

		expect(onFiles).toHaveBeenCalledWith([file]);
	});
});
