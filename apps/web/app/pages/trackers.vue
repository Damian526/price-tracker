<script setup lang="ts">
const config = useRuntimeConfig()

// 2. Fetch the trackers from the NestJS backend
// We expect an array of objects matching the ITracker interface from  shared package
const { data: trackers, pending, error } = useFetch(`${config.public.apiBase}/trackers`)
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
          <div class="flex justify-between items-center pt-2">
            <p class="text-xs text-gray-400">
              Checked: {{ tracker.lastCheckedAt ? new Date(tracker.lastCheckedAt).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }) : 'Never' }}
            </p>
            <UButton :to="tracker.url" target="_blank" color="primary" variant="ghost" size="sm">
              Visit Store
            </UButton>
          </div>
        </div>

      </UCard>
    </div>
  </UContainer>
</template>