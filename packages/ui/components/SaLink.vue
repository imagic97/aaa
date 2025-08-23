<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  href?: string
}>()
const isExternal = computed(() => props.href && /^[a-z]+:/i.test(props.href))
</script>

<template>
  <component
    :is="href ? isExternal ? 'a' : 'router-link' : 'a'"
    class="sa-link"
    :class="{ link: href }"
    :href="href"
    :to="props.href"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
    draggable="false">
    <slot />
  </component>
</template>
