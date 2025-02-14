<script setup lang="ts">
import Fuse from 'fuse.js'

definePageMeta({
  icon: 'carbon-assembly-reference',
  title: 'Virtual Files',
})

interface VfsData {
  rootDir: string
  entries: {
    id: string
    path: string
  }[]
}

interface VfsFile {
  id: string
  content: string
}

const searchString = ref('')

const { data } = await useFetch<VfsData>('/_vfs.json', {
  key: 'vfs-list',
  baseURL: '/',
  responseType: 'json',
})

const fileId = computed(() => useRoute().query?.id as string | undefined)

const current = ref<VfsFile>()

watchEffect(() => {
  if (!fileId.value)
    return
  const url = `/_vfs.json/${encodeURIComponent(fileId.value)}`
  fetch(url)
    .then(i => i.json())
    .then(i => current.value = i.current)
})

function toShortPath(path: string) {
  if (!data.value?.rootDir)
    return
  return path.startsWith(data.value?.rootDir)
    ? path.slice(data.value.rootDir.length)
    : path
}

const files = computed(() => {
  if (!data.value)
    return []
  return data.value.entries
    // Hide Nuxt dist files, as they are aliased as `#build`
    .filter(i => !i.id.startsWith(`${data.value?.rootDir || ''}/.nuxt/`))
    .sort((a, b) => a.id.localeCompare(b.id))
})

const fuse = computed(() => new Fuse(files.value, {
  keys: [
    'id',
    'path',
  ],
}))

const filteredFiles = computed(() => {
  if (!searchString.value)
    return files.value
  return fuse.value.search(searchString.value).map(i => i.item)
})
</script>

<template>
  <div grid="~ cols-[auto_1fr]" h-full of-hidden class="virtual-files">
    <div border="r base" of-auto resize-x w="300px">
      <div pb2 p3>
        <NTextInput
          v-model="searchString"
          icon="carbon-search"
          placeholder="Search..."
          n="primary"
        />
      </div>
      <NuxtLink
        v-for="f of filteredFiles" :key="f.id"
        border="b base" px2 py1 text-sm font-mono block truncate
        :to="`/modules/virtual-files?id=${encodeURIComponent(f.id)}`"
        :class="f.id === current?.id ? 'bg-truegray:20 text-base' : 'text-truegray'"
      >
        {{ toShortPath(f.id) }}
      </NuxtLink>
    </div>
    <div v-if="current?.content" h-full of-hidden flex="~ col">
      <div border="b base" px4 py2 text-sm op75 flex-none>
        <code>{{ current.id }}</code>
      </div>
      <pre of-auto h-full text-sm v-html="highlight(current?.content, 'typescript')" />
    </div>
    <span v-else flex items-center justify-center op50>Select one file to start</span>
  </div>
</template>

<style>
.virtual-files .shiki {
  padding: 10px;
  background: none !important;
}
</style>
