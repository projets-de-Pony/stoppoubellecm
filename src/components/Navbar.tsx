import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaTrash, FaSignInAlt, FaUserPlus, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { supabase } from '../services/supabase';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifier l'état d'authentification au chargement et lors des changements d'authentification
  useEffect(() => {
    // Vérifier la session actuelle
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        // Récupérer le rôle de l'utilisateur
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setUserRole(profileData.role);
        }
      }
    };
    
    checkSession();
    
    // S'abonner aux changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          // Récupérer le rôle de l'utilisateur
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setUserRole(profileData.role);
          }
        } else {
          setUserRole(null);
        }
      }
    );
    
    // Nettoyage lors du démontage du composant
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Gérer la déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info('Vous avez été déconnecté');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <FaTrash className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">StopPoubelleCM</span>
              </Link>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600">
              Accueil
            </Link>
            <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600">
              Signalements
            </Link>
            <Link to="/report/new" className="px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700">
              Signaler
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={userRole === 'admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <FaUser className="mr-1" /> 
                  {userRole === 'admin' ? 'Administration' : 'Mon compte'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <FaSignOutAlt className="mr-1" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600">
                  <FaSignInAlt className="mr-1" /> Connexion
                </Link>
                <Link to="/register" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600">
                  <FaUserPlus className="mr-1" /> Inscription
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setIsOpen(false)}
            >
              Accueil
            </Link>
            <Link
              to="/reports"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setIsOpen(false)}
            >
              Signalements
            </Link>
            <Link
              to="/report/new"
              className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => setIsOpen(false)}
            >
              Signaler
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to={userRole === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="mr-1" /> 
                  {userRole === 'admin' ? 'Administration' : 'Mon compte'}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                >
                  <FaSignOutAlt className="mr-1" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  <FaSignInAlt className="mr-1" /> Connexion
                </Link>
                <Link
                  to="/register"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUserPlus className="mr-1" /> Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 