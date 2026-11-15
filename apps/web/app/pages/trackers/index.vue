<script setup lang="ts">
import type { ITracker } from '@price-tracker/shared'

const config = useRuntimeConfig()
const toast = useToast()

const {
  data: trackers,
  pending,
  error,
  refresh: refreshTrackers,
} = useFetch<ITracker[]>(`${config.public.apiBase}/trackers`)

const deleteTracker = async (id: string | undefined) => {
  if (!id) return
  if (!confirm('Are you sure you want to delete this tracker?')) return

  try {
    await $fetch(`${config.public.apiBase}/trackers/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: 'Tracker deleted',
      color: 'primary',
      icon: 'i-heroicons-trash',
    })
    await refreshTrackers()
  } catch (err) {
    toast.add({
      title: 'Failed to delete tracker',
      color: 'primary',
      icon: 'i-heroicons-exclamation-circle',
    })
  }
}
</script>

<template>
  <UContainer class="space-y-8">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          My Trackers
        </h1>
        <p class="text-gray-500">
          Monitor your saved products and click any item to view its 30-day price chart.
        </p>
      </div>
      <UButton
        color="gray"
        variant="soft"
        icon="i-heroicons-arrow-path"
        :loading="pending"
        @click="refreshTrackers()"
      >
        Refresh List
      </UButton>
    </div>

    <!-- Loading Spinner -->
    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="primary"
      variant="soft"
      title="Failed to load trackers"
      description="Make sure your NestJS API and MongoDB are running."
    />

    <!-- Empty State -->
    <div
      v-else-if="!trackers || trackers.length === 0"
      class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        No trackers yet
      </h3>
      <p class="text-gray-500 mt-1">
        Search for a product first and click "Track Price" to start monitoring.
      </p>
      <UButton to="/" color="primary" class="mt-4">
        Go to Search
      </UButton>
    </div>

    <!-- Trackers Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="tracker in trackers"
        :key="tracker._id"
        class="flex flex-col h-full hover:ring-2 ring-primary transition-all"
      >
        <!-- Product Image -->
        <div
          v-if="tracker.imageUrl"
          class="h-44 w-full bg-white rounded-lg p-3 mb-4 flex items-center justify-center"
        >
          <img
            :src="tracker.imageUrl"
            :alt="tracker.title || 'Product'"
            class="max-h-full object-contain"
          />
        </div>

        <!-- Store & Status Badges -->
        <div class="flex justify-between items-center mb-3">
          <UBadge color="gray" variant="soft">{{ tracker.store }}</UBadge>
          <UBadge
            :color="tracker.lastStatus === 'ok' ? 'primary' : 'gray'"
            variant="subtle"
          >
            {{ tracker.lastStatus }}
          </UBadge>
        </div>

        <!-- Product Title (Clickable link to Detail Page) -->
        <NuxtLink
          :to="`/trackers/${tracker._id}`"
          class="font-semibold text-gray-900 dark:text-white hover:text-primary line-clamp-2 mb-4"
        >
          {{ tracker.title || 'Scraping product details...' }}
        </NuxtLink>

        <!-- Current vs Target Price -->
        <div class="mt-auto space-y-4">
          <div class="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <p class="text-xs text-gray-500 uppercase font-bold">Current</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ tracker.currentPrice ? `${tracker.currentPrice.toFixed(2)} ${tracker.currency}` : '---' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 uppercase font-bold">Target</p>
              <p class="text-lg font-semibold text-primary">
                {{ tracker.targetPrice.toFixed(2) }} {{ tracker.currency }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-between items-center pt-1">
            <UButton
              :to="`/trackers/${tracker._id}`"
              color="primary"
              variant="soft"
              size="sm"
              icon="i-heroicons-presentation-chart-line"
            >
              30-Day Chart
            </UButton>

            <div class="flex gap-1">
              <UButton
                :to="tracker.url"
                target="_blank"
                color="gray"
                variant="ghost"
                size="sm"
                icon="i-heroicons-arrow-top-right-on-square"
              />
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                icon="i-heroicons-trash"
                @click="deleteTracker(tracker._id)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
