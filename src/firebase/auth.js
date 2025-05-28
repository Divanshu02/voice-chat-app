// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, getDoc,setDoc } from "firebase/firestore";

export const loginWithEmail = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  const user = res.user;

  // ✅ fetch the user's data from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  return {
    uid: user.uid,
    email: user.email,
    name: userData?.name || "", // fallback in case name is missing
  };
  // ✅ Return full user object
};

export const registerWithEmail = async (email, password, name) => {
  // return await createUserWithEmailAndPassword(auth, email, password);
  const res = await createUserWithEmailAndPassword(auth, email, password);
  const user = res.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
  });
  return { uid: user.uid, email: user.email, name }; // ✅ return name here
};

export const logoutUser = async () => {
  await signOut(auth);
};
