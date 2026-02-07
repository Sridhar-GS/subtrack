import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignUpPage from "../SignUppage/SignUpPage.jsx";
import LoginPage from "../LoginPage/LoginPage.jsx";
export default function AppRoute() {
  return (
     <BrowserRouter>
      <Routes>
         <Route path="/" element={<SignUpPage />} />
         <Route path="/login" element={<LoginPage />} />
       </Routes>
     </BrowserRouter>

  );
}