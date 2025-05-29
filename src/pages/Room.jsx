import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import { removeUserFromRoom } from "../firebase/rooms";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { onSnapshot } from "firebase/firestore";
import { Dialog, DialogTitle, DialogPanel } from "@headlessui/react";
import { MagnifyingGlass } from "react-loader-spinner";

const appId = import.meta.env.VITE_AGORA_APP_ID;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const userJoiner = state?.user;
  const roomName = state?.roomName;
  const roomCreatorName = state?.roomCreatorName;
  const roomCreatorId = state?.roomCreatorId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);
  console.log(state, "state==");
  const [client] = useState(() =>
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localUid, setLocalUid] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [participants, setParticipants] = useState({});
  const [loading, setLoading] = useState(true);
  console.log("participants==", participants, remoteUsers,userJoiner);
  const fetchParticipants = async () => {
    const snapshot = await getDocs(
      collection(db, `rooms/${roomId}/participants`)
    );
    const usersMap = {};
    snapshot.forEach((doc) => {
      usersMap[doc.id] = doc.data(); // doc.id is uid
    });
    setParticipants(usersMap);
  };

  console.log("remoteUsers==", remoteUsers);

  useEffect(() => {
    const joinRoom = async () => {
      setLoading(true);
      const uid = await client.join(appId, roomId, null, userJoiner.uid);
      setLocalUid(uid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await client.publish(audioTrack);

      const existingUsers = client.remoteUsers;
      console.log("existingUsers==", existingUsers);
      for (const user of existingUsers) {
        if (user.hasAudio) {
          await client.subscribe(user, "audio");
          user.audioTrack?.play();

          setRemoteUsers((prev) => {
            const exists = prev.some((u) => u.uid === user.uid);
            if (!exists) {
              return [...prev, { ...user, isSpeaking: false }];
            }
            return prev;
          });
        }
      }

      // for (const user of existingUsers) {
      //   await client.subscribe(user, "audio");

      //   // Play if there's an audioTrack
      //   if (user.audioTrack) {
      //     user.audioTrack.play();
      //   }

      //   setRemoteUsers((prev) => {
      //     const exists = prev.some((u) => u.uid === user.uid);
      //     if (!exists) {
      //       return [...prev, { ...user, isSpeaking: false }];
      //     }
      //     return prev;
      //   });
      // }

      client.on("user-published", async (user, mediaType) => {
        if (user.uid === uid) return;

        try {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }

          setRemoteUsers((prev) => {
            const exists = prev.some((u) => u.uid === user.uid);
            if (!exists) {
              return [...prev, { ...user, isSpeaking: false }];
            } else {
              return prev.map((u) =>
                u.uid === user.uid ? { ...user, isSpeaking: false } : u
              );
            }
          });
          fetchParticipants()
        } catch (err) {
          console.warn("Error subscribing on user-published:", err);
        }
      });

      client.on("user-unpublished", (user) => {
        setRemoteUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid ? { ...u, isSpeaking: false } : u
          )
        );
      });

      client.on("user-joined", async (user) => {
        console.log("User joined:", user.uid);

        // Force subscribe to audio in case they were already published
        try {
          // await client.subscribe(user, "audio");
          // if (user.audioTrack) {
          //   user.audioTrack.play();
          // }

          setRemoteUsers((prev) => {
            const exists = prev.some((u) => u.uid === user.uid);
            if (!exists) {
              return [...prev, { ...user, isSpeaking: false }];
            }
            return prev;
          });
          fetchParticipants()
        } catch (err) {
          console.warn("Error subscribing on user-joined:", err);
        }
      });

      client.on("user-left", async (user) => {
        // await addUserToRoom(roomId, user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      client.enableAudioVolumeIndicator();
      client.on("volume-indicator", (volumes) => {
        const localVol = volumes.find((v) => v.uid === uid);
        setIsSpeaking(localVol ? localVol.level > 48 : false);

        setRemoteUsers((prevUsers) =>
          prevUsers.map((user) => {
            const vol = volumes.find((v) => v.uid === user.uid);
            return {
              ...user,
              isSpeaking: vol ? vol.level > 48 : false,
            };
          })
        );
      });
    };
    fetchParticipants();
    joinRoom();
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => {
      localAudioTrack?.close();
      client.leave();
    };
  }, [client, roomId]);

  const toggleMute = async () => {
    if (!localAudioTrack) return;
    if (muted) {
      await localAudioTrack.setEnabled(true);
    } else {
      await localAudioTrack.setEnabled(false);
    }
    setMuted((prev) => !prev);
  };

  const leaveRoom = async () => {
    console.log("roomId & userJoinerId==", roomId, userJoiner.uid);

    await removeUserFromRoom(roomId, userJoiner.uid);
    localAudioTrack?.close();
    await client.leave();
    navigate("/home");
  };

  const handleDeleteRoom = async () => {
    // const confirmDelete = window.confirm(
    //   "Are you sure you want to delete this room?"
    // );
    // if (!confirmDelete) return;
    console.log("deleteRoom", roomId);

    setIsModalOpen(false);
    // Delete the room document
    await deleteDoc(doc(db, "rooms", roomId));

    // Optionally: delete all participants subcollection (advanced)
    // You can also loop and delete each doc under `rooms/${roomId}/participants`

    // navigate("/home");
  };

  // Inside useEffect
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (!docSnap.exists()) {
        // alert("Room has been deleted by the creator.");
        setIsRoomDeleted(true);
        // navigate("/home");
      }
    });

    return () => unsub(); // cleanup on unmount
  }, [roomId, navigate]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Dialog
        open={isRoomDeleted}
        onClose={() => setIsRoomDeleted(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        {/* Overlay with blur & dark bg */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <DialogTitle className="text-xl font-semibold text-slate-800 mb-5">
              The room has been deleted by the creator.
            </DialogTitle>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsRoomDeleted(false);
                  navigate("/home");
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 cursor-pointer"
              >
                Ok
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        {/* Overlay with blur & dark bg */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <DialogTitle className="text-xl font-semibold text-slate-800 mb-5">
              Are you sure you want to delete this room?
            </DialogTitle>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      {/* Room Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800"> {roomName}</h2>
          {/* <p className="text-gray-600 text-sm">Room ID: {roomId}</p> */}
          {/* <p className="text-gray-600 text-sm">You: {userJoiner?.name}</p> */}
          <p className="text-gray-500 text-sm">
            Room Created by:{" "}
            <span className="font-medium">{roomCreatorName}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={leaveRoom}
            className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800 transition cursor-pointer"
          >
            🚪 Leave Room
          </button>
          {/* Delete Button for Room Creator */}
          {userJoiner.uid === roomCreatorId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition cursor-pointer"
            >
              🗑️Delete Room
            </button>
          )}
        </div>
      </div>

      {/* Participants */}
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">
          Participants
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Local User */}
          {loading ? (
            <MagnifyingGlass
              visible={true}
              height="80"
              width="80"
              ariaLabel="magnifying-glass-loading"
              wrapperStyle={{}}
              wrapperClass="magnifying-glass-wrapper"
              glassColor="#c0efff"
              color="#e15b64"
            />
          ) : (
            localUid && (
              <div
                style={{
                  borderColor: muted
                    ? "black"
                    : isSpeaking
                    ? "#00ff00"
                    : "gray",
                  border: "2px solid",
                }}
                className="p-4 rounded-lg shadow bg-white"
              >
                <h4 className="text-lg font-medium text-gray-800">
                  {userJoiner?.name || "You"}{" "}
                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                </h4>
                {/* <p className="text-sm text-gray-500">UID: {localUid}</p> */}
                <p
                  className={`text-sm font-medium ${
                    isSpeaking
                      ? "text-green-600"
                      : muted
                      ? "text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {muted ? "Muted" : isSpeaking ? "Speaking" : "Silent"}
                </p>
                {/* Controls */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={toggleMute}
                    className="mt-3 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                  >
                    {muted ? "🔊Unmute" : "🔇Mute"}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Remote Users */}
          {remoteUsers?.map((user) => (
            <div
              key={user.uid}
              style={{
                borderColor: user.isSpeaking ? "#00ff00" : "gray",
                border: "2px solid",
              }}
              className="p-4 rounded-lg shadow bg-white hover:shadow-md transition"
            >
              <h4 className="text-lg font-medium text-gray-800">
                {participants[user.uid]?.name}
              </h4>
              <p
                className={`text-sm font-medium ${
                  user.isSpeaking ? "text-green-600" : "text-gray-600"
                }`}
              >
                {user.isSpeaking ? "Speaking" : "Silent"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Room;
