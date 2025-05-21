<script lang="ts">
  export let currentTimestamp: number;
  export let maxTimestamp: number;
  export let onPrevious: () => void;
  export let onNext: () => void;
  export let disabled: boolean = false;
</script>

<div class="timestamp-nav">
  <button 
    on:click={onPrevious} 
    disabled={disabled || currentTimestamp <= 0}
  >
    ←
  </button>
  
  <span>Timestamp: {currentTimestamp}</span>
  
  <button 
    on:click={onNext} 
    disabled={disabled || currentTimestamp >= maxTimestamp}
  >
    →
  </button>
</div>

<style>
  .timestamp-nav {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  button {
    padding: 8px 16px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #45a049;
  }

  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  span {
    font-size: 1.1em;
    min-width: 120px;
    text-align: center;
  }
</style>