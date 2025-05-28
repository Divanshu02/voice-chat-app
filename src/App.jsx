import { onAuthStateChanged } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { loginSuccess, logoutSuccess } from "./redux/slices/auth/authSlice";
import { useEffect, useState } from "react";
import { auth } from "./firebase/config";

function App() {


  return (
    <>
      <Outlet />
    </>
  );
}

export default App;
