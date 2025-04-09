import { useState, useEffect } from 'react';
import { FaUsers, FaTrash, FaChartPie, FaCog, FaUserShield, FaCamera, FaBuilding, FaEnvelope } from 'react-icons/fa';
import { getTrashReports, getUsers, getPendingCommunications } from '../services/supabase';
import { TrashReport } from '../types';
import TrashReportCard from '../components/TrashReportCard';
import MunicipalityManager from '../components/MunicipalityManager';
import CommunicationManager from '../components/CommunicationManager';

const AdminDashboard = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    inReviewReports: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingCommunications: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'municipalities' | 'communications'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reports, users, pendingCommunications] = await Promise.all([
          getTrashReports(),
          getUsers(),
          getPendingCommunications()
        ]);
        
        setReports(reports);
        
        // Calculer les statistiques
        setStats({
          totalReports: reports.length,
          pendingReports: reports.filter(r => r.status === 'pending').length,
          resolvedReports: reports.filter(r => r.status === 'resolved').length,
          inReviewReports: reports.filter(r => r.status === 'in_review').length,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.last_sign_in_at).length, // Utilisateurs qui se sont déjà connectés
          pendingCommunications: pendingCommunications.length
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
        <p className="mt-2 text-gray-600">Gestion complète de la plateforme</p>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('municipalities')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'municipalities'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Municipalités
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'communications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Communications
            {stats.pendingCommunications > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                {stats.pendingCommunications}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                  <FaTrash className="h-6 w-6" />
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
                  <FaUsers className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilisateurs totaux</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FaEnvelope className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Communications en attente</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingCommunications}</p>
                </div>
              </div>
            </div>
          </div>

          {/* État des signalements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signalements en attente</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingReports}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">En cours de traitement</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.inReviewReports}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signalements résolus</h3>
              <p className="text-3xl font-bold text-green-600">{stats.resolvedReports}</p>
            </div>
          </div>

          {/* Derniers signalements */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Derniers signalements</h2>
              <button className="text-primary-600 hover:text-primary-700">
                Voir tous
              </button>
            </div>
            {isLoading ? (
              <p>Chargement des signalements...</p>
            ) : reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.slice(0, 6).map((report) => (
                  <TrashReportCard key={report.id} report={report} showActions={true} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Aucun signalement pour le moment.</p>
            )}
          </div>

          {/* Actions rapides */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => setActiveTab('municipalities')}
              className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <FaBuilding className="h-5 w-5 text-primary-600 mr-2" />
              <span>Gérer les municipalités</span>
            </button>
            <button 
              onClick={() => setActiveTab('communications')}
              className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <FaEnvelope className="h-5 w-5 text-primary-600 mr-2" />
              <span>Gérer les communications</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:bg-gray-50">
              <FaUsers className="h-5 w-5 text-primary-600 mr-2" />
              <span>Gérer les utilisateurs</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:bg-gray-50">
              <FaCog className="h-5 w-5 text-primary-600 mr-2" />
              <span>Paramètres</span>
            </button>
          </div>
        </>
      )}

      {activeTab === 'municipalities' && (
        <MunicipalityManager />
      )}

      {activeTab === 'communications' && (
        <CommunicationManager />
      )}
    </div>
  );
};

export default AdminDashboard; 