import type { Ref } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { pauseTracking } from '@vue/reactivity'

export function useObjectStorage<T>(key: string, initial: T): Ref<T> {
  const raw = localStorage.getItem(key)
  const data = ref(raw ? JSON.parse(raw) : initial)

  for (const key in initial) {
    if (data.value[key] === undefined)
      data.value[key] = initial[key]
  }

  watch(data, (value) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, { deep: true })

  useEventListener(window, 'storage', (e: StorageEvent) => {
    if (e.key === key && e.newValue) {
      pauseTracking()
      data.value = JSON.parse(e.newValue)
      resumeTracking()
    }
  })

  return data
}

export function useTransform<F, T>(data: Ref<F>, to: (data: F) => T, from: (data: T) => F): Ref<T> {
  return computed({
    get() {
      return to(data.value)
    },
    set(value) {
      data.value = from(value)
    },
  })
}

export function useEventListener(target: EventTarget, type: string, listener: any, options?: boolean | AddEventListenerOptions) {
  target.addEventListener(type, listener, options)
  onScopeDispose(() => target.removeEventListener(type, listener, options))
}

function resumeTracking() {
  throw new Error('Function not implemented.')
}
