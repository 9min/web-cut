import type { MediaAsset, MediaType } from "@/types/media";
import { generateId } from "@/utils/generateId";

export function createTestMediaAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
	return {
		id: generateId(),
		name: "test-video.mp4",
		originalName: "test-video.mp4",
		type: "video",
		mimeType: "video/mp4",
		size: 1024 * 1024,
		objectUrl: "blob:http://localhost/test-url",
		thumbnailUrl: null,
		metadata: null,
		status: "ready",
		addedAt: Date.now(),
		...overrides,
	};
}

export function createMockFile(name = "test.mp4", size = 1024, type = "video/mp4"): File {
	const file = new File([""], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

export function getMediaTypeFromMime(mimeType: string): MediaType {
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "image";
}
