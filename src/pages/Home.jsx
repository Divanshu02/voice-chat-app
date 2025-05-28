import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUserToRoom, createRoom, subscribeToRooms } from "../firebase/rooms";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../firebase/auth";
import { logoutSuccess } from "../redux/slices/auth/authSlice";
import { Dialog, DialogTitle, DialogPanel } from "@headlessui/react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { MagnifyingGlass } from "react-loader-spinner";

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  console.log("isUser::=", user);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToRooms(setRooms);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => unsubscribe();
  }, []);

  console.log("loadingState==", loading);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");

    if (!roomName.trim()) {
      setError("Room name is required");
      return;
    }

    try {
      const roomId = await createRoom(roomName.trim(), user.uid, user.name);
      setIsModalOpen(false);
      setRoomName("");
      // navigate(`/room/${roomId}`, { state: { user } });
    } catch (err) {
      console.error(err);
      setError("Failed to create room. Try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logoutSuccess());
      toast.success("Logout Successfully");
      navigate("/"); // Back to login
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 font-[Poppins] bg-gradient-to-br from-white via-blue-50 to-indigo-50 min-h-screen">
      <div>
        <Toaster />
      </div>
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-500 mt-1">
            Talk Globally. Connect Instantly.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Create Room Button */}
      <div className="text-right">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition cursor-pointer"
        >
          + Create Room
        </button>
      </div>

      {/* Modal */}
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
            <DialogTitle className="text-xl font-semibold text-slate-800">
              Create New Room
            </DialogTitle>
            <p className="text-sm text-gray-500 mb-4">
              Start a new voice room and invite others to join.
            </p>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Rooms */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Available Rooms
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-48">
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
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-gray-500 italic">
            No rooms available. Be the first to create one!
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="mb-4">
                  <p className="text-lg font-semibold text-indigo-700">
                    {room.roomName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by:{" "}
                    <span className="font-medium">{room.roomCreatorName}</span>
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await addUserToRoom(room.id, user.uid, {
                      name: user.name,
                      email: user.email,
                    });
                    navigate(`/room/${room.id}`, {
                      state: {
                        user,
                        roomName: room.roomName,
                        roomCreatorName: room.roomCreatorName,
                        roomCreatorId: room.roomCreatorId,
                      },
                    });
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-md font-medium cursor-pointer"
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
