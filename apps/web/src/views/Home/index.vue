<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SaLoader, SaButton, SaInput, SaSfc, SaLink, useRouterStack } from 'ui'

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

    <SaButton disabled style="height: 80px;">按钮</SaButton>
    <SaButton disabled color="primary">按钮</SaButton>
    <SaButton disabled color="danger">按钮</SaButton>

    <SaButton type="rounded" style="height: 160px;">按钮</SaButton>
    <SaButton type="rounded" color="primary">按钮</SaButton>
    <SaButton type="rounded" color="danger">按钮</SaButton>

    <SaButton type="circle"> </SaButton>
    <SaButton type="circle" color="primary"> </SaButton>
    <SaButton type="circle" color="danger"> </SaButton>

    <SaButton :loading="true" style="">加载中</SaButton>
    <SaButton :loading="true" type="rounded" color="primary">加载中</SaButton>
    <SaButton :loading="aaa" type="circle"></SaButton>
  </div>

  <SaLink href="#a">文本链接</SaLink>

  <SaLink href="/404">404</SaLink>
  <SaLink href="/unknow">unknow</SaLink>

  <SaInput placeholder="文本输入" />

  <SaButton @click="isOpenWindow = !isOpenWindow">{{ isOpenWindow }}</SaButton>

  <SaButton @click="openModal.do()">openModal{{ isOpenWindow2 }}</SaButton>
  <SaButton @click="openModal.back()">closeModal{{ isOpenWindow2 }}</SaButton>

  <div class="wrapper">
    <div>一</div>
    <div style="height: 100%; grid-column: 2;  grid-row: 1 / 3;">二</div>
    <div style="height: 120px;">三</div>
    <div>四</div>
    <div>五</div>
  </div>
</template>

<style lang="scss" scoped>
.layout-columns {
  width: 260px;
  columns: 3;
  column-gap: 12px;
  row-gap: 12px;
  column-width: auto;

  &+& {
    margin-top: 12px;
  }
}

.wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 10px;
  border: 2px solid #f76707;
  border-radius: 5px;
  background-color: #fff4e6;
}

.wrapper>div {
  box-sizing: border-box;
  height: 80px;
  border: 2px solid #ffa94d;
  border-radius: 5px;
  background-color: #ffd8a8;
  padding: 1em;
  color: #d9480f;
}
</style>
