<script setup lang="ts">
const props = defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <input :placeholder="props.placeholder" />
</template>
