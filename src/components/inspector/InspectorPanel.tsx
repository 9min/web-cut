import { DEFAULT_CLIP_FILTER } from "@/constants/filter";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { FilterPanel } from "./FilterPanel";

export function InspectorPanel() {
	const { tracks, selectedClipId } = useTimelineStore();

	if (!selectedClipId) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-center text-xs text-gray-500">
					클립을 선택하면 속성을 편집할 수 있습니다
				</p>
			</div>
		);
	}

	let foundTrackId: string | null = null;
	let foundClip = null;
	for (const track of tracks) {
		const clip = track.clips.find((c) => c.id === selectedClipId);
		if (clip) {
			foundTrackId = track.id;
			foundClip = clip;
			break;
		}
	}

	if (!foundClip || !foundTrackId) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-center text-xs text-gray-500">클립을 찾을 수 없습니다</p>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto p-3">
			<div className="mb-3 truncate text-sm font-medium text-gray-200">{foundClip.name}</div>
			<FilterPanel
				trackId={foundTrackId}
				clipId={foundClip.id}
				filter={foundClip.filter ?? DEFAULT_CLIP_FILTER}
			/>
		</div>
	);
}
