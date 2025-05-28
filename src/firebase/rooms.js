import { db } from "./config"; // your Firebase config file
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// Create a new room
export const createRoom = async (roomName, roomCreatorId, roomCreatorName) => {
  try {
    const docRef = await addDoc(collection(db, "rooms"), {
      roomName,
      roomCreatorId,
      roomCreatorName,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

// Subscribe to real-time updates of rooms
export const subscribeToRooms = (callback) => {
  const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (querySnapshot) => {
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    callback(rooms);
  });
};

export const addUserToRoom = async (roomId, uid, userInfo) => {
  const userRef = doc(db, `rooms/${roomId}/participants/${uid}`);
  await setDoc(userRef, userInfo);
};

export const removeUserFromRoom = async (roomId, uid) => {
  const userRef = doc(db, `rooms/${roomId}/participants/${uid}`);
  await deleteDoc(userRef);
};

// Get all participants in a room
export const fetchRoomParticipants = async (roomId) => {
  const snapshot = await getDocs(
    collection(db, `rooms/${roomId}/participants`)
  );
  const participants = {};
  snapshot.forEach((doc) => {
    participants[doc.id] = doc.data(); // doc.id is the uid, doc.data() includes name
  });
  return participants;
};
