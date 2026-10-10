import { Navigate } from 'react-router-dom';

// Wrap a route's element with this to require a valid login.
// - No token at all -> redirect to login.
// - Token exists but role doesn't match what this route allows -> redirect to login.
function ProtectedRoute({ children, allowedRole }) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;