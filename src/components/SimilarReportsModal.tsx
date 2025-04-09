import React from 'react';
import { FaTimes, FaCheck, FaPlus } from 'react-icons/fa';

interface SimilarReport {
  id: string;
  image_url: string;
  location: {
    neighborhood: string;
    latitude: number;
    longitude: number;
  };
  description: string;
  size: string;
  username?: string;
  similarity_score: number;
}

interface SimilarReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: SimilarReport[];
  onContribute: (reportId: string) => void;
  onContinue: () => void;
}

const SimilarReportsModal: React.FC<SimilarReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onContribute,
  onContinue
}) => {
  if (!isOpen) return null;

  const sizeText: Record<string, string> = {
    small: 'Petite',
    medium: 'Moyenne',
    large: 'Grande',
    very_large: 'Très grande'
  };

  const getSizeText = (size: string): string => {
    return sizeText[size as keyof typeof sizeText] || 'Taille inconnue';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <span className="sr-only">Fermer</span>
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Signalements similaires détectés
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Nous avons trouvé des signalements similaires dans cette zone. Vous pouvez :
                </p>
                <ul className="mt-2 text-sm text-gray-500">
                  <li>• Contribuer à un signalement existant</li>
                  <li>• Continuer avec votre nouveau signalement</li>
                </ul>
              </div>

              <div className="mt-4 space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-4">
                      <img
                        src={report.image_url}
                        alt="Signalement"
                        className="w-24 h-24 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{report.location.neighborhood}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Taille: {getSizeText(report.size)}</p>
                          {report.username && <p>Signalé par: {report.username}</p>}
                          <p>Similarité: {Math.round(report.similarity_score * 100)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => onContribute(report.id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        <FaCheck className="w-4 h-4 mr-2" />
                        Contribuer à ce signalement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 sm:ml-3 sm:w-auto"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Continuer avec mon signalement
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarReportsModal; 