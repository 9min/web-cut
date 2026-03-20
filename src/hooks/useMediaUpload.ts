import { useCallback, useState } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import type { MediaType } from "@/types/media";
import { extractMetadata } from "@/utils/extractMetadata";
import { generateId } from "@/utils/generateId";
import { sanitizeFileName } from "@/utils/sanitizeFileName";
import { validateMediaFile } from "@/utils/validateMediaFile";

function getMediaType(mimeType: string): MediaType {
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "image";
}

interface UseMediaUploadReturn {
	uploadFiles: (files: File[]) => Promise<void>;
	errors: string[];
	clearErrors: () => void;
}

export function useMediaUpload(): UseMediaUploadReturn {
	const [errors, setErrors] = useState<string[]>([]);
	const addAsset = useMediaStore((s) => s.addAsset);
	const updateAsset = useMediaStore((s) => s.updateAsset);

	const uploadFiles = useCallback(
		async (files: File[]) => {
			const newErrors: string[] = [];

			for (const file of files) {
				const validation = validateMediaFile(file);
				if (!validation.valid) {
					newErrors.push(`${file.name}: ${validation.error}`);
					continue;
				}

				const id = generateId();
				const type = getMediaType(file.type);
				const objectUrl = URL.createObjectURL(file);
				const thumbnailUrl = type === "image" ? objectUrl : null;

				addAsset({
					id,
					name: sanitizeFileName(file.name),
					originalName: file.name,
					type,
					mimeType: file.type,
					size: file.size,
					objectUrl,
					thumbnailUrl,
					metadata: null,
					status: "loading",
					addedAt: Date.now(),
				});

				try {
					const metadata = await extractMetadata(file, type);
					updateAsset(id, { metadata, status: "ready" });
				} catch {
					updateAsset(id, { status: "error" });
				}
			}

			setErrors(newErrors);
		},
		[addAsset, updateAsset],
	);

	const clearErrors = useCallback(() => {
		setErrors([]);
	}, []);

	return { uploadFiles, errors, clearErrors };
}
