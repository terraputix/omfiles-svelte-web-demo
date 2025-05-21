<script lang="ts">
	export let dimensions: number[] = [];
	export let latIndex = 0;
	export let lonIndex = 1;
	export let timeIndex = 2;
	export let onDimensionsChange: (lat: number, lon: number, time: number) => void;
	export let onLoadData: () => void;
	export let disabled = false;

	let latValue = latIndex;
	let lonValue = lonIndex;
	let timeValue = timeIndex;

	function handleDimensionChange() {
		onDimensionsChange(latValue, lonValue, timeValue);
	}

	// Keep local values in sync with exported props
	$: {
		latValue = latIndex;
		lonValue = lonIndex;
		timeValue = timeIndex;
	}

	const dimensionTypes = [
		{
			id: 'lat',
			label: 'Latitude Dimension',
			value: latValue,
			bind: (v: number) => (latValue = v)
		},
		{
			id: 'lon',
			label: 'Longitude Dimension',
			value: lonValue,
			bind: (v: number) => (lonValue = v)
		},
		{ id: 'time', label: 'Time Dimension', value: timeValue, bind: (v: number) => (timeValue = v) }
	];
</script>

<div class="dimension-controls">
	{#each dimensionTypes as { id, label, value, bind } (id)}
		<div class="dimension-group">
			<label for="{id}Select">{label}:</label>
			<select
				id="{id}Select"
				bind:value
				on:change={handleDimensionChange}
				on:input={(e) => bind(parseInt(e.currentTarget.value))}
				{disabled}
			>
				{#each dimensions as dimension, i (i)}
					<option value={i}>({dimension})</option>
				{/each}
			</select>
		</div>
	{/each}

	<div class="dimension-group">
		<button on:click={onLoadData} {disabled}>Load with these dimensions</button>
	</div>
</div>

<style>
	.dimension-controls {
		display: flex;
		gap: 20px;
		margin: 20px 0;
		flex-wrap: wrap;
	}

	.dimension-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	select {
		padding: 8px;
		border-radius: 4px;
		border: 1px solid #ccc;
	}

	button {
		padding: 8px 16px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 21px;
	}

	button:hover {
		background: #45a049;
	}

	button:disabled {
		background: #cccccc;
		cursor: not-allowed;
	}
</style>
