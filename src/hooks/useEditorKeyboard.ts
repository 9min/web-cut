import { useEffect } from "react";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";

function handlePlaybackToggle(e: KeyboardEvent): void {
	e.preventDefault();
	usePlaybackStore.getState().togglePlayback();
}

function handleDeleteClip(e: KeyboardEvent): void {
	e.preventDefault();
	const { selectedClipId, tracks, removeClip, removeTextClip } = useTimelineStore.getState();
	if (!selectedClipId) return;

	const track = tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
	if (track) {
		useHistoryStore.getState().pushSnapshot();
		removeClip(track.id, selectedClipId);
		return;
	}

	const textTrack = tracks.find((t) => t.textClips.some((tc) => tc.id === selectedClipId));
	if (textTrack) {
		useHistoryStore.getState().pushSnapshot();
		removeTextClip(textTrack.id, selectedClipId);
	}
}

function handleSplitClip(e: KeyboardEvent): void {
	if (!e.ctrlKey && !e.metaKey) return;
	e.preventDefault();
	const { selectedClipId, tracks, splitClip } = useTimelineStore.getState();
	if (!selectedClipId) return;

	const track = tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
	if (!track) return;

	const currentTime = usePlaybackStore.getState().currentTime;
	useHistoryStore.getState().pushSnapshot();
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

export function useEditorKeyboard(): void {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement).tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;

			switch (e.code) {
				case "Space":
					return handlePlaybackToggle(e);
				case "Delete":
				case "Backspace":
					return handleDeleteClip(e);
				case "KeyS":
					return handleSplitClip(e);
				case "KeyZ":
					return handleUndoRedo(e);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
