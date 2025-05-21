<script lang="ts">
	export let metadata: Record<string, unknown> = {};
</script>

<div class="metadata-section">
	<h3>File Metadata</h3>
	{#if Object.keys(metadata).length === 0}
		<p>Metadata will appear here after loading a file...</p>
	{:else}
		<table class="metadata-table">
			<tbody>
				{#each Object.entries(metadata) as [key, value] (key)}
					<tr>
						<td class="metadata-key">{key}</td>
						<td class="metadata-value">
							{typeof value === 'object' ? JSON.stringify(value) : String(value)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.metadata-section {
		margin-top: 20px;
		padding: 15px;
		background-color: #f9f9f9;
		border-radius: 5px;
		border: 1px solid #ddd;
	}

	h3 {
		margin-top: 0;
		color: #333;
	}

	.metadata-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 10px;
	}

	.metadata-table td {
		padding: 8px;
		border-bottom: 1px solid #eee;
	}

	.metadata-key {
		font-weight: bold;
		width: 30%;
	}

	.metadata-value {
		width: 70%;
		word-break: break-word;
	}
</style>
