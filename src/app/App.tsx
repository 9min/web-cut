import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { Header } from "@/components/layout/Header";
import { MediaPool } from "@/components/media-pool/MediaPool";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { Timeline } from "@/components/timeline/Timeline";
import { useTimelineDragDrop } from "@/hooks/useTimelineDragDrop";

export function App() {
	const { handleDragEnd } = useTimelineDragDrop();
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<EditorLayout
				header={<Header />}
				sidebar={<MediaPool />}
				preview={<PreviewPanel />}
				timeline={<Timeline />}
			/>
		</DndContext>
	);
}
