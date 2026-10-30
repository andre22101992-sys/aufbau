<script lang="ts">
  import { WEEKDAYS_SHORT, weekday } from '../lib/dates';
  import type { DayStatus } from '../lib/week';
  import Icon from './Icon.svelte';

  interface Props {
    days: DayStatus[];
  }

  let { days }: Props = $props();

  const stateLabel: Record<DayStatus['state'], string> = {
    done: 'erledigt',
    today: 'heute',
    missed: 'verpasst',
    upcoming: 'kommt noch',
    beforeStart: 'vor dem Start',
  };
</script>

<ol class="week" aria-label="Trainingstage dieser Woche">
  {#each days as day (day.dayId)}
    <li class={day.state} aria-label="{WEEKDAYS_SHORT[weekday(day.date)]}: {stateLabel[day.state]}">
      <span class="mark">
        {#if day.state === 'done'}
          <Icon name="check" size={18} />
        {/if}
      </span>
      <span class="day">{WEEKDAYS_SHORT[weekday(day.date)]}</span>
    </li>
  {/each}
</ol>

<style>
  .week {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .mark {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--on-accent);
  }

  .done .mark {
    background: var(--accent);
  }

  .today .mark {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--accent-ink);
  }

  .missed .mark {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--surface-3);
  }

  .beforeStart .mark {
    opacity: 0.4;
  }

  .day {
    font-size: var(--fs-caption);
    color: var(--text-2);
  }

  .today .day {
    color: var(--text);
    font-weight: 600;
  }
</style>
