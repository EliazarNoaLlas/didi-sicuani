import { Link } from 'react-router-dom';

export default function DriverDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Conductor</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/queue"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">📋 Cola de Viajes</h2>
          <p className="text-gray-600">
            Ver y gestionar solicitudes de viaje
          </p>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">💰 Ganancias</h2>
          <p className="text-gray-600">Ver tus ganancias del día</p>
        </div>
      </div>
    </div>
  );
}

