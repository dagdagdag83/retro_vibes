<template>
  <div class="flex h-screen bg-gray-50 p-4 space-x-4">
    <!-- Main Board -->
    <div class="flex-grow">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">Retrospective Board</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BoardColumn
          title="Start"
          :cards="boardStore.columns.Start"
          @add-card="onAddCard"
          @move-card="onMoveCard"
          @update-card="onUpdateCard"
          @delete-card="onDeleteCard"
          @promote-card="onPromoteCard"
        />
        <BoardColumn
          title="Stop"
          :cards="boardStore.columns.Stop"
          @add-card="onAddCard"
          @move-card="onMoveCard"
          @update-card="onUpdateCard"
          @delete-card="onDeleteCard"
          @promote-card="onPromoteCard"
        />
        <BoardColumn
          title="Continue"
          :cards="boardStore.columns.Continue"
          @add-card="onAddCard"
          @move-card="onMoveCard"
          @update-card="onUpdateCard"
          @delete-card="onDeleteCard"
          @promote-card="onPromoteCard"
        />
      </div>
    </div>

    <!-- Side Panel -->
    <div class="w-1/4 max-w-sm flex-shrink-0">
      <ActionPoints :cards="boardStore.actionPoints" />
      <ParticipantList :participants="boardStore.participants" @mark-done="onMarkDone" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBoardStore } from '../stores/board';
import WebRTCManager from '../webrtc';

import BoardColumn from '../components/BoardColumn.vue';
import ActionPoints from '../components/ActionPoints.vue';
import ParticipantList from '../components/ParticipantList.vue';

const route = useRoute();
const boardStore = useBoardStore();
const roomId = route.params.id;
let webrtcManager;

// --- WebRTC and State Sync Logic ---

onMounted(async () => {
  boardStore.hydrateState(roomId);
  webrtcManager = new WebRTCManager(roomId);
  const localId = await webrtcManager.joinRoom();
  boardStore.setLocalId(localId);
  boardStore.addParticipant(localId);

  webrtcManager.onPeerConnect = (peerId) => {
    boardStore.addParticipant(peerId);
    if (boardStore.isStateHydrated) {
      webrtcManager.sendTo(peerId, {
        type: 'state:sync',
        payload: {
          columns: boardStore.columns,
          actionPoints: boardStore.actionPoints,
          participants: boardStore.participants,
        },
      });
    }
  };

  webrtcManager.onPeerDisconnect = (peerId) => {
    boardStore.removeParticipant(peerId);
  };

  webrtcManager.onDataChannelMessage = (event) => {
    if (event.type === 'state:sync') {
      if (!boardStore.isStateHydrated) {
        boardStore.setInitialState(event.payload);
      }
    } else {
      boardStore.processEvent(event);
    }
  };

  setTimeout(() => {
    if (!boardStore.isStateHydrated) {
      boardStore.isStateHydrated = true;
    }
  }, 3000);
});

onUnmounted(() => {
  if (webrtcManager) {
    webrtcManager.leaveRoom();
  }
});

// --- UI Event Handlers ---

const onAddCard = ({ column, content }) => {
  const newCard = boardStore.addCard({ column, content });
  if (newCard) {
    webrtcManager.broadcast({
      type: 'card:add',
      payload: { column, content: newCard.content, id: newCard.id, author: newCard.author },
    });
  }
};

const onMoveCard = (payload) => {
  // Prevent broadcasting moves that don't change anything
  const card = boardStore.columns[payload.toColumn][payload.newIndex];
  if (card && card.id === payload.cardId) {
    // The store is already updated by the drag-and-drop library's reactivity
    webrtcManager.broadcast({
      type: 'card:move',
      payload,
    });
  }
};

const onUpdateCard = (payload) => {
  boardStore.updateCard(payload);
  webrtcManager.broadcast({ type: 'card:update', payload });
};

const onDeleteCard = (payload) => {
  boardStore.deleteCard(payload);
  webrtcManager.broadcast({ type: 'card:delete', payload });
};

const onPromoteCard = (payload) => {
  boardStore.promoteToActionPoint(payload);
  webrtcManager.broadcast({ type: 'card:promote', payload });
};

const onMarkDone = () => {
  const localParticipant = boardStore.participants.find(p => p.id === boardStore.localId);
  if (!localParticipant) return;

  const newStatus = !localParticipant.isDone;
  boardStore.setParticipantStatus({ peerId: boardStore.localId, isDone: newStatus });
  webrtcManager.broadcast({
    type: 'participant:done',
    payload: { peerId: boardStore.localId, isDone: newStatus },
  });
};

</script>