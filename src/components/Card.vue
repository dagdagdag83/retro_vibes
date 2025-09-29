<template>
  <li class="bg-white p-3 rounded-md shadow-sm border border-gray-200 group">
    <div v-if="!isEditing" class="flex justify-between items-start">
      <p class="text-gray-800 flex-grow">{{ content }}</p>
      <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="startEditing" class="p-1 hover:bg-gray-200 rounded">✏️</button>
        <button @click="promoteCard" class="p-1 hover:bg-gray-200 rounded">🚀</button>
        <button @click="deleteCard" class="p-1 hover:bg-gray-200 rounded">🗑️</button>
      </div>
    </div>
    <div v-else>
      <textarea
        v-model="editableContent"
        ref="textareaRef"
        class="w-full p-2 border rounded-md"
        @blur="saveEdit"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
      ></textarea>
    </div>
  </li>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  id: String,
  content: String,
});

const emit = defineEmits(['update-card', 'delete-card', 'promote-card']);

const isEditing = ref(false);
const editableContent = ref(props.content);
const textareaRef = ref(null);

const startEditing = async () => {
  isEditing.value = true;
  await nextTick();
  textareaRef.value?.focus();
};

const saveEdit = () => {
  if (editableContent.value.trim() && editableContent.value.trim() !== props.content) {
    emit('update-card', { cardId: props.id, newContent: editableContent.value.trim() });
  }
  isEditing.value = false;
};

const cancelEdit = () => {
  editableContent.value = props.content;
  isEditing.value = false;
};

const deleteCard = () => {
  emit('delete-card', { cardId: props.id });
};

const promoteCard = () => {
  emit('promote-card', { cardId: props.id });
};
</script>