import "@testing-library/jest-dom/vitest";

// jsdom에 ResizeObserver polyfill 제공
if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof globalThis.ResizeObserver;
}
