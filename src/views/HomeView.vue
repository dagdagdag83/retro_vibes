<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <button @click="createBoard" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Create Board
    </button>
  </div>
</template>

<script setup>
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'vue-router';

const router = useRouter();

const createBoard = () => {
  const boardId = uuidv4();
  router.push(`/retro/${boardId}`);
};
</script>