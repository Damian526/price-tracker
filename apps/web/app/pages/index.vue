<script setup lang="ts">
// Nuxt auto-imports components, so you don't need an explicit import for SearchAggregator
useHead({
  title: 'Price Tracker & Aggregator',
  meta: [
    { name: 'description', content: 'Search and track prices across Polish electronics stores.' }
  ]
})
</script>

<template>
  <UContainer class="py-16 space-y-12">
    <div class="text-center max-w-2xl mx-auto space-y-4">
      <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
        Find the best tech prices.
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Instantly search X-Kom (and more coming soon) to compare prices, or set up a tracker to get emailed when a price drops.
      </p>
    </div>

    <SearchAggregator />
  </UContainer>
</template>