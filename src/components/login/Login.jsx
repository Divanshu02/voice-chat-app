import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginWithEmail } from "../../firebase/auth";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/auth/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await loginWithEmail(email, password);
      dispatch(loginSuccess(user));
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-4 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-4 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
