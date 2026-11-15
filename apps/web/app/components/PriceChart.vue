<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { IPriceSnapshot } from '@price-tracker/shared'

// Register ChartJS modules
ChartJS.register(Filler, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  snapshots: IPriceSnapshot[]
  currency: string
}>()

// Chart.js draws on a canvas and can't use Tailwind classes, so read the theme
// colours from Nuxt UI's CSS variables (falls back to the brand green on SSR).
const theme = ref({ primary: '#00C16A', grid: '#e2e8f0', text: '#64748b' })

onMounted(() => {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  theme.value = {
    primary: read('--ui-primary', theme.value.primary),
    grid: read('--ui-border', theme.value.grid),
    text: read('--ui-text-muted', theme.value.text)
  }
})

// Transform the MongoDB snapshots into the exact format Chart.js requires
const chartData = computed(() => {
  return {
    // X-Axis: Format dates like "Oct 24, 14:30"
    labels: props.snapshots.map((s) => {
      const date = new Date(s.scrapedAt)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }),
    datasets: [
      {
        label: `Price (${props.currency})`,
        data: props.snapshots.map(s => s.price),
        borderColor: theme.value.primary,
        // Hex + alpha suffix for a soft area fill (theme primary is a hex value)
        backgroundColor: `${theme.value.primary}1a`,
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: theme.value.primary,
        tension: 0.2 // Slight curve to the line
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: theme.value.text }
    },
    y: {
      beginAtZero: false, // Don't start at 0, otherwise small price drops look like a flat line!
      grid: { color: theme.value.grid },
      ticks: {
        color: theme.value.text,
        callback: (value: string | number) => `${value} ${props.currency}`
      }
    }
  }
}))
</script>

<template>
  <div class="h-64 w-full">
    <Line
      v-if="snapshots.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
    <div
      v-else
      class="h-full flex items-center justify-center text-muted"
    >
      Not enough data yet. The worker needs to scrape this product at least once.
    </div>
  </div>
</template>
