import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RideRequest from './pages/RideRequest';
import RideQueue from './pages/RideQueue';
import BiddingPage from './pages/BiddingPage';
import Metrics from './pages/Metrics';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="passenger" element={<PassengerDashboard />} />
        <Route path="driver" element={<DriverDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="request-ride" element={<RideRequest />} />
        <Route path="queue" element={<RideQueue />} />
        <Route path="bidding/:rideId" element={<BiddingPage />} />
        <Route path="metrics" element={<Metrics />} />
      </Route>
    </Routes>
  );
}

export default App;

