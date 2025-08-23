<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    readonly?: boolean
    loading?: boolean
    type?: 'primary' | 'secondary' | 'outline' | 'danger'
  }>(),
  {
    type: 'primary',
  },
)
</script>

<template>
  <button
    class="sa-switch"
    v-bind="{
      [`sa-${props.type}`]: '',
    }"
    :disabled="props.disabled"
    :readonly="props.readonly"
  >
    <slot />
  </button>
</template>

<style lang="scss">
.sa-switch {
  display: block;
  min-width: 60px;
  box-sizing: border-box;
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 4px;

  font-size: 12px;
  line-height: 18px;
  text-align: center;

  transition-property: background-color, border-color, color;
  transition-duration: 150ms;

  &[sa-primary] {
    border-color: var(--sa-color-primary);
    background-color: var(--sa-color-primary);
    color: var(--sa-color-text-invert);

    &:hover {
      border-color: var(--sa-color-primary);
      background-color: var(--sa-color-bg-primary);
      color: var(--sa-color-primary);
    }
  }

  &[sa-secondary] {
    border-color: #f2f2f2;
    background-color: #f2f2f2;
    color: var(--sa-color-text-default);

    &:hover {
      border-color: var(--sa-color-primary);
      background-color: #f2f2f2;
      color: var(--sa-color-primary);
    }
  }

  &[sa-outline] {
    border-color: var(--sa-color-primary);
    background-color: var(--sa-color-bg-primary);
    color: var(--sa-color-primary);

    &:hover {
      border-color: var(--sa-color-primary);
      background-color: var(--sa-color-primary);
      color: var(--sa-color-text-invert);
    }
  }

  &[sa-danger] {
    border-color: var(--sa-color-bg-danger);
    background-color: var(--sa-color-bg-danger);
    color: var(--sa-color-text-danger);

    &:hover {
      border-color: var(--sa-color-text-danger);
      background-color: var(--sa-color-text-danger);
      color: var(--sa-color-bg-primary);
    }
  }

  &.is-disabled {
    border-color: var(--sa-color-bg-secondary);
    background-color: var(--sa-color-bg-secondary);
    color: var(--sa-color-text-weak);
  }

  &.is-disabled {
    cursor: not-allowed;
    pointer-events: none;
  }

  &.is-loading {
    border-color: var(--sa-color-primary);
    background-color: #f2f2f2;
    color: var(--sa-color-primary);

    padding-left: 22px;
    background-size: 12px 12px;
    background-position: 6px center;
    background-repeat: no-repeat;
    pointer-events: none;
  }
}
</style>
