import { FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">StopPoubelleCM</h3>
            <p className="text-gray-300 text-sm">
              Une initiative pour alerter les autorités camerounaises sur la présence de décharges
              sauvages et contribuer à un environnement plus propre.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="/reports" className="text-gray-300 hover:text-white transition-colors">
                  Signalements
                </a>
              </li>
              <li>
                <a href="/report/new" className="text-gray-300 hover:text-white transition-colors">
                  Signaler une décharge
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <FaTwitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FaInstagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FaGithub className="w-6 h-6" />
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-300">
              Pour toute question: contact@StopPoubelleCM.org
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-gray-300 text-center">
          &copy; {currentYear} StopPoubelleCM. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 