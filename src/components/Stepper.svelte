<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    value: number;
    label: string;
    step?: number;
    min?: number;
    max?: number;
    unit?: string;
    disabled?: boolean;
    onchange: (value: number) => void;
  }

  let { value, label, step = 1, min = 0, max = 999, unit = '', disabled = false, onchange }: Props = $props();
</script>

<div class="stepper" role="group" aria-label={label}>
  <button type="button" aria-label="{label}: weniger" disabled={disabled || value <= min} onclick={() => onchange(Math.max(min, value - step))}>
    <Icon name="minus" size={18} />
  </button>
  <output class="num" aria-live="polite">{value}{#if unit}<small>{unit}</small>{/if}</output>
  <button type="button" aria-label="{label}: mehr" disabled={disabled || value >= max} onclick={() => onchange(Math.min(max, value + step))}>
    <Icon name="plus" size={18} />
  </button>
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  button {
    width: 40px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-2);
  }

  button:disabled {
    opacity: 0.35;
  }

  button:active:not(:disabled) {
    color: var(--text);
  }

  output {
    min-width: 2.6em;
    text-align: center;
    font-size: var(--fs-title);
    font-weight: 600;
  }

  small {
    font-size: var(--fs-caption);
    font-weight: 500;
    color: var(--text-2);
    margin-left: 1px;
  }
</style>
