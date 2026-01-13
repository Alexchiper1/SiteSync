import { useNavigate } from "react-router-dom";
import logo from "../pictures/LogoNoBack.png";
import "../css/Logo.css";

export default function Logo() {
  const navigate = useNavigate();

  return (
    <img
      src={logo}
      alt="SiteSync Logo"
      className="top-left-logo"
      onClick={() => navigate("/")}
    />
  );
}
