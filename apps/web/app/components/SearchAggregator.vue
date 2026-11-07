<script setup lang="ts">
import { ref } from 'vue'
import type { ISearchResultItem, SearchSessionStatus } from '@price-tracker/shared'

// 1. Setup Environment & State
const config = useRuntimeConfig()
const query = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<ISearchResultItem[]>([])
const currentStatus = ref<SearchSessionStatus | null>(null)

const handleSearch = async () => {
  if (!query.value.trim()) return

  isLoading.value = true
  error.value = null
  results.value = []
  currentStatus.value = 'pending'

  try {
    // Step A: Send the initial request to the NestJS API
    const sessionResponse = await $fetch<{ sessionId: string }>(`${config.public.apiBase}/search`, {
      method: 'POST',
      body: { query: query.value }
    })

    // Step B: Start polling the database to see if the worker finished
    pollForResults(sessionResponse.sessionId)
  } catch (err) {
    error.value = 'Failed to connect to the server. Is the API running?'
    isLoading.value = false
  }
}

const pollForResults = (sessionId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      // Fetch the latest session state from MongoDB
      const session = await $fetch<{ status: SearchSessionStatus, results: ISearchResultItem[] }>(
        `${config.public.apiBase}/search/${sessionId}`
      )

      currentStatus.value = session.status

      if (session.status === 'completed') {
        clearInterval(pollInterval) // Stop asking
        results.value = session.results
        isLoading.value = false
      } else if (session.status === 'failed') {
        clearInterval(pollInterval) // Stop asking
        error.value = 'The scraper failed to fetch results. Please try again.'
        isLoading.value = false
      }
      // If status is still 'pending', the interval just runs again in 2 seconds.
    } catch (err) {
      clearInterval(pollInterval)
      error.value = 'Lost connection while waiting for results.'
      isLoading.value = false
    }
  }, 2000) // Ask the API every 2,000 milliseconds (2 seconds)
}
</script>

<template>
  <div class="max-w-4xl mx-auto w-full space-y-8">
    <form @submit.prevent="handleSearch" class="flex gap-4 items-center">
      <UInput
        v-model="query"
        icon="i-heroicons-magnifying-glass-20-solid"
        size="lg"
        color="primary"
        variant="outline"
        placeholder="Search for a product (e.g., iPhone 15)..."
        class="flex-1"
        :disabled="isLoading"
      />
      <UButton 
        type="submit" 
        size="lg" 
        color="primary" 
        :loading="isLoading"
      >
        Search
      </UButton>
    </form>

    <UAlert 
      v-if="error" 
      icon="i-heroicons-exclamation-triangle" 
      color="error" 
      variant="soft" 
      :title="error" 
    />
    
    <div v-else-if="isLoading" class="text-center text-gray-500 py-12 flex flex-col items-center gap-4">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
      <p>Scraping stores live... This usually takes 5-10 seconds.</p>
    </div>

    <!-- 3. Empty State (Finished but no results) -->
    <div v-else-if="currentStatus === 'completed' && results.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
      <p class="text-gray-500">We couldn't find any results for "{{ query }}". Try a different term.</p>
    </div>

    <div v-else-if="results.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <UCard v-for="(item, index) in results" :key="index" class="flex flex-col h-full hover:ring-2 ring-primary transition-all">
        <!-- maybe add image in parser -->
        <div v-if="item.imageUrl" class="h-48 w-full bg-white flex items-center justify-center p-4 rounded-t-lg">
          <img :src="item.imageUrl" :alt="item.title" class="max-h-full object-contain" />
        </div>
        
        <div class="flex-1 flex flex-col justify-between space-y-4">
          <div>
            <UBadge color="primary" variant="soft" class="mb-2">{{ item.store }}</UBadge>
            <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2" :title="item.title">
              {{ item.title }}
            </h3>
          </div>
          
          <div class="flex items-end justify-between">
            <span class="text-2xl font-bold text-primary">{{ item.price.toFixed(2) }} PLN</span>
            <UButton :to="item.url" target="_blank" color="primary" variant="ghost" icon="i-heroicons-arrow-top-right-on-square">
              View
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>