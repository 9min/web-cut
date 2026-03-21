import { Minus, Music, Plus, SplitSquareHorizontal, Trash2, Type } from "lucide-react";
import { DEFAULT_ZOOM } from "@/constants/timeline";

interface TimelineToolbarProps {
	onAddTrack: () => void;
	onAddTextTrack: () => void;
	onAddAudioTrack: () => void;
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
	onAddTextTrack,
	onAddAudioTrack,
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
			<button
				type="button"
				onClick={onAddTextTrack}
				className="flex items-center gap-1 rounded bg-amber-700 px-2 py-1 text-xs text-white hover:bg-amber-600"
				aria-label="텍스트 트랙 추가"
				data-testid="add-text-track-button"
			>
				<Type size={12} />
				텍스트 트랙
			</button>
			<button
				type="button"
				onClick={onAddAudioTrack}
				className="flex items-center gap-1 rounded bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-600"
				aria-label="오디오 트랙 추가"
				data-testid="add-audio-track-button"
			>
				<Music size={12} />
				오디오 트랙
			</button>
			<div className="flex items-center gap-1 border-l border-gray-700 pl-2">
				<button
					type="button"
					onClick={onSplit}
					disabled={!canSplit}
					className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 md:p-1"
					aria-label="분할"
					title="분할 (⌘S)"
				>
					<SplitSquareHorizontal size={14} />
				</button>
				<button
					type="button"
					onClick={onDelete}
					disabled={!canDelete}
					className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 md:p-1"
					aria-label="삭제"
					title="삭제 (Delete/Backspace)"
				>
					<Trash2 size={14} />
				</button>
			</div>
			<div className="flex items-center gap-1 border-l border-gray-700 pl-2">
				<button
					type="button"
					onClick={onZoomOut}
					className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white md:p-1"
					aria-label="축소"
					title="축소"
				>
					<Minus size={14} />
				</button>
				<span className="w-10 text-center text-xs text-gray-400">
					{Math.round((zoom / DEFAULT_ZOOM) * 100)}%
				</span>
				<button
					type="button"
					onClick={onZoomIn}
					className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white md:p-1"
					aria-label="확대"
					title="확대"
				>
					<Plus size={14} />
				</button>
			</div>
		</div>
	);
}
