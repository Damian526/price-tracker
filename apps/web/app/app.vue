<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Bar -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <UContainer class="flex items-center justify-between h-16">
        <div class="font-bold text-xl text-primary">
          PriceTracker
        </div>
        <nav class="flex gap-4">
          <!-- NuxtLink is the built-in way to change pages without reloading the browser -->
          <NuxtLink to="/" class="text-gray-600 hover:text-primary font-medium">Search</NuxtLink>
          <NuxtLink to="/trackers" class="text-gray-600 hover:text-primary font-medium">My Trackers</NuxtLink>
        </nav>
      </UContainer>
    </header>

    <!-- NuxtPage acts as a window. The content of your pages (like index.vue or trackers.vue) will appear here -->
    <main class="py-8">
      <NuxtPage />
    </main>
  </div>
</template>