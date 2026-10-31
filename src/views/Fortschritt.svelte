<script lang="ts">
  import { getExercise } from '../data/exercises';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Sparkline from '../components/Sparkline.svelte';
  import WeightChart from '../components/WeightChart.svelte';
  import { addDays, diffDays, formatDate, fromKey, todayKey, weekStart } from '../lib/dates';
  import { performanceLabel } from '../lib/format';
  import { formatDecimal } from '../lib/numbers';
  import { plannedDay } from '../lib/plan';
  import { bestOfLog, compare, type Performance } from '../lib/records';
  import { SCALE_FIELDS, parseScaleInput, scaleChange, scaleSeries, type ScaleKey } from '../lib/scale';
  import { formatSleep } from '../lib/sleep';
  import { steeringAdvice } from '../lib/steering';
  import { trainingStreak } from '../lib/streaks';
  import { forecastDate, tempoPerWeek, trendSeries, weeklyAverages } from '../lib/trend';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { changeKcalTarget, removeScaleEntry, saveScaleEntry } from '../lib/state/body.svelte';
  import { ladderFor } from '../lib/state/workout.svelte';

  const today = todayKey();
  const skipKey = `steer-skip:${weekStart(today)}`;
  const streak = $derived(trainingStreak(app.workouts.map((w) => w.date), app.settings.startDate, today));
  const planned = $derived(plannedDay(today, app.settings.startDate));

  const series = $derived(trendSeries(app.weights));
  const latest = $derived(series.at(-1));
  const tempo = $derived(tempoPerWeek(series));
  const target = $derived(app.settings.targetWeightKg);
  const forecast = $derived(latest ? forecastDate(latest.trend, tempo, target, today) : null);
  const weeks = $derived(weeklyAverages(app.weights));
  const advice = $derived(
    app.overrides[skipKey] === true
      ? ({ kind: 'none' } as const)
      : steeringAdvice({ weeks, startDate: app.settings.startDate, lastChange: app.settings.goalHistory.at(-1)?.date ?? null, today }),
  );
  const recentNights = $derived(app.sleep.filter((s) => diffDays(today, s.date) < 7));

  const ranges = [
    { days: 28, label: '4 Wochen' },
    { days: 84, label: '12 Wochen' },
    { days: null, label: 'Alles' },
  ];
  let range = $state<number | null>(28);

  const signed = (kg: number) => `${kg >= 0 ? '+' : '−'}${formatDecimal(Math.abs(kg), 1, 1)}`;
  const dayMonth = (key: string) => new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' }).format(fromKey(key));

  const forecastText = $derived.by(() => {
    if (!latest) return '';
    if (latest.trend >= target) return `Du hast dein Ziel von ${formatDecimal(target, 1)} kg erreicht.`;
    if (tempo === null) return `Nach etwa zwei Wochen mit Werten siehst du hier dein Tempo und wann du ${formatDecimal(target, 1)} kg erreichst.`;
    if (forecast) return `${formatDecimal(target, 1)} kg erreichst du etwa am ${dayMonth(forecast)}.`;
    return `Beim aktuellen Tempo erreichst du ${formatDecimal(target, 1)} kg nicht. Die Steuerung schlägt dir dann mehr Essen vor.`;
  });

  const goalText = $derived.by(() => {
    const change = app.settings.goalHistory.at(-1);
    const goal = `Dein Ziel: ${app.settings.kcalTarget.toLocaleString('de-DE')} kcal und mindestens ${app.settings.proteinTarget} g Protein am Tag.`;
    return change ? `${goal} Zuletzt angepasst am ${dayMonth(change.date)}.` : goal;
  });

  // Körperwerte der Waage
  let scaleOpen = $state(false);
  let scaleDate = $state(today);
  let scaleTexts = $state<Partial<Record<ScaleKey, string>>>({});
  let scaleError = $state('');
  const scaleSorted = $derived([...app.scale].sort((a, b) => (a.date < b.date ? 1 : -1)));
  const fmt = (v: number, digits: number) => formatDecimal(v, digits, digits);

  function openScale(): void {
    scaleDate = today;
    scaleError = '';
    const existing = app.scale.find((e) => e.date === today);
    scaleTexts = Object.fromEntries(SCALE_FIELDS.map((f) => [f.key, existing?.[f.key] !== undefined ? fmt(existing[f.key]!, f.digits) : '']));
    scaleOpen = true;
  }

  async function saveScale(): Promise<void> {
    const result = parseScaleInput(scaleDate, $state.snapshot(scaleTexts));
    if (!result.ok) {
      scaleError = result.error;
      return;
    }
    await saveScaleEntry(result.entry);
    scaleOpen = false;
    showToast('Waagenwerte gespeichert');
  }

  async function accept(): Promise<void> {
    if (advice.kind === 'none') return;
    await changeKcalTarget(today, advice.kcal, advice.reason);
    showToast(`Neues Ziel: ${app.settings.kcalTarget.toLocaleString('de-DE')} kcal`);
  }

  const records = $derived.by(() => {
    const best = new Map<string, { p: Performance; date: string }>();
    for (const w of app.workouts) {
      for (const log of w.exercises) {
        const p = bestOfLog(log, ladderFor(log.exerciseId));
        const current = best.get(log.exerciseId);
        if (p && (!current || compare(p, current.p) > 0)) best.set(log.exerciseId, { p, date: w.date });
      }
    }
    return [...best.entries()].map(([id, v]) => ({ id, ...v }));
  });
</script>

<div class="screen">
  <header class="screen-head">
    <h1>Fortschritt</h1>
  </header>

  <div class="stats">
    <div class="card stat">
      <span class="label small muted">Trainings</span>
      <span class="value">{app.workouts.length}</span>
    </div>
    <div class="card stat">
      <span class="label small muted">In Folge</span>
      <span class="value">{streak.count}</span>
    </div>
    <div class="card stat">
      <span class="label small muted">Woche</span>
      <span class="value">{planned.beforeStart ? 0 : planned.week}</span>
    </div>
  </div>

  <h2 class="section-title">Gewicht</h2>
  {#if latest}
    <section class="card stack">
      <div class="weight-head">
        <div>
          <span class="small muted">Trend</span>
          <p><span class="value">{formatDecimal(latest.trend, 1, 1)}</span> <span class="unit">kg</span></p>
        </div>
        {#if tempo !== null}
          <div class="tempo">
            <span class="small muted">pro Woche</span>
            <p class="num strong">{signed(tempo)} kg</p>
          </div>
        {/if}
      </div>
      <p class="small">{forecastText}</p>
      <div class="segmented" role="radiogroup" aria-label="Zeitraum">
        {#each ranges as r (r.label)}
          <button role="radio" aria-checked={range === r.days} class:selected={range === r.days} onclick={() => (range = r.days)}>{r.label}</button>
        {/each}
      </div>
      <WeightChart {series} days={range} />
      <p class="caption muted">Punkte: deine Tageswerte. Linie: Trend. Graue Fläche: Ziel von +0,2 bis +0,5 kg pro Woche.</p>
      <details class="why">
        <summary class="small"><Icon name="info-circle" size={18} />Warum Trendgewicht?</summary>
        <p class="small muted">
          Dein Gewicht schwankt von Tag zu Tag um bis zu ein Kilo, vor allem durch Wasser und Essen im Magen. Der Trend glättet das: Jeder neue Wert zählt
          zu 10 %. So siehst du, ob du wirklich zunimmst, und ein schwerer Tag bringt dich nicht aus dem Konzept.
        </p>
      </details>
    </section>

    {#if advice.kind !== 'none'}
      <section class="card stack">
        <h2>{advice.kind === 'more' ? 'Etwas mehr essen' : 'Etwas weniger essen'}</h2>
        <p class="muted">{advice.reason}</p>
        <p>Vorschlag: {advice.how}</p>
        <p class="small muted">
          Dein Ziel ändert sich von {app.settings.kcalTarget.toLocaleString('de-DE')} auf {(app.settings.kcalTarget + advice.kcal).toLocaleString('de-DE')} kcal.
        </p>
        <div class="cluster">
          <button class="btn btn-primary" onclick={accept}>Übernehmen</button>
          <button class="btn btn-ghost" onclick={() => setOverride(skipKey, true)}>Nicht jetzt</button>
        </div>
      </section>
    {/if}

    {#if weeks.length}
      <div class="list">
        {#each weeks.slice(-4).reverse() as w, i (w.week)}
          {@const previous = weeks[weeks.length - 2 - i]}
          <div class="row">
            <span class="row-grow">
              Woche ab {formatDate(w.week, 'short').replace(/^\w+, /, '')}<br />
              <span class="small muted">{w.count} Werte{diffDays(today, w.week) < 7 ? ', läuft noch' : ''}</span>
            </span>
            <span class="num">{formatDecimal(w.avg, 1, 1)} kg</span>
            <span class="num small muted delta">{previous && diffDays(w.week, previous.week) === 7 ? signed(w.avg - previous.avg) : ''}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <p class="muted small">Trag morgens in „Heute“ dein Gewicht ein. Ab dem zweiten Wert siehst du hier deinen Verlauf.</p>
  {/if}

  <p class="small muted">{goalText}</p>

  <h2 class="section-title">Körperwerte der Waage</h2>
  <section class="card stack">
    {#if app.scale.length}
      <p class="small muted">Letzte Messung am {formatDate(scaleSorted[0].date, 'short')}</p>
      {#each SCALE_FIELDS as f (f.key)}
        {@const change = scaleChange(app.scale, f.key)}
        {#if change}
          <div class="scale-row">
            <span class="scale-name">{f.label}</span>
            <Sparkline points={scaleSeries(app.scale, f.key)} />
            <span class="num scale-value">{fmt(change.latest, f.digits)}{f.unit ? ` ${f.unit}` : ''}</span>
            <span class="small muted num scale-delta">{change.sinceFirst === null ? '' : `${change.sinceFirst >= 0 ? '+' : '−'}${fmt(Math.abs(change.sinceFirst), f.digits)}`}</span>
          </div>
        {/if}
      {/each}
      <details class="why">
        <summary class="small">Alle Messungen</summary>
        <div class="list inner">
          {#each scaleSorted as e (e.id)}
            <div class="row">
              <span class="row-grow">{formatDate(e.date, 'short')}<br /><span class="small muted">{SCALE_FIELDS.filter((f) => e[f.key] !== undefined).map((f) => `${f.label} ${fmt(e[f.key]!, f.digits)}${f.unit ? ` ${f.unit}` : ''}`).join(', ')}</span></span>
              <button class="icon-btn" aria-label="Messung vom {formatDate(e.date, 'short')} löschen" onclick={() => removeScaleEntry(e)}><Icon name="x" size={18} /></button>
            </div>
          {/each}
        </div>
      </details>
    {:else}
      <p class="small muted">Trag alle vier Wochen die Werte deiner Körperwaage ein, am besten morgens nüchtern unter gleichen Bedingungen. Dann siehst du hier, wie sich Muskelmasse und Körperfett entwickeln.</p>
    {/if}
    <button class="btn btn-secondary" onclick={openScale}><Icon name="scale" size={18} />Werte eintragen</button>
    <p class="caption muted">Waagen messen mit einem schwachen Strom durch den Körper. Wasser, Essen und Uhrzeit verändern die Werte, einzelne Zahlen sind deshalb ungenau. Aussagekräftig ist nur der Verlauf über Wochen.</p>
  </section>

  {#if recentNights.length}
    <h2 class="section-title">Schlaf</h2>
    <section class="card sleep">
      <div>
        <span class="small muted">Schnitt, letzte 7 Nächte</span>
        <p class="num strong">{formatSleep(recentNights.reduce((s, n) => s + n.hours, 0) / recentNights.length)}</p>
      </div>
      <div>
        <span class="small muted">mindestens 7 Stunden</span>
        <p class="num strong">{recentNights.filter((n) => n.hours >= 7).length} von {recentNights.length}</p>
      </div>
    </section>
  {/if}

  <h2 class="section-title">Bestwerte je Übung</h2>
  {#if records.length}
    <div class="list">
      {#each records as r (r.id)}
        {@const exercise = getExercise(r.id)}
        <a class="row" href="#/training/uebung/{r.id}">
          <span class="row-grow">{exercise.name}<br /><span class="small muted">am {formatDate(r.date, 'short')}</span></span>
          <span class="num">{performanceLabel(r.p, ladderFor(r.id), exercise)}</span>
          <Icon name="chevron-right" />
        </a>
      {/each}
    </div>
  {:else}
    <p class="muted small">Nach deinem ersten Training stehen hier deine Bestwerte.</p>
  {/if}

  <section class="card soon">
    <p class="small muted">Check-ins mit Fotos, Erfolge und Wochenringe kommen mit den nächsten Updates.</p>
  </section>
</div>

<Sheet open={scaleOpen} title="Waagenwerte eintragen" onclose={() => (scaleOpen = false)}>
  <p class="small muted">Nimm die Werte aus der App deiner Waage. Leere Felder bleiben leer.</p>
  <label class="field"><span>Datum</span><input class="input" type="date" bind:value={scaleDate} max={today} /></label>
  <div class="grid2">
    {#each SCALE_FIELDS as f (f.key)}
      <label class="field">
        <span>{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
        <input class="input" inputmode="decimal" placeholder={f.placeholder} bind:value={scaleTexts[f.key]} />
      </label>
    {/each}
  </div>
  {#if scaleError}<p class="result bad"><Icon name="alert-triangle" size={18} /><span>{scaleError}</span></p>{/if}
  {#snippet footer()}
    <button class="btn btn-primary btn-block" onclick={saveScale}>Speichern</button>
  {/snippet}
</Sheet>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .value {
    font-family: var(--font-num);
    font-size: var(--fs-hero);
    font-weight: 700;
    line-height: 1.1;
  }

  .unit {
    color: var(--text-2);
  }

  .weight-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }

  .tempo {
    text-align: right;
  }

  .strong {
    font-weight: 600;
    font-size: var(--fs-title);
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  .segmented button {
    min-height: 36px;
    border-radius: 8px;
    color: var(--text-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }

  .segmented button.selected {
    background: var(--surface-3);
    color: var(--text);
  }

  .why summary {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-2);
    cursor: pointer;
    min-height: 32px;
  }

  .why p {
    margin-top: 6px;
  }

  .scale-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 4.6em 3.2em;
    align-items: center;
    gap: 8px;
  }

  .scale-name {
    font-size: var(--fs-small);
    color: var(--text-2);
  }

  .scale-value {
    text-align: right;
    font-weight: 600;
  }

  .scale-delta {
    text-align: right;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .delta {
    min-width: 3em;
    text-align: right;
  }

  .sleep {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .soon {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
</style>
