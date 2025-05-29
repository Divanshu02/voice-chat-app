import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Login from "./components/login/Login.jsx";
import Signup from "./components/signup/Signup.jsx";
import Home from "./pages/Home.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import Room from "./pages/Room.jsx";
import ProtectedRoute from "./components/protect-routes/ProtectedRoute.jsx";
import NoPageFound from "./pages/NoPageFound.jsx";

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Login />} />
      <Route path="*" element={<NoPageFound />} />
      <Route path="signup" element={<Signup />} />

      <Route
        path="home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <Room />
          </ProtectedRoute>
        }
      />
    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={routes}></RouterProvider>
  </Provider>
);
