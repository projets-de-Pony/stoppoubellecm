import { useState } from 'react';
import { FaUsers, FaCheck, FaTimes, FaTrash, FaStar } from 'react-icons/fa';
import { TrashReport } from '../types';
import { updateTrashReport, recordInteraction } from '../services/supabase';
import { toast } from 'react-toastify';

interface TrashReportCardProps {
  report: TrashReport;
  showActions?: boolean;
}

const TrashReportCard = ({ report, showActions = false }: TrashReportCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!report || typeof report !== 'object') {
    console.error('TrashReportCard: Rapport invalide fourni', report);
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <p className="text-red-500">Erreur: Données de signalement invalides</p>
      </div>
    );
  }

  const handleStatusUpdate = async (newStatus: 'pending' | 'in_review' | 'resolved') => {
    setIsUpdating(true);
    try {
      await updateTrashReport(report.id, { status: newStatus });
      
      await recordInteraction();
      
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch (e) {
      console.error('TrashReportCard: Erreur de formatage de date', e);
      return 'Date invalide';
    }
  };

  const status = report.status && ['pending', 'in_review', 'resolved'].includes(report.status)
    ? report.status 
    : 'pending';

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const statusIcon = {
    pending: <></>,
    in_review: <FaUsers className="mr-1" />,
    resolved: <FaCheck className="mr-1" />
  };

  const statusText = {
    pending: 'En attente',
    in_review: 'Contribué',
    resolved: 'Résolu'
  };

  const size = report.size && ['small', 'medium', 'large', 'very_large'].includes(report.size)
    ? report.size
    : 'medium';
    
  const sizeText = {
    small: 'Petite',
    medium: 'Moyenne',
    large: 'Grande',
    very_large: 'Très grande',
  };

  const isContributed = status === 'in_review';
  
  const imageUrl = report.image_url || 'https://via.placeholder.com/300x200?text=Image+non+disponible';
  
  const neighborhood = report.location && report.location.neighborhood 
    ? report.location.neighborhood 
    : 'Emplacement non spécifié';

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${isContributed ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative">
        <img
          src={imageUrl}
          alt="Signalement"
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.error('TrashReportCard: Erreur de chargement d\'image', e);
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erreur+de+chargement';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusColor[status]}`}>
            {statusIcon[status]}
            {statusText[status]}
          </span>
        </div>
        
        {isContributed && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center">
              <FaStar className="mr-1" />
              Vérifié par la communauté
            </span>
          </div>
        )}
      </div>

      <div className={`p-4 ${isContributed ? 'bg-blue-50' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {neighborhood}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {report.description || 'Aucune description'}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="capitalize">{sizeText[size]}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(report.created_at)}</span>
        </div>

        {showActions && (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleStatusUpdate('pending')}
              disabled={isUpdating || status === 'pending'}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
              title="Marquer comme en attente"
            >
              <FaTimes />
            </button>
            <button
              onClick={() => handleStatusUpdate('in_review')}
              disabled={isUpdating || status === 'in_review'}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Marquer comme en cours de traitement"
            >
              <FaUsers />
            </button>
            <button
              onClick={() => handleStatusUpdate('resolved')}
              disabled={isUpdating || status === 'resolved'}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Marquer comme résolu"
            >
              <FaCheck />
            </button>
            <button
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Supprimer le signalement"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashReportCard; 