import { useEffect } from "react";
import { DEFAULT_ZOOM } from "@/constants/timeline";
import { useClipboardStore } from "@/stores/useClipboardStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useUIStore } from "@/stores/useUIStore";
import { useZoomStore } from "@/stores/useZoomStore";

function handlePlaybackToggle(e: KeyboardEvent): void {
	e.preventDefault();
	usePlaybackStore.getState().togglePlayback();
}

function handleDeleteClip(e: KeyboardEvent): void {
	e.preventDefault();
	const selectedClipId = useTimelineStore.getState().getSelectedClipId();
	const { tracks, removeClip, removeTextClip } = useTimelineStore.getState();
	if (!selectedClipId) return;

	const track = tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
	if (track) {
		if (track.locked) return;
		useHistoryStore.getState().pushSnapshot("클립 삭제");
		removeClip(track.id, selectedClipId);
		return;
	}

	const textTrack = tracks.find((t) => t.textClips.some((tc) => tc.id === selectedClipId));
	if (textTrack) {
		if (textTrack.locked) return;
		useHistoryStore.getState().pushSnapshot("클립 삭제");
		removeTextClip(textTrack.id, selectedClipId);
	}
}

function handleCopy(e: KeyboardEvent): void {
	if (!e.ctrlKey && !e.metaKey) return;
	e.preventDefault();
	const selectedClipId = useTimelineStore.getState().getSelectedClipId();
	const { tracks } = useTimelineStore.getState();
	if (!selectedClipId) return;

	for (const track of tracks) {
		const clip = track.clips.find((c) => c.id === selectedClipId);
		if (clip) {
			useClipboardStore.getState().copy([clip]);
			return;
		}
	}
}

function handlePaste(e: KeyboardEvent): void {
	if (!e.ctrlKey && !e.metaKey) return;
	e.preventDefault();
	const clipboard = useClipboardStore.getState();
	if (!clipboard.hasItems()) return;

	const currentTime = usePlaybackStore.getState().currentTime;
	const pasted = clipboard.paste(currentTime);
	if (pasted.length === 0) return;

	const { tracks, addClip } = useTimelineStore.getState();
	// 첫 번째 비디오 트랙에 붙여넣기
	const targetTrack = tracks.find((t) => t.type === "video" || t.type === "audio");
	if (!targetTrack) return;

	useHistoryStore.getState().pushSnapshot("클립 붙여넣기");
	for (const clip of pasted) {
		addClip(targetTrack.id, { ...clip, trackId: targetTrack.id });
	}
}

function handleSplitClip(e: KeyboardEvent): void {
	if (!e.ctrlKey && !e.metaKey) return;
	e.preventDefault();
	const selectedClipId = useTimelineStore.getState().getSelectedClipId();
	const { tracks, splitClip } = useTimelineStore.getState();
	if (!selectedClipId) return;

	const track = tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
	if (!track) return;
	if (track.locked) return;

	const currentTime = usePlaybackStore.getState().currentTime;
	useHistoryStore.getState().pushSnapshot("클립 분할");
	splitClip(track.id, selectedClipId, currentTime);
}

function handleUndoRedo(e: KeyboardEvent): void {
	if (!e.ctrlKey && !e.metaKey) return;
	e.preventDefault();
	if (e.shiftKey) {
		useHistoryStore.getState().redo();
	} else {
		useHistoryStore.getState().undo();
	}
}

function handleEscape(): void {
	const { showShortcutHelp, toggleShortcutHelp } = useUIStore.getState();
	if (showShortcutHelp) {
		toggleShortcutHelp();
	} else {
		useTimelineStore.getState().selectClip(null);
	}
}

function handleFrameStep(direction: number): void {
	const { currentTime, duration } = usePlaybackStore.getState();
	const fps = useProjectStore.getState().fps;
	const newTime = Math.max(0, Math.min(duration, currentTime + direction / fps));
	usePlaybackStore.getState().seek(newTime);
}

function handleTimeSkip(seconds: number): void {
	const { currentTime, duration } = usePlaybackStore.getState();
	const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
	usePlaybackStore.getState().seek(newTime);
}

function handleJumpToStart(): void {
	usePlaybackStore.getState().seek(0);
}

function handleJumpToEnd(): void {
	const { duration } = usePlaybackStore.getState();
	usePlaybackStore.getState().seek(duration);
}

function handleZoom(action: "in" | "out" | "reset", e: KeyboardEvent): void {
	e.preventDefault();
	const { zoomIn, zoomOut, setZoom } = useZoomStore.getState();
	if (action === "in") zoomIn();
	else if (action === "out") zoomOut();
	else setZoom(DEFAULT_ZOOM);
}

export function useEditorKeyboard(): void {
	useEffect(() => {
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 단축키 매핑은 switch 구조상 복잡도가 높음
		const handleKeyDown = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement).tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;

			const hasModifier = e.ctrlKey || e.metaKey;

			switch (e.code) {
				case "Space":
					return handlePlaybackToggle(e);
				case "Delete":
				case "Backspace":
					return handleDeleteClip(e);
				case "KeyC":
					return handleCopy(e);
				case "KeyV":
					return handlePaste(e);
				case "KeyS":
					return handleSplitClip(e);
				case "KeyZ":
					return handleUndoRedo(e);
				case "Escape":
					return handleEscape();
				case "ArrowLeft":
					e.preventDefault();
					return e.shiftKey ? handleTimeSkip(-5) : handleFrameStep(-1);
				case "ArrowRight":
					e.preventDefault();
					return e.shiftKey ? handleTimeSkip(5) : handleFrameStep(1);
				case "Home":
					e.preventDefault();
					return handleJumpToStart();
				case "End":
					e.preventDefault();
					return handleJumpToEnd();
				case "Equal":
				case "NumpadAdd":
					if (hasModifier) return handleZoom("in", e);
					break;
				case "Minus":
				case "NumpadSubtract":
					if (hasModifier) return handleZoom("out", e);
					break;
				case "Digit0":
				case "Numpad0":
					if (hasModifier) return handleZoom("reset", e);
					break;
				case "Slash":
					if (e.shiftKey) {
						e.preventDefault();
						useUIStore.getState().toggleShortcutHelp();
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
