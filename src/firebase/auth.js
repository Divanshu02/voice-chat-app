// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const auth = getAuth();

  try {
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    // The signed-in user info
    const user = result.user;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
    });
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
    };
  } catch (error) {
    throw error;
  }
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
