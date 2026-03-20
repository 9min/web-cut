import { useProjectStore } from "@/stores/useProjectStore";

export function Header() {
	const name = useProjectStore((s) => s.name);

	return (
		<header className="flex h-12 items-center gap-4 border-b border-gray-800 px-4">
			<h1 className="text-lg font-bold text-white">WebCut</h1>
			<span className="text-sm text-gray-400">{name}</span>
		</header>
	);
}
