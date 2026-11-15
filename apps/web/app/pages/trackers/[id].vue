<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ITracker, IPriceSnapshot } from '@price-tracker/shared'

const route = useRoute() // Gives us access to the [id] in the URL
const config = useRuntimeConfig()
const toast = useToast()

const trackerId = route.params.id as string
const isCheckingNow = ref(false)

// 1. Fetch both the Tracker details AND its 30-day Price History in parallel
const {
  data: tracker,
  pending: trackerPending,
  refresh: refreshTracker,
} = useFetch<ITracker>(`${config.public.apiBase}/trackers/${trackerId}`)

const {
  data: snapshots,
  pending: historyPending,
  refresh: refreshHistory,
} = useFetch<IPriceSnapshot[]>(`${config.public.apiBase}/trackers/${trackerId}/history`)

// 2. Computed Analytics: Calculate 30-Day Lowest and Highest prices automatically
const lowestPrice = computed(() => {
  if (!snapshots.value || snapshots.value.length === 0) return null
  return Math.min(...snapshots.value.map(s => s.price))
})

const highestPrice = computed(() => {
  if (!snapshots.value || snapshots.value.length === 0) return null
  return Math.max(...snapshots.value.map(s => s.price))
})

// 3. Manual "Check Price Now" button handler
const handleManualCheck = async () => {
  isCheckingNow.value = true
  try {
    await $fetch(`${config.public.apiBase}/trackers/${trackerId}/check`, {
      method: 'POST',
    })
    toast.add({
      title: 'Scrape job queued!',
      description: 'Playwright is checking the store now. Refreshing in 6 seconds...',
      icon: 'i-heroicons-arrow-path',
      color: 'primary',
    })

    // Wait 6 seconds for Playwright to finish, then reload the chart and price!
    setTimeout(async () => {
      await Promise.all([refreshTracker(), refreshHistory()])
      isCheckingNow.value = false
    }, 6000)
  } catch (err) {
    toast.add({
      title: 'Could not trigger check',
      color: 'primary',
      icon: 'i-heroicons-exclamation-circle',
    })
    isCheckingNow.value = false
  }
}
</script>

<template>
  <UContainer class="space-y-8">
    <!-- Back Navigation -->
    <div>
      <UButton
        to="/trackers"
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
      >
        Back to My Trackers
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="trackerPending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary" />
    </div>

    <!-- Main Detail Content -->
    <div v-else-if="tracker" class="space-y-8">
      <!-- Top Product Overview Card -->
      <UCard>
        <div class="flex flex-col md:flex-row gap-6 items-center">
          <!-- Product Image -->
          <div
            v-if="tracker.imageUrl"
            class="w-40 h-40 bg-white rounded-lg p-3 flex items-center justify-center shrink-0"
          >
            <img
              :src="tracker.imageUrl"
              :alt="tracker.title"
              class="max-h-full object-contain"
            />
          </div>

          <!-- Title & Actions -->
          <div class="flex-1 space-y-3">
            <div class="flex items-center gap-2">
              <UBadge color="gray" variant="soft">{{ tracker.store }}</UBadge>
              <UBadge color="primary" variant="subtle">{{ tracker.lastStatus }}</UBadge>
            </div>

            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ tracker.title || 'Scraping product title...' }}
            </h1>

            <p class="text-xs text-gray-400">
              Last checked:
              {{ tracker.lastCheckedAt ? new Date(tracker.lastCheckedAt).toLocaleString() : 'Pending first check' }}
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <UButton
                color="primary"
                icon="i-heroicons-bolt"
                :loading="isCheckingNow"
                @click="handleManualCheck"
              >
                Check Price Now
              </UButton>

              <UButton
                :to="tracker.url"
                target="_blank"
                color="gray"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
              >
                View on {{ tracker.store }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 4 Key Price Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard>
          <p class="text-xs text-gray-500 uppercase font-bold">Current Price</p>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
            {{ tracker.currentPrice ? `${tracker.currentPrice.toFixed(2)} ${tracker.currency}` : '---' }}
          </p>
        </UCard>

        <UCard>
          <p class="text-xs text-gray-500 uppercase font-bold">Your Target Price</p>
          <p class="text-2xl font-extrabold text-primary mt-1">
            {{ tracker.targetPrice.toFixed(2) }} {{ tracker.currency }}
          </p>
        </UCard>

        <UCard>
          <p class="text-xs text-gray-500 uppercase font-bold">30-Day Lowest</p>
          <p class="text-2xl font-extrabold text-green-500 mt-1">
            {{ lowestPrice ? `${lowestPrice.toFixed(2)} ${tracker.currency}` : '---' }}
          </p>
        </UCard>

        <UCard>
          <p class="text-xs text-gray-500 uppercase font-bold">30-Day Highest</p>
          <p class="text-2xl font-extrabold text-gray-400 mt-1">
            {{ highestPrice ? `${highestPrice.toFixed(2)} ${tracker.currency}` : '---' }}
          </p>
        </UCard>
      </div>

      <!-- 30-Day Price History Chart Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              30-Day Price History
            </h2>
            <span class="text-xs text-gray-400">
              {{ snapshots?.length || 0 }} data points recorded
            </span>
          </div>
        </template>

        <div v-if="historyPending" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <PriceChart
          v-else
          :snapshots="snapshots || []"
          :currency="tracker.currency || 'PLN'"
        />
      </UCard>
    </div>
  </UContainer>
</template>
