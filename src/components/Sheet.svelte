<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { open, title, onclose, children, footer }: Props = $props();

  function onkeydown(event: KeyboardEvent): void {
    if (open && event.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

{#if open}
  <button class="scrim" tabindex="-1" aria-label="Schließen" onclick={onclose}></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
    <div class="handle" aria-hidden="true"></div>
    <div class="head">
      <h2>{title}</h2>
      <button class="icon-btn" onclick={onclose} aria-label="Schließen"><Icon name="x" /></button>
    </div>
    <div class="body">{@render children()}</div>
    {#if footer}
      <div class="foot">{@render footer()}</div>
    {/if}
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: var(--scrim);
    animation: fade 0.18s var(--ease-out);
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    max-width: 640px;
    max-height: 88dvh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background: var(--surface-1);
    border-radius: 20px 20px 0 0;
    padding-bottom: var(--safe-bottom);
    animation: rise 0.22s var(--ease-out);
  }

  .handle {
    width: 36px;
    height: 5px;
    border-radius: 3px;
    background: var(--surface-3);
    margin: 8px auto 0;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 6px 4px 18px;
  }

  .body {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 4px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Listen mit overflow: hidden würden sonst schrumpfen und abgeschnitten werden, statt das Fenster scrollen zu lassen */
  .body > :global(*) {
    flex-shrink: 0;
  }

  .foot {
    display: flex;
    gap: 10px;
    padding: 10px 18px 14px;
    border-top: 1px solid var(--line);
  }

  @keyframes rise {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
