<script lang="ts">
  import { app } from '../lib/state/app.svelte';
</script>

<div class="toast-region" aria-live="polite">
  {#if app.toast}
    {#key app.toast.id}
      <div class="toast">{app.toast.text}</div>
    {/key}
  {/if}
</div>

<style>
  .toast-region {
    position: fixed;
    top: calc(var(--safe-top) + 10px);
    left: 0;
    right: 0;
    z-index: 60;
    display: flex;
    justify-content: center;
    pointer-events: none;
    padding: 0 16px;
  }

  .toast {
    background: var(--surface-3);
    color: var(--text);
    padding: 10px 16px;
    border-radius: 12px;
    font-size: var(--fs-small);
    font-weight: 500;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
    animation: drop 0.22s var(--ease-out);
  }

  @keyframes drop {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
  }
</style>
