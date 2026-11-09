<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
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
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  snapshots: IPriceSnapshot[]
  currency: string
}>()

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
        borderColor: '#2563eb', // Tailwind Primary Blue
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#2563eb',
        tension: 0.2 // Slight curve to the line
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: false, // Don't start at 0, otherwise small price drops look like a flat line!
      ticks: {
        callback: (value: number) => `${value} ${props.currency}`
      }
    }
  }
}
</script>

<template>
  <div class="h-64 w-full">
    <Line v-if="snapshots.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      Not enough data yet. The worker needs to scrape this product at least once.
    </div>
  </div>
</template>