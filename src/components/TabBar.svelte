<script lang="ts">
  import type { IconName } from '../lib/icons';
  import { router } from '../lib/state/router.svelte';
  import Icon from './Icon.svelte';

  const tabs: { path: string; label: string; icon: IconName }[] = [
    { path: '/heute', label: 'Heute', icon: 'sun' },
    { path: '/training', label: 'Training', icon: 'barbell' },
    { path: '/essen', label: 'Essen', icon: 'tools-kitchen-2' },
    { path: '/einkauf', label: 'Einkauf', icon: 'shopping-cart' },
    { path: '/fortschritt', label: 'Fortschritt', icon: 'chart-line' },
  ];

  const current = $derived(`/${router.path.split('/')[1] || 'heute'}`);
</script>

<nav class="tabbar" aria-label="Bereiche">
  {#each tabs as tab (tab.path)}
    <a href={`#${tab.path}`} class:active={current === tab.path} aria-current={current === tab.path ? 'page' : undefined}>
      <Icon name={tab.icon} size={24} />
      <span>{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 6px max(6px, var(--safe-left)) calc(4px + var(--safe-bottom)) max(6px, var(--safe-right));
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-top: 1px solid var(--line);
  }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: 50px;
    color: var(--text-3);
    text-decoration: none;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  a.active {
    color: var(--accent-ink);
  }
</style>
