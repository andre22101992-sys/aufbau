<script lang="ts">
  import { onMount } from 'svelte';
  import MiniWorkoutBar from './components/MiniWorkoutBar.svelte';
  import TabBar from './components/TabBar.svelte';
  import Toast from './components/Toast.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import { unlockSound } from './lib/sound';
  import { app, loadApp } from './lib/state/app.svelte';
  import { go, initRouter, router } from './lib/state/router.svelte';
  import Bon from './views/Bon.svelte';
  import Einkauf from './views/Einkauf.svelte';
  import Samstag from './views/Samstag.svelte';
  import Scan from './views/Scan.svelte';
  import Einstellungen from './views/Einstellungen.svelte';
  import Essen from './views/Essen.svelte';
  import Fortschritt from './views/Fortschritt.svelte';
  import Heute from './views/Heute.svelte';
  import Kochmodus from './views/Kochmodus.svelte';
  import KiRezept from './views/KiRezept.svelte';
  import Rezept from './views/Rezept.svelte';
  import IphoneTest from './views/IphoneTest.svelte';
  import Onboarding from './views/Onboarding.svelte';
  import Ruhetag from './views/Ruhetag.svelte';
  import Training from './views/Training.svelte';
  import Uebung from './views/Uebung.svelte';
  import Workout from './views/Workout.svelte';

  let loadError = $state('');

  onMount(() => {
    initRouter();
    loadApp()
      .then(() => {
        if (!app.settings.onboarded && router.path !== '/start') go('/start', true);
      })
      .catch(() => {
        loadError = 'Die Daten konnten nicht geladen werden. Schließ die App und öffne sie neu.';
      });
    // Safari erlaubt Ton erst nach der ersten Berührung
    window.addEventListener('pointerdown', unlockSound, { once: true });
  });

  $effect(() => {
    document.documentElement.dataset.theme = app.settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    const light =
      app.settings.theme === 'light' || (app.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
    meta?.setAttribute('content', light ? '#F3F4F0' : '#0F1012');
  });

  const segments = $derived(router.path.split('/').filter(Boolean));
  const fullscreen = $derived(segments[0] === 'start' || (segments[0] === 'training' && segments[1] === 'aktiv') || (segments[0] === 'essen' && segments[1] === 'kochen'));
</script>

{#if loadError}
  <div class="screen"><p>{loadError}</p></div>
{:else if app.ready}
  <main>
    {#if segments[0] === 'start'}
      <Onboarding />
    {:else if segments[0] === 'training' && segments[1] === 'aktiv'}
      <Workout />
    {:else if segments[0] === 'training' && segments[1] === 'ruhetag'}
      <Ruhetag />
    {:else if segments[0] === 'training' && segments[1] === 'uebung' && segments[2]}
      {#key segments[2]}
        <Uebung id={segments[2]} />
      {/key}
    {:else if segments[0] === 'training'}
      <Training />
    {:else if segments[0] === 'essen' && segments[1] === 'rezept' && segments[2]}
      {#key segments[2]}<Rezept id={segments[2]} />{/key}
    {:else if segments[0] === 'essen' && segments[1] === 'ki'}
      {#key segments[2]}<KiRezept mode={segments[2] === 'umwandeln' ? 'umwandeln' : 'neu'} />{/key}
    {:else if segments[0] === 'essen' && segments[1] === 'kochen' && segments[2]}
      <Kochmodus id={segments[2]} portions={Number(segments[3]) || 2} />
    {:else if segments[0] === 'essen'}
      <Essen />
    {:else if segments[0] === 'einkauf' && segments[1] === 'bon'}
      <Bon />
    {:else if segments[0] === 'einkauf' && segments[1] === 'scan'}
      <Scan />
    {:else if segments[0] === 'einkauf' && segments[1] === 'samstag'}
      <Samstag />
    {:else if segments[0] === 'einkauf'}
      <Einkauf />
    {:else if segments[0] === 'fortschritt'}
      <Fortschritt />
    {:else if import.meta.env.DEV && segments[0] === 'dev'}
      {#await import('./views/DevFiguren.svelte') then dev}<dev.default />{/await}
    {:else if segments[0] === 'einstellungen' && segments[1] === 'test'}
      <IphoneTest />
    {:else if segments[0] === 'einstellungen'}
      <Einstellungen />
    {:else}
      <Heute />
    {/if}
  </main>
  {#if !fullscreen}
    <MiniWorkoutBar />
    <TabBar />
  {/if}
  <UpdateBanner />
  <Toast />
{/if}
