import { Minus, Plus, Scissors, Trash2 } from "lucide-react";
import { DEFAULT_ZOOM } from "@/constants/timeline";

interface TimelineToolbarProps {
	onAddTrack: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onSplit: () => void;
	onDelete: () => void;
	zoom: number;
	canSplit: boolean;
	canDelete: boolean;
}

export function TimelineToolbar({
	onAddTrack,
	onZoomIn,
	onZoomOut,
	onSplit,
	onDelete,
	zoom,
	canSplit,
	canDelete,
}: TimelineToolbarProps) {
	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={onAddTrack}
				className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
				aria-label="트랙 추가"
			>
				+ 트랙 추가
			</button>
			<div className="flex items-center gap-1 border-l border-gray-700 pl-2">
				<button
					type="button"
					onClick={onSplit}
					disabled={!canSplit}
					className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
					aria-label="분할"
				>
					<Scissors size={14} />
				</button>
				<button
					type="button"
					onClick={onDelete}
					disabled={!canDelete}
					className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
					aria-label="삭제"
				>
					<Trash2 size={14} />
				</button>
			</div>
			<div className="flex items-center gap-1 border-l border-gray-700 pl-2">
				<button
					type="button"
					onClick={onZoomOut}
					className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
					aria-label="축소"
				>
					<Minus size={14} />
				</button>
				<span className="w-10 text-center text-xs text-gray-400">
					{Math.round((zoom / DEFAULT_ZOOM) * 100)}%
				</span>
				<button
					type="button"
					onClick={onZoomIn}
					className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
					aria-label="확대"
				>
					<Plus size={14} />
				</button>
			</div>
		</div>
	);
}
