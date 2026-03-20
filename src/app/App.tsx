import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { Header } from "@/components/layout/Header";
import { MediaPool } from "@/components/media-pool/MediaPool";
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
				preview={
					<div className="flex h-full items-center justify-center">
						<p className="text-gray-500">프리뷰 영역</p>
					</div>
				}
				timeline={<Timeline />}
			/>
		</DndContext>
	);
}
