<script lang="ts">
  // Zwei Fotos übereinander, ein Schieberegler zeigt links das alte und rechts das neue Foto.

  interface Props {
    before: string;
    after: string;
    beforeLabel: string;
    afterLabel: string;
  }

  let { before, after, beforeLabel, afterLabel }: Props = $props();

  let position = $state(50);
</script>

<div class="cmp">
  <div class="frame">
    <img class="base" src={after} alt={afterLabel} />
    <img class="top" src={before} alt={beforeLabel} style:clip-path="inset(0 {100 - position}% 0 0)" />
    <span class="line" style:left="{position}%"></span>
    <span class="tag left small">{beforeLabel}</span>
    <span class="tag right small">{afterLabel}</span>
  </div>
  <input type="range" min="0" max="100" step="1" bind:value={position} aria-label="Zwischen altem und neuem Foto schieben" />
</div>

<style>
  .cmp {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .frame {
    position: relative;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border-radius: var(--radius-control);
    background: var(--surface-2);
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent);
    transform: translateX(-1px);
  }

  .tag {
    position: absolute;
    bottom: 8px;
    padding: 2px 8px;
    border-radius: 8px;
    background: #000a;
    color: #fff;
  }

  .tag.left {
    left: 8px;
  }

  .tag.right {
    right: 8px;
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--accent-ink);
    min-height: 32px;
  }
</style>
