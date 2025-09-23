<template>
  <div class="video-container">
    <div class="file-selector">
      <input type="file" id="videoFile" accept="video/*" @change="handleFileSelect" hidden />
      <label for="videoFile" class="file-selector-button"> 选择本地视频 </label>
      <span v-if="selectedFile" class="file-name">
        {{ selectedFile.name }}
      </span>
    </div>

    <template v-if="selectedFile">
      <VideoPlayer :resource="selectedFile" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps<{}>()

const selectedFile = ref<File | null>(null)

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]
  if (!file.type.startsWith('video/')) {
    alert('请选择有效的视频文件')
    return
  }

  selectedFile.value = file
}
</script>

<style scoped></style>
