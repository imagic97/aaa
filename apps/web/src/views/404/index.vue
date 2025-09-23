<script setup lang="ts">
import { ref } from 'vue'
import { SaSvg, SaSvgControl, SaSvgText } from 'ui'

const saSvgControl = ref(new SaSvgControl<string, {}>([]))
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <SaSvg :control="saSvgControl">
      <SaSvgText :canvas-ctx="saSvgControl.canvasCtx" :text="'111'" :width="200" />
    </SaSvg>
  </div>
</template>
