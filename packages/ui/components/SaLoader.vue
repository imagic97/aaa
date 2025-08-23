<script setup lang="ts" generic="T">
import { ref, onMounted } from 'vue'

enum STATUS {
  LOADING,
  COMPLETE,
  ERROR,
}

let defaultError = 'Unknow Error'
let defaultLoading = 'Loading'

const props = defineProps<{
  immediate?: boolean
  loader: () => Promise<T>
  loading?: boolean
  message?: string
  empty?: boolean
  default?: {
    error: string
    loading: string
  }
}>()

if (props.default) {
  if (props.default.error) {
    defaultError = props.default.error
  }
  if (props.default.loading) {
    defaultLoading = props.default.loading
  }
}

const state = ref<STATUS>(STATUS.LOADING)

const loadedError = ref<Error | null>(null)
const loadedRes = ref<T | null>(null)

const spinning = ref<boolean>(false)

const load = async (isFresh: boolean = false) => {
  try {
    if (state.value !== STATUS.COMPLETE || isFresh) {
      state.value = STATUS.LOADING
    } else {
      spinning.value = true
    }

    const res = await props.loader()

    state.value = STATUS.COMPLETE
    loadedRes.value = res
    return res
  } catch (error) {
    state.value = STATUS.ERROR
    if (error instanceof Error) {
      loadedError.value = error
    } else {
      loadedError.value = new Error(defaultError)
    }
    console.error(error)
  } finally {
    spinning.value = false
  }

  return null
}

onMounted(() => {
  load()
})

defineExpose({
  load,
})
</script>

<template>
  <div class="PtLoader">
    <template v-if="state === STATUS.ERROR">
      <slot name="error" v-bind="{ error: loadedError, load }">
        <div class="PtLoader__wrap">
          <PtAlert @retry="load">
            <span>{{ loadedError?.message ?? defaultError }}</span>

            <template #action>
              <slot name="action" />
            </template>
          </PtAlert>
        </div>
      </slot>
    </template>

    <template v-else-if="state === STATUS.LOADING">
      <slot name="loading">
        <div class="PtLoader__wrap">
          <PtSpinner>{{ props.message ?? defaultLoading }}</PtSpinner>
        </div>
      </slot>
    </template>

    <template v-else-if="props.empty === true || loadedRes === null">
      <div class="PtLoader__wrap">
        <slot name="empty" />
      </div>
    </template>

    <template v-else>
      <slot v-bind="{ result: loadedRes }" />

      <template v-if="spinning || props.loading === true">
        <div class="PtLoader__loading">
          <PtSpinner>{{ props.message }}</PtSpinner>
        </div>
      </template>
    </template>
  </div>
</template>

<style lang="css">
.PtLoader {
  position: relative;
}

.PtLoader__wrap {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.PtLoader__loading {
  background-color: rgba(255, 255, 255, 0.5);

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--pt-zindex-spinner);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}
</style>
