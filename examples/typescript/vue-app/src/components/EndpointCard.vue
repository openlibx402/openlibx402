<template>
  <div class="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold mb-2">{{ title }}</h3>
        <p class="text-gray-600 mb-2">{{ description }}</p>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">
          {{ method }} {{ endpoint }}
        </code>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">Price</div>
        <div class="text-lg font-bold">
          {{ price === "0" ? "FREE" : `${price} USDC` }}
        </div>
      </div>
    </div>

    <button
      @click="handleFetch"
      :disabled="loading"
      class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {{ loading ? "Loading..." : "Try Endpoint" }}
    </button>

    <div v-if="result" class="mt-4 p-4 bg-green-50 border border-green-200 rounded">
      <div class="text-sm font-semibold text-green-800 mb-2">
        ✅ Response:
      </div>
      <pre class="text-xs overflow-auto max-h-48">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>

    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded">
      <div class="text-sm font-semibold text-red-800 mb-2">❌ Error:</div>
      <pre class="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-48">{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  description: string
  endpoint: string
  method?: string
  price: string
  onFetch: () => Promise<any>
}>()

const loading = ref(false)
const result = ref<any>(null)
const error = ref<string | null>(null)

const handleFetch = async () => {
  loading.value = true
  error.value = null
  result.value = null

  try {
    const data = await props.onFetch()
    result.value = data
  } catch (err) {
    console.error('Endpoint error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    error.value = errorMsg
  } finally {
    loading.value = false
  }
}
</script>
