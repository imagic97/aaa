<script setup lang="ts">
import { onMounted, ref } from 'vue'

const ipAddress = ref<string>('')

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

onMounted(() => {
  let matches = window.location.href.match(/https:\/\/([^\/]+)\.github\.io\/([^\/]+)\/#/)

  if (matches) {
    fetchInfo({ repo: matches[2], username: matches[1], issueNumber: 2 })
  }
})
</script>

<template>{{ ipAddress }}</template>