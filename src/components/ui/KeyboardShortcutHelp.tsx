import { useCallback } from "react";
import { useUIStore } from "@/stores/useUIStore";

const IS_MAC = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const MOD = IS_MAC ? "\u2318" : "Ctrl";

const SHORTCUTS = [
	{ keys: "Space", desc: "재생 / 정지" },
	{ keys: "Delete / Backspace", desc: "선택된 클립 삭제" },
	{ keys: `${MOD}+S`, desc: "클립 분할" },
	{ keys: `${MOD}+Z`, desc: "실행 취소" },
	{ keys: `${MOD}+Shift+Z`, desc: "다시 실행" },
	{ keys: "Escape", desc: "선택 해제 / 도움말 닫기" },
	{ keys: "\u2190 / \u2192", desc: "1프레임 이동" },
	{ keys: "Shift+\u2190 / \u2192", desc: "5초 이동" },
	{ keys: "Home", desc: "처음으로 이동" },
	{ keys: "End", desc: "끝으로 이동" },
	{ keys: `${MOD}+=`, desc: "줌 인" },
	{ keys: `${MOD}+-`, desc: "줌 아웃" },
	{ keys: `${MOD}+0`, desc: "줌 초기화" },
	{ keys: "?", desc: "단축키 도움말" },
] as const;

export function KeyboardShortcutHelp() {
	const showShortcutHelp = useUIStore((s) => s.showShortcutHelp);
	const toggleShortcutHelp = useUIStore((s) => s.toggleShortcutHelp);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				toggleShortcutHelp();
			}
		},
		[toggleShortcutHelp],
	);

	if (!showShortcutHelp) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 오버레이 백드롭
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape 키는 useEditorKeyboard에서 처리
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={handleBackdropClick}
			data-testid="shortcut-help-overlay"
		>
			<div className="w-96 rounded-lg bg-gray-800 p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-gray-100">키보드 단축키</h2>
					<button
						type="button"
						onClick={toggleShortcutHelp}
						className="text-xs text-gray-400 hover:text-gray-200"
						data-testid="shortcut-help-close"
					>
						닫기
					</button>
				</div>
				<table className="w-full">
					<tbody>
						{SHORTCUTS.map(({ keys, desc }) => (
							<tr key={keys} className="border-t border-gray-700">
								<td className="py-1.5 pr-4 text-xs text-gray-300">
									<kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-[10px]">
										{keys}
									</kbd>
								</td>
								<td className="py-1.5 text-xs text-gray-400">{desc}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
