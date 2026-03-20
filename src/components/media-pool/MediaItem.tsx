import type { MediaAsset } from "@/types/media";
import { formatDuration } from "@/utils/formatDuration";
import { formatFileSize } from "@/utils/formatFileSize";

interface MediaItemProps {
	asset: MediaAsset;
	onRemove: (id: string) => void;
}

function getDurationText(asset: MediaAsset): string | null {
	if (!asset.metadata) return null;
	if ("duration" in asset.metadata && asset.metadata.duration > 0) {
		return formatDuration(asset.metadata.duration);
	}
	return null;
}

function getTypeIcon(type: MediaAsset["type"]): string {
	switch (type) {
		case "video":
			return "\u{1F3AC}";
		case "audio":
			return "\u{1F3B5}";
		case "image":
			return "\u{1F5BC}\uFE0F";
	}
}

export function MediaItem({ asset, onRemove }: MediaItemProps) {
	const duration = getDurationText(asset);

	return (
		<div className="flex items-center gap-2 rounded p-2 hover:bg-gray-800">
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-700">
				{asset.thumbnailUrl ? (
					<img
						src={asset.thumbnailUrl}
						alt={asset.name}
						className="h-full w-full rounded object-cover"
					/>
				) : (
					<span className="text-lg">{getTypeIcon(asset.type)}</span>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-xs text-white">{asset.name}</p>
				<div className="flex gap-2 text-[10px] text-gray-500">
					<span>{formatFileSize(asset.size)}</span>
					{duration && <span>{duration}</span>}
					{asset.status === "loading" && <span>로딩 중...</span>}
					{asset.status === "error" && <span className="text-red-400">오류 발생</span>}
				</div>
			</div>
			<button
				type="button"
				onClick={() => onRemove(asset.id)}
				className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-white"
				aria-label="삭제"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<title>삭제</title>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>
	);
}
