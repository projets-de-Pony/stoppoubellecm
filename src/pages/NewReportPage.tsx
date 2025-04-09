import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReportForm from '../components/ReportForm';
import { supabase } from '../services/supabase';

const NewReportPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vérifier l'état d'authentification au chargement de la page
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur de vérification de session:', error);
        }
        
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error('Erreur lors de la vérification d\'authentification:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleSuccess = () => {
    // Rediriger vers la page des signalements après un envoi réussi
    toast.success('Merci pour votre contribution ! Votre signalement a été enregistré.');
    navigate('/reports');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 flex justify-center items-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Signaler une décharge sauvage
      </h1>
      
      {isAuthenticated ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div>
              <p className="text-sm text-green-700">
                Vous êtes connecté en tant que contributeur. Votre nom sera associé à ce signalement, à moins que vous ne choisissiez de soumettre anonymement.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div>
              <p className="text-sm text-blue-700">
                Vous n'êtes pas connecté. Votre signalement sera soumis de manière anonyme.
                <span className="ml-2">
                  <a href="/login" className="text-blue-500 hover:text-blue-700 font-medium">
                    Se connecter
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-gray-600 mb-8">
        Merci de prendre le temps de signaler une décharge sauvage. Votre contribution est essentielle pour sensibiliser les autorités et améliorer notre environnement.
      </p>
      
      <ReportForm isAuthenticated={isAuthenticated} onSuccess={handleSuccess} />
    </div>
  );
};

export default NewReportPage; 