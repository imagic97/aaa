<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import clipboard from '@/services/clipboard'

const ipAddress = ref<string>('')

const items = computed(() => {
  return ipAddress.value.split(/\s+/)
})

const fetchInfo = ({ username, repo, issueNumber }: { username: string, repo: string, issueNumber: number }) => {
  const url = `https://api.github.com/repos/${username}/${repo}/issues/${issueNumber}`
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Error!')
      }
      return response.json()
    })
    .then(issueData => {
      ipAddress.value = JSON.parse(issueData.body)
    })
    .catch(error => {
      console.error(error)
    })
}

const doCopy = (item:string) => {
  clipboard.copy(item)
}

onMounted(() => {
  let matches = window.location.href.match(/https:\/\/([^\/]+)\.github\.io\/([^\/]+)\/#/)

  if (matches) {
    fetchInfo({ repo: matches[2], username: matches[1], issueNumber: 2 })
  }
})
</script>

<template>
  <div v-for="(item, index) in items">
    <label>ipv6_{{ index+1 }}: </label>
    <span>[{{ item }}]</span>
    <button @click="doCopy(item)">copy</button>
  </div>
</template>
