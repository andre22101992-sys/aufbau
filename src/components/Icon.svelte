<script lang="ts">
  import { ICONS, type IconName } from '../lib/icons';

  interface Props {
    name: IconName;
    size?: number;
    label?: string;
  }

  let { name, size = 22, label }: Props = $props();
</script>

<span
  class="icon"
  style:width="{size}px"
  style:height="{size}px"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : true}
>
  {@html ICONS[name]}
</span>

<style>
  .icon {
    display: inline-flex;
    flex: none;
    line-height: 0;
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
