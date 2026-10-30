<script lang="ts">
  import { applyUpdate } from '../lib/pwa';
  import { app } from '../lib/state/app.svelte';
  import Icon from './Icon.svelte';
</script>

{#if app.needRefresh}
  <div class="update" role="status">
    <Icon name="refresh" />
    <span class="small">Eine neue Version ist da.</span>
    {#if app.active}
      <span class="small muted">Lädt nach dem Training.</span>
    {:else}
      <button class="btn btn-primary" onclick={applyUpdate}>Neu laden</button>
    {/if}
  </div>
{/if}

<style>
  .update {
    position: fixed;
    top: calc(var(--safe-top) + 10px);
    left: 12px;
    right: 12px;
    z-index: 55;
    max-width: 620px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px 8px 14px;
    background: var(--surface-2);
    border-radius: 14px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
  }

  .update span:first-of-type {
    flex: 1;
  }

  .btn {
    min-height: 40px;
  }
</style>
