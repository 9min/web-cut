import { EditorLayout } from "@/components/layout/EditorLayout";
import { Header } from "@/components/layout/Header";
import { MediaPool } from "@/components/media-pool/MediaPool";

export function App() {
	return (
		<EditorLayout
			header={<Header />}
			sidebar={<MediaPool />}
			preview={
				<div className="flex h-full items-center justify-center">
					<p className="text-gray-500">프리뷰 영역</p>
				</div>
			}
			timeline={
				<div className="flex h-full items-center justify-center">
					<p className="text-gray-500">타임라인 영역</p>
				</div>
			}
		/>
	);
}
