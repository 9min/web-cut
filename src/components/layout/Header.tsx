import { Download } from "lucide-react";
import { useState } from "react";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useProjectStore } from "@/stores/useProjectStore";

export function Header() {
	const name = useProjectStore((s) => s.name);
	const [showExport, setShowExport] = useState(false);

	return (
		<header className="relative flex h-12 items-center gap-4 border-b border-gray-800 px-4">
			<h1 className="text-lg font-bold text-white">WebCut</h1>
			<span className="text-sm text-gray-400">{name}</span>
			<div className="ml-auto">
				<button
					type="button"
					onClick={() => setShowExport(!showExport)}
					className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
				>
					<Download size={14} />
					내보내기
				</button>
			</div>
			{showExport && (
				<div className="absolute right-4 top-12 z-50 w-64 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
					<ExportPanel />
				</div>
			)}
		</header>
	);
}
