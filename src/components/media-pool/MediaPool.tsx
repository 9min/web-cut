import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useMediaStore } from "@/stores/useMediaStore";
import { MediaItem } from "./MediaItem";
import { MediaUploader } from "./MediaUploader";

export function MediaPool() {
	const assets = useMediaStore((s) => s.assets);
	const removeAsset = useMediaStore((s) => s.removeAsset);
	const { uploadFiles, errors, clearErrors } = useMediaUpload();

	return (
		<div className="flex h-full flex-col gap-2 p-3">
			<h2 className="text-sm font-semibold text-white">미디어</h2>
			<MediaUploader onFiles={uploadFiles} />

			{errors.length > 0 && (
				<div className="rounded bg-red-900/30 p-2">
					{errors.map((error) => (
						<p key={error} className="text-xs text-red-400">
							{error}
						</p>
					))}
					<button
						type="button"
						onClick={clearErrors}
						className="mt-1 text-xs text-gray-400 underline"
					>
						닫기
					</button>
				</div>
			)}

			{assets.length === 0 ? (
				<p className="py-4 text-center text-xs text-gray-500">미디어 파일을 추가해주세요</p>
			) : (
				<div className="flex-1 space-y-1 overflow-y-auto">
					{assets.map((asset) => (
						<MediaItem key={asset.id} asset={asset} onRemove={removeAsset} />
					))}
				</div>
			)}
		</div>
	);
}
