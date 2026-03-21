import { Download, FolderOpen, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useProjectStore } from "@/stores/useProjectStore";
import {
	deserializeProject,
	downloadProjectFile,
	serializeProject,
} from "@/utils/projectSerializer";

export function Header() {
	const name = useProjectStore((s) => s.name);
	const [showExport, setShowExport] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const exportPanelRef = useRef<HTMLDivElement>(null);
	const exportButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!showExport) return;
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (exportPanelRef.current?.contains(target) || exportButtonRef.current?.contains(target)) {
				return;
			}
			setShowExport(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showExport]);

	const handleSave = useCallback(async () => {
		const data = serializeProject();
		await downloadProjectFile(data);
	}, []);

	const handleLoad = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			try {
				deserializeProject(reader.result as string);
			} catch (err) {
				const message = err instanceof Error ? err.message : "프로젝트 불러오기 실패";
				alert(message);
			}
		};
		reader.readAsText(file);

		// 같은 파일 재선택 허용
		e.target.value = "";
	}, []);

	return (
		<header className="relative flex h-12 items-center gap-4 border-b border-gray-800 px-4">
			<h1 className="text-lg font-bold text-white">WebCut</h1>
			<span className="text-sm text-gray-400">{name}</span>
			<div className="ml-auto flex items-center gap-2">
				<button
					type="button"
					onClick={handleSave}
					className="flex items-center gap-1 rounded bg-gray-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-600 md:py-1.5"
					aria-label="프로젝트 저장"
				>
					<Save size={14} />
					저장
				</button>
				<button
					type="button"
					onClick={handleLoad}
					className="flex items-center gap-1 rounded bg-gray-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-600 md:py-1.5"
					aria-label="프로젝트 불러오기"
				>
					<FolderOpen size={14} />
					불러오기
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".json,.webcut.json"
					className="hidden"
					onChange={handleFileChange}
				/>
				<button
					ref={exportButtonRef}
					type="button"
					onClick={() => setShowExport(!showExport)}
					className="flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 md:py-1.5"
				>
					<Download size={14} />
					내보내기
				</button>
			</div>
			{showExport && (
				<div
					ref={exportPanelRef}
					className="absolute right-4 top-12 z-50 w-64 rounded-lg border border-gray-700 bg-gray-900 shadow-xl"
				>
					<ExportPanel />
				</div>
			)}
		</header>
	);
}
