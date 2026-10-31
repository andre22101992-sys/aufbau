<script lang="ts">
  // Konzentrische Ringe, z. B. außen kcal, innen Protein.

  interface Props {
    rings: { value: number; target: number; color: string }[];
    size?: number;
  }

  let { rings, size = 76 }: Props = $props();

  const stroke = 8;
  const radius = (i: number) => size / 2 - stroke / 2 - i * (stroke + 3);
  const length = (i: number) => 2 * Math.PI * radius(i);
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
  {#each rings as ring, i (i)}
    {@const r = radius(i)}
    {@const fraction = Math.min(1, ring.target > 0 ? ring.value / ring.target : 0)}
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--surface-3)" stroke-width={stroke} />
    {#if fraction > 0}
      <circle
        cx={size / 2}
        cy={size / 2}
        {r}
        fill="none"
        stroke={ring.color}
        stroke-width={stroke}
        stroke-linecap="round"
        stroke-dasharray="{fraction * length(i)} {length(i)}"
        transform="rotate(-90 {size / 2} {size / 2})"
      />
    {/if}
  {/each}
</svg>

<style>
  svg {
    flex: none;
  }
</style>
