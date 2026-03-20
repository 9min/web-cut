import { Minus, Plus } from "lucide-react";

interface TimelineToolbarProps {
	onAddTrack: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	zoom: number;
}

export function TimelineToolbar({ onAddTrack, onZoomIn, onZoomOut, zoom }: TimelineToolbarProps) {
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
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onZoomOut}
					className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
					aria-label="축소"
				>
					<Minus size={14} />
				</button>
				<span className="w-10 text-center text-xs text-gray-400">{zoom}%</span>
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
