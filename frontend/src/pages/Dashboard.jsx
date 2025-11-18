import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Dashboard() {
  const { userType } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir según tipo de usuario
    if (userType === 'passenger') {
      navigate('/passenger');
    } else if (userType === 'driver') {
      navigate('/driver');
    } else if (userType === 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

