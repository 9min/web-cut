import { useCallback } from "react";
import {
	TEXT_FONT_SIZE_MAX,
	TEXT_FONT_SIZE_MIN,
	TEXT_FONT_SIZE_STEP,
	TEXT_MAX_LENGTH,
	TEXT_OPACITY_MAX,
	TEXT_OPACITY_MIN,
	TEXT_OPACITY_STEP,
	TEXT_POSITION_MAX,
	TEXT_POSITION_MIN,
	TEXT_POSITION_STEP,
} from "@/constants/textOverlay";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { TextOverlay } from "@/types/textOverlay";

interface TextOverlayPanelProps {
	trackId: string;
	textClipId: string;
	overlay: TextOverlay;
	startTime: number;
	duration: number;
}

export function TextOverlayPanel({
	trackId,
	textClipId,
	overlay,
	startTime,
	duration,
}: TextOverlayPanelProps) {
	const { updateTextClipOverlay, updateTextClip, removeTextClip } = useTimelineStore();

	const handleContentChange = useCallback(
		(value: string) => {
			updateTextClipOverlay(trackId, textClipId, { content: value });
		},
		[trackId, textClipId, updateTextClipOverlay],
	);

	const handleRemove = useCallback(() => {
		removeTextClip(trackId, textClipId);
	}, [trackId, textClipId, removeTextClip]);

	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-gray-300">텍스트 오버레이</div>

			<div>
				<div className="mb-1 text-xs text-gray-400">텍스트</div>
				<textarea
					value={overlay.content}
					onChange={(e) => handleContentChange(e.target.value)}
					maxLength={TEXT_MAX_LENGTH}
					placeholder="텍스트를 입력하세요"
					className="w-full resize-none rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
					rows={2}
					data-testid="text-overlay-content"
				/>
				<div className="text-right text-[10px] text-gray-500">
					{overlay.content.length}/{TEXT_MAX_LENGTH}
				</div>
			</div>

			<div>
				<div className="mb-1 text-xs text-gray-400">시작 시간 (초)</div>
				<input
					type="number"
					min={0}
					step={0.1}
					value={startTime}
					onChange={(e) =>
						updateTextClip(trackId, textClipId, { startTime: Math.max(0, Number(e.target.value)) })
					}
					className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
					data-testid="text-clip-startTime"
				/>
			</div>

			<div>
				<div className="mb-1 text-xs text-gray-400">길이 (초)</div>
				<input
					type="number"
					min={0.5}
					step={0.1}
					value={duration}
					onChange={(e) =>
						updateTextClip(trackId, textClipId, { duration: Math.max(0.5, Number(e.target.value)) })
					}
					className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
					data-testid="text-clip-duration"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">X 위치</span>
					<span className="text-xs tabular-nums text-gray-400">{overlay.x}%</span>
				</div>
				<input
					type="range"
					min={TEXT_POSITION_MIN}
					max={TEXT_POSITION_MAX}
					step={TEXT_POSITION_STEP}
					value={overlay.x}
					onChange={(e) =>
						updateTextClipOverlay(trackId, textClipId, { x: Number(e.target.value) })
					}
					className="w-full"
					data-testid="text-overlay-x"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">Y 위치</span>
					<span className="text-xs tabular-nums text-gray-400">{overlay.y}%</span>
				</div>
				<input
					type="range"
					min={TEXT_POSITION_MIN}
					max={TEXT_POSITION_MAX}
					step={TEXT_POSITION_STEP}
					value={overlay.y}
					onChange={(e) =>
						updateTextClipOverlay(trackId, textClipId, { y: Number(e.target.value) })
					}
					className="w-full"
					data-testid="text-overlay-y"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">폰트 크기</span>
					<span className="text-xs tabular-nums text-gray-400">{overlay.fontSize}</span>
				</div>
				<input
					type="range"
					min={TEXT_FONT_SIZE_MIN}
					max={TEXT_FONT_SIZE_MAX}
					step={TEXT_FONT_SIZE_STEP}
					value={overlay.fontSize}
					onChange={(e) =>
						updateTextClipOverlay(trackId, textClipId, { fontSize: Number(e.target.value) })
					}
					className="w-full"
					data-testid="text-overlay-fontSize"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">폰트 색상</span>
					<span className="text-xs tabular-nums text-gray-400">{overlay.fontColor}</span>
				</div>
				<input
					type="color"
					value={overlay.fontColor}
					onChange={(e) =>
						updateTextClipOverlay(trackId, textClipId, { fontColor: e.target.value })
					}
					className="h-8 w-full cursor-pointer"
					data-testid="text-overlay-fontColor"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">불투명도</span>
					<span className="text-xs tabular-nums text-gray-400">{overlay.opacity}%</span>
				</div>
				<input
					type="range"
					min={TEXT_OPACITY_MIN}
					max={TEXT_OPACITY_MAX}
					step={TEXT_OPACITY_STEP}
					value={overlay.opacity}
					onChange={(e) =>
						updateTextClipOverlay(trackId, textClipId, { opacity: Number(e.target.value) })
					}
					className="w-full"
					data-testid="text-overlay-opacity"
				/>
			</div>

			<button
				type="button"
				className="w-full rounded bg-red-700 px-2 py-1 text-xs text-gray-200 hover:bg-red-600"
				onClick={handleRemove}
				data-testid="text-overlay-remove"
			>
				텍스트 삭제
			</button>
		</div>
	);
}
