import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { KeyboardShortcutHelp } from "@/components/ui/KeyboardShortcutHelp";
import { useUIStore } from "@/stores/useUIStore";

describe("KeyboardShortcutHelp", () => {
	beforeEach(() => {
		useUIStore.setState({ showShortcutHelp: false });
	});

	it("showShortcutHelp가 false이면 렌더링하지 않는다", () => {
		render(<KeyboardShortcutHelp />);
		expect(screen.queryByTestId("shortcut-help-overlay")).not.toBeInTheDocument();
	});

	it("showShortcutHelp가 true이면 렌더링한다", () => {
		useUIStore.setState({ showShortcutHelp: true });
		render(<KeyboardShortcutHelp />);
		expect(screen.getByTestId("shortcut-help-overlay")).toBeInTheDocument();
	});
});
