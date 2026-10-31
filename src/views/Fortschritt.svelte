<script lang="ts">
  import { onMount } from 'svelte';
  import { getExercise } from '../data/exercises';
  import Icon from '../components/Icon.svelte';
  import Rings from '../components/Rings.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Sparkline from '../components/Sparkline.svelte';
  import WeightChart from '../components/WeightChart.svelte';
  import { CHECKIN_INTERVAL_DAYS, MEASURES, checkinDue, measureChange, withPhoto } from '../lib/checkin';
  import { addDays, diffDays, formatDate, fromKey, todayKey, weekStart } from '../lib/dates';
  import { performanceLabel } from '../lib/format';
  import { formatDecimal } from '../lib/numbers';
  import { plannedDay } from '../lib/plan';
  import { bestOfLog, compare, type Performance } from '../lib/records';
  import { SCALE_FIELDS, parseScaleInput, scaleChange, scaleSeries, type ScaleKey } from '../lib/scale';
  import { formatSleep } from '../lib/sleep';
  import { ACHIEVEMENTS, weekDates } from '../lib/achievements';
  import { intakeSummary, proteinDays } from '../lib/intake';
  import { GOOD_DAY_MEALS } from '../lib/rhythm';
  import { steeringAdvice } from '../lib/steering';
  import { isPausedOn, steeringOnHold } from '../lib/pause';
  import { trainingStreak } from '../lib/streaks';
  import { workoutsInWeek } from '../lib/week';
  import { forecastDate, tempoPerWeek, trendSeries, weeklyAverages } from '../lib/trend';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { loadWeek, meals } from '../lib/state/meals.svelte';
  import { planOptions } from '../lib/state/shop.svelte';
  import { changeKcalTarget, removeScaleEntry, saveScaleEntry } from '../lib/state/body.svelte';
  import { ladderFor } from '../lib/state/workout.svelte';

  const today = todayKey();
  const skipKey = `steer-skip:${weekStart(today)}`;
  const streak = $derived(trainingStreak(app.workouts.map((w) => w.date), app.settings.startDate, today, (d) => isPausedOn(app.settings.pauses, d)));
  const planned = $derived(plannedDay(today, app.settings.startDate));

  const series = $derived(trendSeries(app.weights));
  const latest = $derived(series.at(-1));
  const tempo = $derived(tempoPerWeek(series));
  const target = $derived(app.settings.targetWeightKg);
  const forecast = $derived(latest ? forecastDate(latest.trend, tempo, target, today) : null);
  const weeks = $derived(weeklyAverages(app.weights));
  // Was du wirklich gegessen hast: die letzten vollen Tage, ohne heute
  const pastDates = (n: number) => Array.from({ length: n }, (_, i) => addDays(today, -(i + 1)));
  const last14 = pastDates(14);
  const last7 = pastDates(7);
  onMount(() => void loadWeek(last14));
  const intake14 = $derived(intakeSummary(last14, meals.week, planOptions()));
  const intake7 = $derived(intakeSummary(last7, meals.week, planOptions()));
  const intakeShare = $derived(intake7.avgKcal !== null ? intake7.avgKcal / app.settings.kcalTarget : null);
  const advice = $derived(
    app.overrides[skipKey] === true || steeringOnHold(app.settings.pauses, today)
      ? ({ kind: 'none' } as const)
      : steeringAdvice({
          weeks,
          startDate: app.settings.startDate,
          lastChange: app.settings.goalHistory.at(-1)?.date ?? null,
          today,
          intake: intake14,
          kcalTarget: app.settings.kcalTarget,
        }),
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

  // Wochenringe: diese Woche bis heute
  const thisWeek = weekDates(today);
  onMount(() => void loadWeek(thisWeek));
  const ringTrainings = $derived(workoutsInWeek(app.workouts, today).length);
  const ringProtein = $derived(proteinDays(thisWeek, meals.week, planOptions(), app.settings.proteinTarget));
  const ringSleep = $derived(app.sleep.filter((s) => thisWeek.includes(s.date) && s.hours >= 7).length);

  // Erfolge
  const unlockedCount = $derived(ACHIEVEMENTS.filter((a) => a.id in app.achievements).length);
  const GROUPS = [
    { id: 'essen', label: 'Essen' },
    { id: 'training', label: 'Training' },
    { id: 'koerper', label: 'Körper' },
  ] as const;

  // Check-in
  const lastCheckin = $derived([...app.checkins].sort((a, b) => (a.date < b.date ? 1 : -1))[0]);
  const due = $derived(checkinDue(app.checkins, app.settings.startDate, today));
  const canCompare = $derived(withPhoto(app.checkins, 'vorne').length >= 2 || withPhoto(app.checkins, 'seite').length >= 2 || withPhoto(app.checkins, 'hinten').length >= 2);

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
    if (advice.kind !== 'more' && advice.kind !== 'less') return;
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

  <h2 class="section-title">Diese Woche</h2>
  <section class="card rings-card">
    <Rings
      size={96}
      rings={[
        { value: ringTrainings, target: 5, color: 'var(--accent-ink)' },
        { value: ringProtein, target: 7, color: 'var(--protein)' },
        { value: ringSleep, target: 7, color: 'var(--text-2)' },
      ]}
    />
    <ul class="ring-legend">
      <li><span class="dot" style:background="var(--accent-ink)"></span><span class="num strong">{ringTrainings}/5</span> Trainings</li>
      <li><span class="dot" style:background="var(--protein)"></span><span class="num strong">{ringProtein}/7</span> Tage mit {app.settings.proteinTarget} g Protein</li>
      <li><span class="dot" style:background="var(--text-2)"></span><span class="num strong">{ringSleep}/7</span> Nächte mit 7 h Schlaf</li>
    </ul>
  </section>

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

    {#if advice.kind === 'plan'}
      <section class="card stack">
        <h2>Erst den Plan schaffen</h2>
        <p class="muted">{advice.reason}</p>
        <p>{advice.how}</p>
        <div class="cluster">
          <a class="btn btn-primary" href="#/heute">Zu Heute</a>
          <button class="btn btn-ghost" onclick={() => setOverride(skipKey, true)}>Nicht jetzt</button>
        </div>
      </section>
    {:else if advice.kind !== 'none'}
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

  <h2 class="section-title">Essen der letzten 7 Tage</h2>
  <section class="card stack">
    {#if intake7.days === 0 || intake7.avgKcal === null || intake7.avgProtein === null || intakeShare === null}
      <p class="small muted">Hak in „Heute“ deine Mahlzeiten ab. Dann siehst du hier, wie viel du im Schnitt wirklich isst. Das ist die Zahl, die fürs Zunehmen zählt.</p>
    {:else}
      <div class="line">
        <span>Im Schnitt pro Tag</span>
        <span class="num"><strong>{Math.round(intake7.avgKcal).toLocaleString('de-DE')}</strong> / {app.settings.kcalTarget.toLocaleString('de-DE')} kcal</span>
      </div>
      <div class="bar" aria-hidden="true"><span class:low={intakeShare < 0.9} style:width="{Math.min(100, intakeShare * 100)}%"></span></div>
      <p class="small muted num">{Math.round(intake7.avgProtein)} g Protein, Ziel {app.settings.proteinTarget} g</p>
      <p class="small">
        An <strong>{intake7.goodDays} von 7</strong> Tagen hattest du mindestens {GOOD_DAY_MEALS} Mahlzeiten{#if intake7.days < 7}, an {7 - intake7.days} Tagen steht nichts drin{/if}.
      </p>
      {#if intakeShare < 0.9}
        <p class="small muted">Das liegt unter deinem Ziel. Das Gewicht kann nur steigen, wenn du isst, was im Plan steht. Bei wenig Hunger zählt auch Trinken, und der leichte Tag hilft.</p>
      {/if}
    {/if}
  </section>

  <p class="small muted">{goalText}</p>

  <h2 class="section-title">Check-in</h2>
  <section class="card stack">
    {#if lastCheckin}
      <p class="small muted">
        Letzter Check-in am {formatDate(lastCheckin.date, 'short')}
        {due.due ? 'Zeit für den nächsten.' : `Der nächste ist in etwa ${Math.max(1, CHECKIN_INTERVAL_DAYS - (due.daysSince ?? 0))} Tagen dran.`}
      </p>
      {#each MEASURES as m (m.key)}
        {@const change = measureChange(app.checkins, m.key)}
        {#if change}
          <div class="line">
            <span class="scale-name">{m.label}</span>
            <span class="num"><strong>{formatDecimal(change.latest, 1, 1)} cm</strong>{#if change.sinceFirst !== null}<span class="muted">, {change.sinceFirst >= 0 ? '+' : '−'}{formatDecimal(Math.abs(change.sinceFirst), 1, 1)} seit dem Start</span>{/if}</span>
          </div>
        {/if}
      {/each}
    {:else}
      <p class="small muted">Alle 4 Wochen Maße und drei Fotos. Mach den ersten Check-in am besten gleich am Anfang, dann siehst du später den Unterschied. Die Fotos bleiben auf diesem iPhone.</p>
    {/if}
    <a class="btn btn-primary" href="#/fortschritt/checkin"><Icon name="camera" size={18} />{lastCheckin ? 'Neuer Check-in' : 'Ersten Check-in machen'}</a>
    {#if canCompare}<a class="btn btn-secondary" href="#/fortschritt/vergleich">Fotos vergleichen</a>{/if}
  </section>

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

  <h2 class="section-title">Erfolge, {unlockedCount} von {ACHIEVEMENTS.length}</h2>
  {#each GROUPS as group (group.id)}
    <p class="small muted group-label">{group.label}</p>
    <div class="trophies">
      {#each ACHIEVEMENTS.filter((a) => a.group === group.id) as a (a.id)}
        {@const date = app.achievements[a.id]}
        <div class="trophy" class:locked={!date}>
          <span class="medal" aria-hidden="true"><Icon name={date ? 'trophy' : 'circle'} size={20} /></span>
          <span class="t-title">{a.title}</span>
          <span class="caption muted">{date ? formatDate(date, 'short') : a.detail}</span>
        </div>
      {/each}
    </div>
  {/each}
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

  .line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .bar {
    height: 8px;
    background: var(--surface-3);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--accent-ink);
  }

  .bar span.low {
    background: var(--warn);
  }

  .rings-card {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ring-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: var(--fs-small);
  }

  .ring-legend .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .group-label {
    margin: 4px 2px -4px;
  }

  .trophies {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .trophy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    background: var(--surface-1);
    border-radius: var(--radius-card, 14px);
  }

  .trophy.locked {
    opacity: 0.7;
  }

  .medal {
    color: var(--accent-ink);
    margin-bottom: 2px;
  }

  .trophy.locked .medal {
    color: var(--text-3);
  }

  .t-title {
    font-weight: 600;
    font-size: var(--fs-small);
  }

  .scale-row {
    display: grid;
    grid-template-columns: 7.2em auto minmax(0, 1fr) 3.4em;
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

</style>
