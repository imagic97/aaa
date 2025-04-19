<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import clipboard from '@/services/clipboard'

const route = useRoute()

const ipAddress = ref<{ ipAddress: string, timestamp: string }>()

const items = computed(() => {
  if (!ipAddress.value) return []
  return ipAddress.value.ipAddress.split(/\s+/)
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

const doCopy = (item: string) => {
  clipboard.copy(item)
}

onMounted(() => {
  let issueNumber = 3
  if (route.query && typeof route.query.issue === 'string') {
    issueNumber = parseInt(route.query.issue)
    if(isNaN(issueNumber)) {
      issueNumber = 3
    }
  }
  let matches = window.location.href.match(/https:\/\/([^\/]+)\.github\.io\/([^\/]+)\/#/)

  if (matches) {
    fetchInfo({ repo: matches[2], username: matches[1], issueNumber })
  }
})
</script>

<template>
  <h4>time: {{ ipAddress?.timestamp }}</h4>
  <div v-for="(item, index) in items">
    <label>ipv6_{{ index + 1 }}: </label>
    <span>[{{ item }}]</span>
    <button @click="doCopy(item)">copy</button>
  </div>
</template>
