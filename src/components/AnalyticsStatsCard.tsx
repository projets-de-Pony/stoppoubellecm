import { useState, useEffect } from 'react';
import { FaEye, FaHandPointer, FaUsers } from 'react-icons/fa';
import { getAnalyticsStats, TotalStats } from '../services/supabase';

interface AnalyticsStatsCardProps {
  timeframe?: number; // Nombre de jours pour les statistiques
}

const AnalyticsStatsCard: React.FC<AnalyticsStatsCardProps> = ({ timeframe = 30 }) => {
  const [stats, setStats] = useState<TotalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getAnalyticsStats(timeframe);
        setStats(statsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Chargement des statistiques...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Statistiques d'activité</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaEye size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Visites</p>
              <p className="text-2xl font-semibold">{stats.total_visits}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaHandPointer size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Interactions</p>
              <p className="text-2xl font-semibold">{stats.total_interactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FaUsers size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800">Contributions</p>
              <p className="text-2xl font-semibold">{stats.total_contributions}</p>
            </div>
          </div>
        </div>
      </div>
      
      {stats.daily_stats.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-700 mb-2">Activité récente</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visites
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.daily_stats.slice(0, 5).map((day) => (
                  <tr key={day.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.visits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.interactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.contributions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsStatsCard; 