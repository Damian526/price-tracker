<script setup lang="ts">
import type { IPriceSnapshot, ITracker } from '@price-tracker/shared'

const config = useRuntimeConfig()
const toast = useToast()
// 2. Fetch the trackers from the NestJS backend
// We expect an array of objects matching the ITracker interface from  shared package
const { data: trackers, pending, error, execute: refreshTrackers } = useFetch(`${config.public.apiBase}/trackers`)

const isChartOpen = ref(false)
const selectedTracker = ref<ITracker | null>(null)
const historyData = ref<IPriceSnapshot[]>([])
const isLoadingHistory = ref(false)

const deleteTracker = async (id: string | undefined) => {
  if (!id) return
  if (!confirm('Are you sure you want to delete this tracker?')) return

  try {
    await $fetch(`${config.public.apiBase}/trackers/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Tracker deleted', color: 'primary', icon: 'i-heroicons-trash' })
    refreshTrackers() // Reload the grid
  } catch (err) {
    toast.add({ title: 'Failed to delete tracker', color: 'error', icon: 'i-heroicons-exclamation-circle' })
  }
}
const openChart = async (tracker: ITracker) => {
  selectedTracker.value = tracker
  isChartOpen.value = true
  isLoadingHistory.value = true

  try {
    // Fetch the history array from your new API endpoint
    historyData.value = await $fetch<IPriceSnapshot[]>(`${config.public.apiBase}/trackers/${tracker._id}/history`)
  } catch (err) {
    toast.add({ title: 'Could not load history', color: 'error' })
  } finally {
    isLoadingHistory.value = false
  }
}
</script>

<template>
  <UContainer class="space-y-8">
    
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Trackers</h1>
      <p class="text-gray-500">Products you are currently monitoring for price drops.</p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <UAlert 
      v-else-if="error" 
      icon="i-heroicons-exclamation-triangle" 
      color="error" 
      title="Failed to load trackers" 
      description="Make sure your NestJS API and MongoDB are running."
    />

    <!-- Empty State (No trackers yet) -->
    <div v-else-if="trackers?.length === 0" class="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
      <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium">No trackers found</h3>
      <p class="text-gray-500 mt-1">Go to the search page to add your first product.</p>
      <UButton to="/" color="primary" class="mt-4">Search Products</UButton>
    </div>

    <!-- The Data Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- v-for is a loop. It creates one UCard for every item in the trackers array -->
      <UCard v-for="tracker in trackers" :key="tracker._id" class="flex flex-col h-full">
        
        <!-- Top row: Status Badge and Store Name -->
        <div class="flex justify-between items-start mb-4">
          <UBadge color="primary" variant="soft">{{ tracker.store }}</UBadge>
          
          <!-- Dynamic Badge Color based on status -->
          <UBadge 
            :color="tracker.lastStatus === 'ok' ? 'success' : tracker.lastStatus === 'failed' ? 'error' : 'success'"
          >
            {{ tracker.lastStatus }}
          </UBadge>
        </div>

        <!-- Product Image -->
        <div v-if="tracker.imageUrl" class="h-40 w-full bg-white flex items-center justify-center p-2 rounded-lg mb-4">
          <img :src="tracker.imageUrl" :alt="tracker.title" class="max-h-full object-contain" />
        </div>

        <!-- Product Title -->
        <h3 class="font-semibold text-gray-900 line-clamp-2 mb-6" :title="tracker.title || tracker.url">
          {{ tracker.title || 'Unknown Product (Waiting for first scrape)' }}
        </h3>

        <!-- Price Details -->
        <div class="mt-auto space-y-4">
          <div class="flex justify-between items-end border-b pb-4">
            <div>
              <p class="text-xs text-gray-500 uppercase font-bold tracking-wider">Current</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ tracker.currentPrice ? `${tracker.currentPrice} ${tracker.currency}` : '---' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 uppercase font-bold tracking-wider">Target</p>
              <p class="text-lg font-semibold text-primary">
                {{ tracker.targetPrice }} {{ tracker.currency }}
              </p>
            </div>
          </div>

<!-- Bottom Actions -->
          <div class="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
            <UButton :to="tracker.url" target="_blank" color="info" variant="ghost" size="sm" icon="i-heroicons-arrow-top-right-on-square">
              Store
            </UButton>
            
            <div class="flex gap-2">
              <UButton color="primary" variant="soft" size="sm" icon="i-heroicons-chart-bar" @click="openChart(tracker)">
                History
              </UButton>
              <UButton color="error" variant="ghost" size="sm" icon="i-heroicons-trash" @click="deleteTracker(tracker._id)" />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- modal with chart -->
    <UModal v-model:open="isChartOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                Price History: {{ selectedTracker?.title }}
              </h3>
              <UButton color="info" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isChartOpen = false" />
            </div>
          </template>

          <div v-if="isLoadingHistory" class="flex justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
          </div>
          
          <div v-else>
            <!-- Render the Chart Component -->
            <PriceChart 
              :snapshots="historyData" 
              :currency="selectedTracker?.currency || 'PLN'" 
            />
          </div>
        </UCard>
      </template>
    </UModal>

  </UContainer>
</template>