<script lang="ts">
	interface HeatmapData {
		z: number[][];
		type: string;
		colorscale: string;
		zmin: number;
		zmax: number;
	}

	export let plotData: HeatmapData | null = null;
	export let timestamp: number;

	let plotArea: HTMLElement;

	$: if (plotData && plotArea && window.Plotly) {
		const layout = {
			title: `Data Visualization - Timestamp ${timestamp}`,
			margin: {
				l: 50,
				r: 50,
				b: 50,
				t: 50
			}
		};

		window.Plotly.newPlot(plotArea, [plotData], layout);
	}
</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/npm/plotly.js@2.16.1/dist/plotly.min.js"></script>
</svelte:head>

<div bind:this={plotArea} class="plot-area"></div>

<style>
	.plot-area {
		width: 100%;
		height: 600px;
	}
</style>
