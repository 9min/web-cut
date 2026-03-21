import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { Header } from "@/components/layout/Header";
import { MediaPool } from "@/components/media-pool/MediaPool";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { Timeline } from "@/components/timeline/Timeline";
import { useTimelineDragDrop } from "@/hooks/useTimelineDragDrop";
import { useMediaStore } from "@/stores/useMediaStore";
import type { DragData } from "@/types/dnd";
import { DND_TYPES } from "@/types/dnd";

function getTypeIcon(type: string): string {
	if (type === "video") return "\u{1F3AC}";
	if (type === "audio") return "\u{1F3B5}";
	return "\u{1F5BC}\uFE0F";
}

export function App() {
	const { handleDragEnd, handleDragMove, clearIndicator } = useTimelineDragDrop();
	const [dragInfo, setDragInfo] = useState<{ name: string; type: string } | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);

	return (
		<DndContext
			sensors={sensors}
			onDragStart={({ active }) => {
				const data = active.data.current as DragData | undefined;
				if (data?.type === DND_TYPES.MEDIA_ITEM) {
					const asset = useMediaStore.getState().assets.find((a) => a.id === data.assetId);
					if (asset) {
						setDragInfo({ name: asset.name, type: asset.type });
					}
				}
			}}
			onDragMove={handleDragMove}
			onDragEnd={(event) => {
				handleDragEnd(event);
				clearIndicator();
				setDragInfo(null);
			}}
			onDragCancel={() => {
				clearIndicator();
				setDragInfo(null);
			}}
		>
			<EditorLayout
				header={<Header />}
				sidebar={<MediaPool />}
				preview={<PreviewPanel />}
				timeline={<Timeline />}
				inspector={<InspectorPanel />}
			/>
			<DragOverlay dropAnimation={null}>
				{dragInfo && (
					<div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2 shadow-lg ring-1 ring-blue-500">
						<span>{getTypeIcon(dragInfo.type)}</span>
						<span className="max-w-40 truncate text-xs text-white">{dragInfo.name}</span>
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
