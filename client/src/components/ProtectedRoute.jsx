import { Navigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/auth/authContext";
import Loading from "./Loading";
import Unauthorized from "./Unauthorized";

const ProtectedRoute = ({ children, roles }) => {
  const { user, firebaseUser, loading } = useContext(AuthContext);
  if (loading) return <Loading />;

  if (!firebaseUser || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;
