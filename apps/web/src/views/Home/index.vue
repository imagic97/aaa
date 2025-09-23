<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SaLoader, SaButton, SaInput, SaSfc, SaLink, useRouterStack } from 'ui'
import { ref } from 'vue'

const loader = async () => {
  const res = await new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve('hello')
    }, 2000)
  })

  return res
}

const router = useRouter()

const isOpenWindow = useRouterStack()

const openModal = {
  do: () => {
    return Promise.resolve(1)
  },
  back: () => {
    return Promise.resolve()
  }
}

const isOpenWindow2 = useRouterStack(openModal)

const aaa = loader()

</script>

<template>
  <SaSfc :code="`\<template\>SaSfc\</template\>`" />

  <div class="layout-columns">
    <SaButton>按钮</SaButton>
    <SaButton color="primary">按钮</SaButton>
    <SaButton color="danger">按钮</SaButton>
  </div>

  <div class="layout-columns">
    <SaButton disabled>按钮</SaButton>
    <SaButton disabled color="primary">按钮</SaButton>
    <SaButton disabled color="danger">按钮</SaButton>
  </div>

  <div class="layout-columns">
    <SaButton type="rounded">按钮</SaButton>
    <SaButton type="rounded" color="primary">按钮</SaButton>
    <SaButton type="rounded" color="danger">按钮</SaButton>
  </div>

  <div class="layout-columns">
    <SaButton type="circle">&times;</SaButton>
    <SaButton type="circle" color="primary">&times;</SaButton>
    <SaButton type="circle" color="danger">&times;</SaButton>
  </div>

  <div class="layout-columns">
    <SaButton :loading="true" style="">加载中</SaButton>
    <SaButton :loading="true" type="rounded" color="primary">加载中</SaButton>
    <SaButton :loading="aaa" type="circle">&times;</SaButton>
  </div>

  <div class="layout-columns">

    <SaLink href="#a">文本链接</SaLink>

    <SaLink href="/404">404</SaLink>
    <SaLink href="/unknow">unknow</SaLink>

    <SaInput placeholder="文本输入" />

    <SaButton @click="isOpenWindow = !isOpenWindow">{{ isOpenWindow }}</SaButton>

    <SaButton @click="openModal.do()">openModal{{ isOpenWindow2 }}</SaButton>
    <SaButton @click="openModal.back()">closeModal{{ isOpenWindow2 }}</SaButton>
  </div>
</template>

<style lang="scss" scoped>
.layout-columns {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-width: auto;
  gap: 12px;

  &+& {
    margin-top: 12px;
  }
}
</style>
