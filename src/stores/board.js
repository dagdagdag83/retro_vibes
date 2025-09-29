import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export const useBoardStore = defineStore('board', {
  state: () => ({
    columns: {
      Start: [],
      Stop: [],
      Continue: [],
    },
    actionPoints: [],
    participants: [],
    localId: null,
    isStateHydrated: false, // Flag to check if we have received state from peers
  }),
  actions: {
    hydrateState(roomId) {
      const savedState = localStorage.getItem(`retro-board-${roomId}`);
      if (savedState) {
        const { columns, actionPoints } = JSON.parse(savedState);
        this.columns = columns;
        this.actionPoints = actionPoints;
      }
      this.$subscribe((mutation, state) => {
        const stateToSave = {
          columns: state.columns,
          actionPoints: state.actionPoints,
        };
        localStorage.setItem(`retro-board-${roomId}`, JSON.stringify(stateToSave));
      });
    },

    setInitialState(state) {
      this.columns = state.columns;
      this.actionPoints = state.actionPoints;
      this.participants = state.participants;
      this.isStateHydrated = true;
    },

    setLocalId(id) {
      this.localId = id;
    },

    addCard({ column, content }) {
      if (this.columns[column]) {
        const newCard = { id: uuidv4(), content, author: this.localId };
        this.columns[column].push(newCard);
        return newCard;
      }
    },

    updateCard({ cardId, newContent }) {
      for (const column in this.columns) {
        const card = this.columns[column].find(c => c.id === cardId);
        if (card) {
          card.content = newContent;
          return;
        }
      }
      const actionPoint = this.actionPoints.find(c => c.id === cardId);
      if (actionPoint) {
        actionPoint.content = newContent;
      }
    },

    deleteCard({ cardId }) {
      for (const column in this.columns) {
        const index = this.columns[column].findIndex(c => c.id === cardId);
        if (index !== -1) {
          this.columns[column].splice(index, 1);
          return;
        }
      }
    },

    moveCard({ cardId, fromColumn, toColumn, newIndex }) {
      const cardIndex = this.columns[fromColumn].findIndex(c => c.id === cardId);
      if (cardIndex > -1) {
        const [card] = this.columns[fromColumn].splice(cardIndex, 1);
        this.columns[toColumn].splice(newIndex, 0, card);
      }
    },

    promoteToActionPoint({ cardId }) {
      let cardToPromote = null;
      let fromColumn = null;
      for (const column in this.columns) {
        const index = this.columns[column].findIndex(c => c.id === cardId);
        if (index !== -1) {
          cardToPromote = this.columns[column][index];
          fromColumn = column;
          break;
        }
      }

      if (cardToPromote) {
        this.columns[fromColumn] = this.columns[fromColumn].filter(c => c.id !== cardId);
        this.actionPoints.push(cardToPromote);
      }
    },

    addParticipant(peerId) {
        if (!this.participants.some(p => p.id === peerId)) {
            this.participants.push({ id: peerId, isDone: false });
        }
    },

    removeParticipant(peerId) {
        this.participants = this.participants.filter(p => p.id !== peerId);
    },

    setParticipantStatus({ peerId, isDone }) {
        const participant = this.participants.find(p => p.id === peerId);
        if (participant) {
            participant.isDone = isDone;
        }
    },

    // Action to process incoming events from WebRTC
    processEvent(event) {
        const { type, payload } = event;
        switch (type) {
            case 'card:add':
                this.addCard(payload);
                break;
            case 'card:update':
                this.updateCard(payload);
                break;
            case 'card:delete':
                this.deleteCard(payload);
                break;
            case 'card:move':
                this.moveCard(payload);
                break;
            case 'card:promote':
                this.promoteToActionPoint(payload);
                break;
            case 'participant:done':
                this.setParticipantStatus(payload);
                break;
        }
    }
  },
});