// Define Plotly types
interface PlotlyInstance {
	newPlot: (element: HTMLElement, data: unknown[], layout: unknown) => void;
}

declare global {
	interface Window {
		Plotly: PlotlyInstance;
	}
}

export {};
