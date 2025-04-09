import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaCamera, FaUsers, FaChartLine, FaMapPin } from 'react-icons/fa';
import { getTrashReports } from '../services/supabase';
import { TrashReport } from '../types';
import TrashReportCard from '../components/TrashReportCard';
import MapComponent from '../components/MapComponent';

const HomePage = () => {
  const [recentReports, setRecentReports] = useState<TrashReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        console.log('HomePage: Début de la récupération des rapports récents');
        // Nous récupérons les rapports et prenons seulement les 3 plus récents
        const reports = await getTrashReports();
        console.log(`HomePage: ${reports.length} rapports récupérés au total`);
        
        if (reports.length > 0) {
          const recentOnes = reports.slice(0, 3);
          console.log('HomePage: Premiers signalements récupérés:', 
            recentOnes.map(r => ({ id: r.id, status: r.status })));
          setRecentReports(recentOnes);
        } else {
          console.log('HomePage: Aucun signalement récupéré');
          setRecentReports([]);
        }
      } catch (error) {
        console.error('HomePage: Erreur lors de la récupération des rapports récents:', error);
        // Même en cas d'erreur, mettre isLoading à false pour ne pas bloquer l'interface
        setRecentReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentReports();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Ensemble, nettoyons le Cameroun
            </h1>
            <p className="mt-6 max-w-4xl mx-auto text-xl">
              Signalez les décharges sauvages autour de vous et contribuez à un environnement plus propre pour tous.
            </p>
            <div className="mt-10">
              <Link
                to="/report/new"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-100 md:text-lg"
              >
                <FaCamera className="mr-2" />
                Signaler une décharge
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-white">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Comment ça fonctionne
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Notre plateforme permet de signaler facilement les décharges sauvages aux autorités
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaCamera className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Prenez une photo</h3>
              <p className="mt-2 text-base text-gray-600">
                Photographiez les décharges sauvages que vous observez autour de vous
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaMapMarkedAlt className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Localisez</h3>
              <p className="mt-2 text-base text-gray-600">
                Indiquez le quartier et les informations relatives à l'emplacement
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaUsers className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Partagez</h3>
              <p className="mt-2 text-base text-gray-600">
                Soumettez votre signalement en tant que contributeur ou anonymement
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaChartLine className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Suivez</h3>
              <p className="mt-2 text-base text-gray-600">
                Suivez l'évolution des signalements et les actions des autorités
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
              <FaMapPin className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Carte des décharges signalées
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
              Découvrez les décharges sauvages signalées à travers le Cameroun et contribuez à leur résolution
            </p>
          </div>
          
          <div className="relative bg-white p-1 rounded-xl shadow-lg overflow-hidden transform transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-primary-800/10 rounded-xl z-0"></div>
            <div className="relative z-10 p-4">
              <MapComponent className="rounded-lg shadow-inner overflow-hidden" />
            </div>
            <div className="text-center mt-6 text-sm text-gray-500">
              Cliquez sur un point pour voir les détails de la décharge signalée
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Derniers signalements
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez les décharges récemment signalées par la communauté
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <p>Chargement des signalements...</p>
            </div>
          ) : recentReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentReports.map((report) => (
                <TrashReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                Aucun signalement pour le moment. Soyez le premier à contribuer !
              </p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/reports"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Voir tous les signalements
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full bg-primary-700 py-16">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Contribuez à un Cameroun plus propre
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Rejoignez notre communauté et aidez-nous à sensibiliser les autorités
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50"
            >
              Devenir contributeur
            </Link>
            <Link
              to="/report/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500"
            >
              Signaler une décharge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 