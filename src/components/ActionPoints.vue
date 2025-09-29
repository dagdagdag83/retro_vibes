<template>
  <div class="mt-8 p-4 bg-gray-100 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-gray-700">Action Points</h2>
    <div class="space-y-3">
      <Card
        v-for="card in cards"
        :key="card.id"
        :id="card.id"
        :content="card.content"
      />
    </div>
  </div>
</template>

<script setup>
import Card from './Card.vue';

defineProps({
  cards: Array,
});
</script>