import { memo, useCallback, useEffect, useRef } from "react";
import { useClipboardStore } from "@/stores/useClipboardStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";

interface ClipContextMenuProps {
	clipId: string;
	trackId: string;
	x: number;
	y: number;
	onClose: () => void;
}

export const ClipContextMenu = memo(function ClipContextMenu({
	clipId,
	trackId,
	x,
	y,
	onClose,
}: ClipContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	const handleCopy = useCallback(() => {
		const track = useTimelineStore.getState().tracks.find((t) => t.id === trackId);
		const clip = track?.clips.find((c) => c.id === clipId);
		if (clip) {
			useClipboardStore.getState().copy([clip]);
		}
		onClose();
	}, [clipId, trackId, onClose]);

	const handlePaste = useCallback(() => {
		const clipboard = useClipboardStore.getState();
		if (!clipboard.hasItems()) return;

		const currentTime = usePlaybackStore.getState().currentTime;
		const pasted = clipboard.paste(currentTime);
		if (pasted.length === 0) return;

		useHistoryStore.getState().pushSnapshot("클립 붙여넣기");
		const { addClip } = useTimelineStore.getState();
		for (const clip of pasted) {
			addClip(trackId, { ...clip, trackId });
		}
		onClose();
	}, [trackId, onClose]);

	const handleSplit = useCallback(() => {
		const currentTime = usePlaybackStore.getState().currentTime;
		useHistoryStore.getState().pushSnapshot("클립 분할");
		useTimelineStore.getState().splitClip(trackId, clipId, currentTime);
		onClose();
	}, [clipId, trackId, onClose]);

	const handleDelete = useCallback(() => {
		useHistoryStore.getState().pushSnapshot("클립 삭제");
		useTimelineStore.getState().removeClip(trackId, clipId);
		onClose();
	}, [clipId, trackId, onClose]);

	const handleRippleDelete = useCallback(() => {
		useHistoryStore.getState().pushSnapshot("리플 삭제");
		useTimelineStore.getState().rippleDelete(trackId, clipId);
		onClose();
	}, [clipId, trackId, onClose]);

	const hasClipboard = useClipboardStore((s) => s.hasItems());

	const menuItems = [
		{ label: "복사", action: handleCopy },
		{ label: "붙여넣기", action: handlePaste, disabled: !hasClipboard },
		{ label: "분할", action: handleSplit },
		{ label: "삭제", action: handleDelete },
		{ label: "리플 삭제", action: handleRippleDelete },
	];

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-32 rounded border border-gray-700 bg-gray-800 py-1 shadow-lg"
			style={{ left: x, top: y }}
		>
			{menuItems.map((item) => (
				<button
					key={item.label}
					type="button"
					onClick={item.action}
					disabled={item.disabled}
					className="flex w-full px-3 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-700 disabled:text-gray-500"
				>
					{item.label}
				</button>
			))}
		</div>
	);
});
