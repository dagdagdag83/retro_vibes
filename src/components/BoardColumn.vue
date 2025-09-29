<template>
  <div class="bg-gray-100 p-3 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-center text-gray-700">{{ title }}</h2>
    <ul ref="listRef" class="space-y-3">
      <Card
        v-for="card in cards"
        :key="card.id"
        :id="card.id"
        :content="card.content"
        :data-id="card.id"
        @update-card="$emit('update-card', $event)"
        @delete-card="$emit('delete-card', $event)"
        @promote-card="$emit('promote-card', $event)"
      />
    </ul>
    <div class="mt-4">
      <textarea
        v-model="newCardContent"
        @keyup.enter="addCard"
        class="w-full p-2 border rounded-md"
        :placeholder="`Add a card to '${title}'...`"
      ></textarea>
      <button
        @click="addCard"
        class="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
      >
        Add Card
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import Card from './Card.vue';

const props = defineProps({
  title: String,
  cards: Array,
});

const emit = defineEmits(['add-card', 'move-card', 'update-card', 'delete-card', 'promote-card']);

const newCardContent = ref('');

const [listRef, values] = useDragAndDrop(props.cards, {
  group: 'board',
  handleEnd: (event) => {
    emit('move-card', {
        cardId: event.targetData.id,
        fromColumn: event.targetData.parent.id,
        toColumn: event.endData.parent.id,
        newIndex: event.endData.index,
    });
  },
});

onMounted(() => {
    listRef.value.id = props.title;
});


const addCard = () => {
  if (newCardContent.value.trim()) {
    emit('add-card', { column: props.title, content: newCardContent.value.trim() });
    newCardContent.value = '';
  }
};
</script>