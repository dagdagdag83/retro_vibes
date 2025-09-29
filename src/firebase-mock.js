import { v4 as uuidv4 } from 'uuid';

// This will hold the entire state of our mock database.
const MOCK_DB_STATE = {};
// This will hold the 'onSnapshot' listener functions for collections.
const listeners = {};

// Helper to get a collection from the state.
const getCollection = (path) => {
  let current = MOCK_DB_STATE;
  // Ensure path is treated as a collection, not a document
  const segments = path.split('/').filter(p => p);
  for (const segment of segments) {
    if (!current[segment]) {
      current[segment] = {};
    }
    current = current[segment];
  }
  return current;
};

// Helper to trigger listeners for a collection path.
const triggerListeners = (collectionPath, change) => {
  if (listeners[collectionPath]) {
    const collection = getCollection(collectionPath);
    const snapshot = {
      docs: Object.keys(collection).map(id => ({
        id,
        data: () => collection[id],
        ref: { _path: `${collectionPath}/${id}` },
      })),
      docChanges: () => [change],
    };
    listeners[collectionPath].forEach(cb => cb(snapshot));
  }
};

// Factory for creating the mock functions that mimic the Firebase v9 API.
export function createMockFirestore() {
  const collection = (db, path) => ({ _path: path, type: 'collection' });

  const doc = (dbOrCollRef, path, ...segments) => {
    // Firebase's doc() can be called as doc(db, col, id) or doc(collRef, id)
    const basePath = dbOrCollRef._path ? dbOrCollRef._path : path;
    const extraPath = dbOrCollRef._path ? [path, ...segments] : segments;
    const fullPath = [basePath, ...extraPath].join('/');
    return { _path: fullPath, type: 'document' };
  };

  const onSnapshot = (ref, callback) => {
    const path = ref._path;
    if (ref.type !== 'collection') {
      console.warn("Mock only supports collection snapshots for now.");
      return () => {}; // Return an empty unsubscribe function
    }

    if (!listeners[path]) listeners[path] = [];
    listeners[path].push(callback);

    // Immediately call with initial data
    const collectionData = getCollection(path);
    const initialChanges = Object.keys(collectionData).map(id => ({
      type: 'added',
      doc: { id, data: () => collectionData[id], ref: { _path: `${path}/${id}` } },
    }));

    if (initialChanges.length > 0) {
      callback({ docChanges: () => initialChanges });
    }

    return () => { // Unsubscribe function
      listeners[path] = listeners[path].filter(l => l !== callback);
    };
  };

  const addDoc = async (collRef, data) => {
    const path = collRef._path;
    const newId = uuidv4();
    const collectionData = getCollection(path);
    collectionData[newId] = data;

    const change = { type: 'added', doc: { id: newId, data: () => data, ref: { _path: `${path}/${newId}` } } };
    triggerListeners(path, change);
    return doc(collRef, newId);
  };

  const setDoc = async (docRef, data) => {
    const path = docRef._path;
    const collectionPath = path.substring(0, path.lastIndexOf('/'));
    const docId = path.substring(path.lastIndexOf('/') + 1);
    const collectionData = getCollection(collectionPath);
    const exists = !!collectionData[docId];
    collectionData[docId] = data; // Note: This doesn't handle merge options

    const change = { type: exists ? 'modified' : 'added', doc: { id: docId, data: () => data, ref: docRef } };
    triggerListeners(collectionPath, change);
  };

  const deleteDoc = async (docRef) => {
    const path = docRef._path;
    const collectionPath = path.substring(0, path.lastIndexOf('/'));
    const docId = path.substring(path.lastIndexOf('/') + 1);
    const collectionData = getCollection(collectionPath);

    if (!collectionData[docId]) return; // Document doesn't exist

    const oldData = collectionData[docId];
    delete collectionData[docId];

    const change = { type: 'removed', doc: { id: docId, data: () => oldData, ref: docRef } };
    triggerListeners(collectionPath, change);
  };

  return { db: {}, collection, doc, onSnapshot, addDoc, setDoc, deleteDoc };
}