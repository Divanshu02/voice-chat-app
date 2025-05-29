import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "../../firebase/auth";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/auth/authSlice";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

const firebaseErrorMessages = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "No user found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await loginWithEmail(email, password);
      dispatch(loginSuccess(user));
      toast.success("LoggedIn successfully!");

      navigate("/home");
    } catch (err) {
      const errorCode = err.code || "auth/unknown";
      setError(
        firebaseErrorMessages[errorCode] || "Login failed. Please try again."
      );
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const user = await loginWithGoogle();
      dispatch(loginSuccess(user));
      toast.success("LoggedIn successfully!");
      navigate("/home");
    } catch (err) {
      const errorCode = err.code || "auth/unknown";
      setError(
        firebaseErrorMessages[errorCode] ||
          "Google login failed. Please try again."
      );
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div>
        <Toaster />
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Login to your account
        </h2>

        <form onSubmit={handleLogin}>
          <label className="block mb-2 font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block mb-2 font-medium text-gray-700">
            Password
          </label>
          <div className="relative mb-5">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-red-500 mt-2 mb-4 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 cursor-pointer"
          >
            Login
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-300 cursor-pointer"
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
