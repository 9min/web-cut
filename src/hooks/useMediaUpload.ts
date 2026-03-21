import { useCallback, useState } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import type { MediaType } from "@/types/media";
import { extractMetadata } from "@/utils/extractMetadata";
import { generateId } from "@/utils/generateId";
import { sanitizeFileName } from "@/utils/sanitizeFileName";
import { validateMediaFile } from "@/utils/validateMediaFile";

const CONCURRENCY = 3;

function getMediaType(mimeType: string): MediaType {
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "image";
}

export interface UploadError {
	id: string;
	message: string;
}

interface UseMediaUploadReturn {
	uploadFiles: (files: File[]) => Promise<void>;
	errors: UploadError[];
	clearErrors: () => void;
}

/** 동시성을 제한하여 비동기 작업을 처리한다 */
async function processQueue<T>(
	items: T[],
	concurrency: number,
	fn: (item: T) => Promise<void>,
): Promise<void> {
	let index = 0;

	async function next(): Promise<void> {
		while (index < items.length) {
			const current = index++;
			const item = items[current];
			if (item) await fn(item);
		}
	}

	const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
	await Promise.all(workers);
}

export function useMediaUpload(): UseMediaUploadReturn {
	const [errors, setErrors] = useState<UploadError[]>([]);
	const addAsset = useMediaStore((s) => s.addAsset);
	const updateAsset = useMediaStore((s) => s.updateAsset);

	const uploadFiles = useCallback(
		async (files: File[]) => {
			const newErrors: UploadError[] = [];

			// 검증 통과한 파일과 실패한 파일 분리
			const validFiles: { file: File; id: string }[] = [];

			for (const file of files) {
				const validation = validateMediaFile(file);
				if (!validation.valid) {
					newErrors.push({
						id: generateId(),
						message: `${file.name}: ${validation.error}`,
					});
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

				validFiles.push({ file, id });
			}

			// 메타데이터 추출을 CONCURRENCY개씩 병렬 처리
			await processQueue(validFiles, CONCURRENCY, async ({ file, id }) => {
				try {
					const type = getMediaType(file.type);
					const metadata = await extractMetadata(file, type);
					updateAsset(id, { metadata, status: "ready" });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
					updateAsset(id, { status: "error", errorMessage });
				}
			});

			setErrors(newErrors);
		},
		[addAsset, updateAsset],
	);

	const clearErrors = useCallback(() => {
		setErrors([]);
	}, []);

	return { uploadFiles, errors, clearErrors };
}
