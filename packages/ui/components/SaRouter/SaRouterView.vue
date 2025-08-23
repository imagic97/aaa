<script setup lang="ts">
import {
  type Component,
  ref,
  markRaw,
  watch,
  computed,
  onBeforeUnmount
} from 'vue'
import {
  useRouter,
  type RouteLocationNormalizedLoadedGeneric
} from 'vue-router'

import PtRouter, { PtLifecycleHooks, type RouterType } from './SaRouter'

interface RouteItem {
  name: string
  fullPath: string
  query: any
  params: any
}

interface Item {
  needInitial?: boolean
  keepalive?: boolean
  key: string
  title: string
  icon: string | null
  route: RouteItem
  component: Component
  bind: { [key: string]: any }
  on: { [key: string]: any }
}

interface DefaultRoute { name: string, path?: string }

const props = defineProps<{
  default?: DefaultRoute
}>()

const router = useRouter()

const items = ref<Array<Item>>([])

const current = ref<string | null>(null)

const initView = computed<Item | null>(() => {
  if (props.default === undefined) return null

  const item = props.default
  const initItem = router.getRoutes().find(el => el.name === item.name || el.path === item.path)
  if (initItem === undefined || !initItem.components) return null

  const key = `view-${String(initItem.name)}`
  return {
    keepalive: true,
    needInitial: true,
    key: key,
    title: initItem.meta.title ?? item.name,
    icon: null,
    route: {
      name: props.default.name ?? '',
      fullPath: props.default.path ?? '',
      query: {},
      params: {},
    },
    component: markRaw(initItem.components),
    bind: {
      viewKey: key
    },
    on: {
      'route-update': (params: any) => onRouteUpdate({ key, params }),
      'route-close': (params: any) => onRouteClose({ key, params }),
    },
  }
})

if (initView.value !== null) {
  items.value = [initView.value]
  current.value = initView.value.key
}

/**
 * 视图入栈
 */
const push = ({
  key,
  title,
  route,
  component,
  bind,
  on
}: {
  key: string
  title: string
  route: RouteLocationNormalizedLoadedGeneric
  component: Component
  bind?: { [key: string]: any }
  on?: { [key: string]: any }
}): Promise<void> => {
  const existsIndex = items.value.findIndex(item => item.key === key)
  if (existsIndex !== -1) {
    current.value = items.value[existsIndex].key
    return Promise.resolve()
  }

  return Promise.resolve()
    .then(async () => {
      items.value.push({
        key,
        title,
        icon: null,
        route,
        component: component,
        bind: {
          ...bind,
          viewKey: key,
        },
        on: {
          ...on
        }
      })

      current.value = key
    })
}

/**
 * 关闭视图
 *
 * @param index 视图栈索引下标
 */
const closeByIndex = (index?: number) => {
  if (index === undefined) {
    index = items.value.findIndex(el => el.key === current.value)
  }
  if (index === undefined || items.value[index] === undefined) return

  if (current.value === items.value[index].key) {
    if (index !== 0) {
      current.value = items.value[index - 1].key
    } else if (items.value.length > 1) {
      current.value = items.value[1].key
    } else {
      current.value = null
    }
  }

  items.value.splice(index, 1)
}

/**
 * 关闭其他视图
 *
 * @param index 视图栈索引下标
 */
const closeOthersByIndex = (index: number) => {
  if (items.value[index] === undefined) return

  if (current.value !== items.value[index].key) {
    current.value = items.value[index].key
  }

  items.value = items.value.filter((el, _index) => {
    if (el.keepalive === true) return true

    if (index === _index) return true

    return false
  })
}

/**
 * 关闭前序的其他视图
 *
 * @param index 视图栈索引下标
 */
const closePrevOthersByIndex = (index: number) => {
  if (items.value[index] === undefined) return

  const currentIndex = items.value.findIndex(item => item.key === current.value)

  if (currentIndex === -1) return

  if (currentIndex < index) {
    current.value = items.value[index].key
  }

  items.value = items.value.filter((el, _index) => {
    if (el.keepalive === true) return true

    if (_index >= currentIndex) return true

    return false
  })
}

/**
 * 关闭后序的其他视图
 *
 * @param index 视图栈索引下标
 */
const closeNextOthersByIndex = (index: number) => {
  if (items.value[index] === undefined) return

  const currentIndex = items.value.findIndex(item => item.key === current.value)

  if (currentIndex === -1) return

  if (currentIndex > index) {
    current.value = items.value[index].key
  }

  items.value = items.value.filter((el, _index) => {
    if (el.keepalive === true) return true

    if (_index <= currentIndex) return true

    return false
  })
}

/**
 * 关闭所有视图
 *
 * @param index 视图栈索引下标
 */
const closeAll = () => {
  current.value = null

  items.value = items.value.filter(el => el.keepalive === true)
  if (items.value.length > 0) {
    current.value = items.value[0].key
  }
}

/**
 * 回调：视图标签被单击
 *
 * @param item 视图
 * @param index 视图栈索引下标
 */
const onClickItem = (item: Item, index: number) => {
  router.push(item.route)
}

/**
 * 回调：视图标签关闭被单击
 *
 * @param item 视图
 * @param index 视图栈索引下标
 */
const onClickItemClose = (item: Item, index: number) => {
  closeByIndex(index)
}


const getKeepKey = (route: RouteLocationNormalizedLoadedGeneric) => {
  return `view-${JSON.stringify({ fullPath: route.fullPath, query: route.query })}`
}

/**
 * 回调：视图组件触发更新
 * @param payload 视图 emit 传参
 */
const onRouteUpdate = (payload: { key: string | null, params?: { [key: string]: any } }) => {
  const existsItem = items.value.find(item => item.key === payload.key)
  if (existsItem !== undefined) {
    if (payload.params !== undefined && 'title' in payload.params) {
      existsItem.title = payload.params.title
    }
    if (payload.params !== undefined && 'icon' in payload.params) {
      existsItem.icon = payload.params.icon || null
    }
  }
}

/**
 * 回调：视图组件触发关闭
 * @param payload 视图 emit 传参
 */
const onRouteClose = (payload: { key: string | null, params: { [key: string]: any } }) => {
  const index = items.value.findIndex(item => item.key === payload.key)
  if (index >= 0) {
    onClickItemClose(items.value[index], index)
  }
}

/** 用来更新路由 */
watch(() => current.value, (val, oldValue) => {
  PtRouter.triggerHook(oldValue, PtLifecycleHooks.DEACTIVATED)
  PtRouter.triggerHook(val, PtLifecycleHooks.ACTIVATED)

  let item = items.value.find(item => item.key === val)
  if (item) {
    router.push(item.route)
  } else if (val === null) {
    replaceDefalutView()
  }
})

/** 用来更新路由 */
watch(() => items.value.map(el => el.key), (values, oldValues) => {
  oldValues.forEach(el => {
    if (!values.includes(el)) {
      PtRouter.unregisterHook(el)
    }
  })
}, { deep: true })

const replaceDefalutView = () => {
  const route = props.default
  if (route !== undefined) {
    router.push(route)
  } else {
    router.push({ path: '/' })
  }
}

const componentExpose: RouterType = {
  closeByIndex,
  closeOthersByIndex,
  closePrevOthersByIndex,
  closeNextOthersByIndex,
  closeAll,
  getSize: () => {
    return items.value.length
  },
  getCurrentViewKey: () => current.value
}

PtRouter.register(componentExpose)

onBeforeUnmount(() => {
  PtRouter.unregister()
})

defineExpose(componentExpose)

const doRouteUpdate = (route?: RouteLocationNormalizedLoadedGeneric, component?: Component): boolean => {
  if (!component || !route) return false

  if (initView.value !== null && typeof route.name === 'string' && initView.value.key === `view-${route.name}`) {
    document.title = initView.value.title
    current.value = initView.value.key

    // 初次打开视图非初始视图时执行
    initView.value.component = component
    items.value[0].needInitial = false
    return true
  }

  let key = getKeepKey(route)
  let found = items.value.find(item => item.key === key)

  if (found === undefined) {
    push({
      key: key,
      title: route.meta.title ?? '……',
      route,
      bind: {
        ...route.params,
        params: route.query,
        viewKey: key,
      },
      on: {
        'route-update': (params: any) => onRouteUpdate({ key, params }),
        'route-close': (params: any) => onRouteClose({ key, params }),
      },
      component: component
    })
  } else {
    document.title = found.title
  }

  current.value = key

  return true
}
</script>

<template>
  <router-view>
    <template #default="{ Component, route }">
      <template v-if="doRouteUpdate(route, Component)">
        <div class="SaRouterView">
          <slot name="header" v-bind="{ items, current }" />
          <div class="SaRouterView__body">
            <template v-for="(item, index) in items" :key="item.key">
              <div class="SaRouterView__item" :style="{ display: current === item.key ? 'block' : 'none' }">
                <template v-if="!(item.needInitial === true)">
                  <component
                    :is="item.component"
                    v-bind="item.bind"
                    v-on="item.on"
                    @routeClose="onClickItemClose(item, index)" />
                </template>
              </div>
            </template>
          </div>
        </div>
      </template>
    </template>
  </router-view>
</template>
