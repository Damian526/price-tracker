<script setup lang="ts">
const route = useRoute()

const navItems = computed(() => [
  { label: 'Search', to: '/', active: route.path === '/' },
  { label: 'My Trackers', to: '/trackers', active: route.path.startsWith('/trackers') }
])
</script>

<template>
  <!-- UApp provides the toast, tooltip and overlay providers Nuxt UI needs -->
  <UApp>
    <div class="min-h-screen bg-default">
      <!-- Navigation Bar -->
      <header class="sticky top-0 z-10 bg-default/80 backdrop-blur border-b border-default">
        <UContainer class="flex items-center justify-between h-16">
          <NuxtLink
            to="/"
            class="font-bold text-xl text-primary"
          >
            PriceTracker
          </NuxtLink>
          <UNavigationMenu
            :items="navItems"
            variant="link"
            color="primary"
          />
        </UContainer>
      </header>

      <main class="py-8">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
