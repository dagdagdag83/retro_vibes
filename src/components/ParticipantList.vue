<template>
  <div class="mt-8 p-4 bg-gray-100 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-gray-700">Participants</h2>
    <ul class="space-y-2">
      <li
        v-for="participant in participants"
        :key="participant.id"
        class="flex items-center justify-between p-2 bg-white rounded-md shadow-sm"
      >
        <span>{{ participant.id }}</span>
        <span
          :class="['px-2 py-1 text-xs font-semibold rounded-full', participant.isDone ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800']"
        >
          {{ participant.isDone ? 'Done' : 'Typing...' }}
        </span>
      </li>
    </ul>
    <button
      @click="$emit('mark-done')"
      class="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md"
    >
      Mark as Done
    </button>
  </div>
</template>

<script setup>
defineProps({
  participants: Array,
});

defineEmits(['mark-done']);
</script>