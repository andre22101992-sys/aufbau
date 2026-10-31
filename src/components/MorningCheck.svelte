<script lang="ts">
  // Morgen-Check oben in „Heute“: Gewicht und Schlaf. Bleibt offen, bis du eingetragen hast, danach nur eine Zeile.
  import { addDays, formatDate, todayKey } from '../lib/dates';
  import { formatDecimal, parseDecimal, roundTo } from '../lib/numbers';
  import { defaultSleep, displayTime, formatSleep, shiftTime, sleepHours } from '../lib/sleep';
  import { app, showToast } from '../lib/state/app.svelte';
  import { saveSleep, saveWeight } from '../lib/state/body.svelte';
  import Icon from './Icon.svelte';

  const today = todayKey();
  const todayWeight = $derived(app.weights.find((w) => w.date === today));
  const todaySleep = $derived(app.sleep.find((s) => s.date === today));
  const lastWeight = $derived(app.weights.findLast((w) => w.date < today));

  let editing = $state(false);
  let kg = $state<number | null>(null);
  let kgText = $state('');
  let typing = $state(false);
  let bed = $state('22:00');
  let wake = $state('05:15');

  const hours = $derived(sleepHours(bed, wake));
  const greeting = new Date().getHours() < 11 ? 'Guten Morgen' : 'Gewicht und Schlaf';

  /** Entwurf aus den Werten von heute oder den Vorschlägen */
  function fill(): void {
    kg = todayWeight?.kg ?? lastWeight?.kg ?? app.settings.profile.startWeightKg ?? null;
    kgText = kg === null ? '' : formatDecimal(kg, 1, 1);
    typing = kg === null;
    const suggestion = defaultSleep(app.settings.times, today);
    bed = todaySleep?.bed ?? suggestion.bed;
    wake = todaySleep?.wake ?? suggestion.wake;
  }
  fill();

  function step(delta: number): void {
    if (kg === null) return;
    kg = roundTo(kg + delta, 1);
    kgText = formatDecimal(kg, 1, 1);
  }

  function commitTyped(): boolean {
    const value = parseDecimal(kgText);
    if (value === null) return kgText.trim() === '';
    kg = roundTo(value, 1);
    typing = false;
    return true;
  }

  async function save(withWeight: boolean): Promise<void> {
    if (withWeight && typing && !commitTyped()) {
      showToast('Trag dein Gewicht als Zahl ein, zum Beispiel 56,4.');
      return;
    }
    if (withWeight && kg !== null) {
      if (kg < 30 || kg > 250) {
        showToast('Das Gewicht sieht nicht richtig aus. Prüf die Zahl noch einmal.');
        return;
      }
      await saveWeight(today, kg);
    }
    await saveSleep({ date: today, bed, wake, hours });
    editing = false;
    showToast(withWeight && kg !== null ? 'Gewicht und Schlaf gespeichert' : 'Schlaf gespeichert');
  }

  function edit(): void {
    fill();
    editing = true;
  }

  const summary = $derived(
    [todayWeight && `${formatDecimal(todayWeight.kg, 1, 1)} kg`, todaySleep && `${formatSleep(todaySleep.hours)} Schlaf`].filter(Boolean).join(', '),
  );

  const lastLabel = $derived(
    lastWeight
      ? `${lastWeight.date === addDays(today, -1) ? 'gestern' : `am ${formatDate(lastWeight.date, 'short')}`} ${formatDecimal(lastWeight.kg, 1, 1)} kg`
      : 'Wieg dich morgens nach dem Aufstehen, vor dem Frühstück.',
  );
</script>

{#snippet timeRow(label: string, value: string, set: (v: string) => void)}
  <div class="time-row">
    <span>{label}</span>
    <div class="mini" role="group" aria-label={label}>
      <button type="button" aria-label="{label}: 15 Minuten früher" onclick={() => set(shiftTime(value, -15))}><Icon name="minus" size={16} /></button>
      <span class="num time">{displayTime(value)}</span>
      <button type="button" aria-label="{label}: 15 Minuten später" onclick={() => set(shiftTime(value, 15))}><Icon name="plus" size={16} /></button>
    </div>
  </div>
{/snippet}

{#if editing || !todaySleep}
  <section class="card stack morning">
    <h2>{greeting}</h2>

    <div class="block">
      <span class="small muted">Gewicht</span>
      <div class="weight">
        <button type="button" class="round" aria-label="0,1 kg weniger" disabled={kg === null || typing} onclick={() => step(-0.1)}>
          <Icon name="minus" size={20} />
        </button>
        {#if typing}
          <input
            class="input kg-input num"
            inputmode="decimal"
            aria-label="Gewicht in kg"
            placeholder="z. B. 70,5"
            bind:value={kgText}
            onblur={commitTyped}
            onkeydown={(e) => e.key === 'Enter' && commitTyped()}
          />
        {:else}
          <button type="button" class="kg num" aria-label="Gewicht eintippen" onclick={() => (typing = true)}>
            {kg === null ? '–' : formatDecimal(kg, 1, 1)}<small>kg</small>
          </button>
        {/if}
        <button type="button" class="round" aria-label="0,1 kg mehr" disabled={kg === null || typing} onclick={() => step(0.1)}>
          <Icon name="plus" size={20} />
        </button>
      </div>
      <p class="caption muted center">{lastLabel}</p>
    </div>

    <div class="block">
      <span class="small muted">Schlaf</span>
      {@render timeRow('Ins Bett', bed, (v) => (bed = v))}
      {@render timeRow('Aufgestanden', wake, (v) => (wake = v))}
      <p class="small muted right num">{formatSleep(hours)}</p>
    </div>

    <button class="btn btn-primary btn-block" onclick={() => save(true)}>Speichern</button>
    <button class="btn btn-ghost btn-block" onclick={() => save(false)}>Nur Schlaf speichern</button>
  </section>
{:else}
  <div class="done card">
    <Icon name="circle-check" size={20} />
    <span class="row-grow small num">Heute: {summary}</span>
    <button class="btn btn-ghost small-btn" onclick={edit}>Ändern</button>
  </div>
{/if}

<style>
  .block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .weight {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .round {
    width: 48px;
    height: 48px;
    flex: none;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .round:disabled {
    opacity: 0.35;
  }

  .kg {
    flex: 1;
    min-height: 48px;
    font-family: var(--font-num);
    font-size: var(--fs-hero);
    font-weight: 700;
    color: var(--text);
    text-align: center;
  }

  .kg small {
    font-size: var(--fs-body);
    font-weight: 500;
    color: var(--text-2);
    margin-left: 4px;
  }

  .kg-input {
    flex: 1;
    min-width: 0;
    text-align: center;
    font-size: var(--fs-title);
  }

  .center {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .mini {
    display: inline-flex;
    align-items: center;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  .mini button {
    width: 44px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-2);
  }

  .time {
    min-width: 3.4em;
    text-align: center;
    font-weight: 600;
  }

  .done {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-block: 8px;
  }

  .done :global(.icon) {
    color: var(--accent-ink);
  }

  .small-btn {
    min-height: 36px;
    padding-inline: 12px;
  }
</style>
