<script lang="ts">
	import OmFileReaderStore from '$lib/stores/OmFileReaderStore';
	import MetadataDisplay from '$lib/components/MetadataDisplay.svelte';
	import DimensionControls from '$lib/components/DimensionControls.svelte';
	import TimestampNav from '$lib/components/TimestampNav.svelte';
	import PlotlyHeatmap from '$lib/components/PlotlyHeatmap.svelte';

	let urlInput = 'https://openmeteo.s3.amazonaws.com/data/dwd_icon_d2/temperature_2m/chunk_3996.om';
	let fileInput: HTMLInputElement;

	// Subscribe to store values
	$: ({
		currentTimestamp,
		maxTimestamp,
		dimensions,
		timeIndex,
		latIndex,
		lonIndex,
		metadata,
		plotData,
		isLoading,
		error
	} = $OmFileReaderStore);

	// Handle URL loading
	async function handleLoadUrl() {
		if (!urlInput.trim()) {
			alert('Please enter a valid URL');
			return;
		}
		await OmFileReaderStore.loadFile(urlInput);
	}

	// Handle file selection
	async function handleFileSelection(event: Event) {
		const files = (event.target as HTMLInputElement).files;
		if (files && files.length > 0) {
			await OmFileReaderStore.loadFile(files[0]);
		}
	}

	// Handle dimension changes
	function handleDimensionChange(time: number, lat: number, lon: number) {
		OmFileReaderStore.updateDimensionIndices(time, lat, lon);
	}
</script>

<svelte:head>
	<title>OM File Viewer</title>
	<script src="https://cdn.jsdelivr.net/npm/plotly.js@2.16.1/dist/plotly.min.js"></script>
</svelte:head>

<main>
	<h1>OM File Viewer</h1>

	<div class="controls">
		<label for="dataUrl">Data URL or S3 URI:</label>
		<input
			type="text"
			id="dataUrl"
			bind:value={urlInput}
			placeholder="s3://bucket/key.om or https://example.com/data.om"
		/>
		<button on:click={handleLoadUrl} disabled={isLoading}>Load Data</button>
	</div>

	<div class="controls">
		<label for="fileInput">or Select Local File:</label>
		<input
			type="file"
			id="fileInput"
			accept=".om"
			bind:this={fileInput}
			on:change={handleFileSelection}
			disabled={isLoading}
		/>
	</div>

	{#if error}
		<div class="error">
			Error: {error}
		</div>
	{/if}

	<MetadataDisplay {metadata} />

	{#if dimensions.length > 0}
		<DimensionControls
			{dimensions}
			{timeIndex}
			{latIndex}
			{lonIndex}
			onDimensionsChange={handleDimensionChange}
			onLoadData={() => OmFileReaderStore.loadData()}
			disabled={isLoading}
		/>

		<TimestampNav
			{currentTimestamp}
			{maxTimestamp}
			onPrevious={() => OmFileReaderStore.previousTimestamp()}
			onNext={() => OmFileReaderStore.nextTimestamp()}
			disabled={isLoading}
		/>

		<PlotlyHeatmap {plotData} timestamp={currentTimestamp} />
	{/if}
</main>

<style>
	main {
		font-family: Arial, sans-serif;
		margin: 0;
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.controls {
		margin: 20px 0;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	input[type='text'] {
		padding: 8px;
		width: 400px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	button {
		padding: 8px 16px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:disabled {
		background: #cccccc;
		cursor: not-allowed;
	}

	.error {
		margin: 20px 0;
		padding: 10px;
		background-color: #ffebee;
		color: #c62828;
		border-radius: 4px;
		border: 1px solid #ef9a9a;
	}
</style>
