import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaTrash, FaMapMarkedAlt, FaUser, FaCamera } from 'react-icons/fa';
import { getTrashReports, supabase } from '../services/supabase';
import { TrashReport } from '../types';
import TrashReportCard from '../components/TrashReportCard';

const ContributorDashboard = () => {
  const [userReports, setUserReports] = useState<TrashReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    inReviewReports: 0
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
        return session.user.id;
      }
      return null;
    };

    const fetchUserReports = async () => {
      try {
        const userId = await getCurrentUser();
        if (!userId) {
          console.error('Aucun utilisateur connecté');
          return;
        }

        const reports = await getTrashReports();
        // Filtrer les rapports de l'utilisateur connecté
        const userReports = reports.filter(report => report.user_id === userId);
        setUserReports(userReports);
        
        // Calculer les statistiques
        setStats({
          totalReports: userReports.length,
          pendingReports: userReports.filter(r => r.status === 'pending').length,
          resolvedReports: userReports.filter(r => r.status === 'resolved').length,
          inReviewReports: userReports.filter(r => r.status === 'in_review').length
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des rapports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReports();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord du contributeur</h1>
        <p className="mt-2 text-gray-600">Bienvenue sur votre espace personnel</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600">
              <FaChartLine className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total des signalements</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaTrash className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaMapMarkedAlt className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Résolus</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolvedReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaUser className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours de traitement</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inReviewReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/report/new"
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FaCamera className="h-5 w-5 text-primary-600 mr-2" />
            <span>Nouveau signalement</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FaMapMarkedAlt className="h-5 w-5 text-primary-600 mr-2" />
            <span>Voir tous les signalements</span>
          </Link>
        </div>
      </div>

      {/* Derniers signalements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vos derniers signalements</h2>
        {isLoading ? (
          <p>Chargement des signalements...</p>
        ) : userReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userReports.slice(0, 6).map((report) => (
              <TrashReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Vous n'avez pas encore créé de signalements.</p>
        )}
      </div>
    </div>
  );
};

export default ContributorDashboard; 