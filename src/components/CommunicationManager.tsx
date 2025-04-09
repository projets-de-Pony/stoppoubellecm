import { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaPhone, 
  FaHistory, 
  FaSpinner, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaEdit,
  FaSave
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  getPendingCommunications, 
  updateCommunicationStatus, 
  updateCommunicationInterval,
  sendEmailToMunicipality,
  MunicipalityCommunication
} from '../services/supabase';

const CommunicationManager = () => {
  const [pendingCommunications, setPendingCommunications] = useState<MunicipalityCommunication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingIntervalId, setEditingIntervalId] = useState<string | null>(null);
  const [newReminderInterval, setNewReminderInterval] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: ''
  });
  const [showEmailModal, setShowEmailModal] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCommunications();
  }, []);

  const fetchPendingCommunications = async () => {
    setIsLoading(true);
    try {
      const communications = await getPendingCommunications();
      setPendingCommunications(communications);
    } catch (error) {
      console.error('Erreur lors de la récupération des communications:', error);
      toast.error('Erreur lors du chargement des communications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: MunicipalityCommunication['status'], notes?: string) => {
    setProcessingId(id);
    try {
      const success = await updateCommunicationStatus(id, status, notes);
      if (success) {
        setPendingCommunications(communications => 
          communications.filter(comm => comm.id !== id)
        );
        toast.success(`Statut mis à jour avec succès: ${status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateInterval = async (id: string) => {
    if (!newReminderInterval || newReminderInterval < 1) {
      toast.error('L\'intervalle doit être au moins de 1 jour');
      return;
    }

    setProcessingId(id);
    try {
      const success = await updateCommunicationInterval(id, newReminderInterval);
      if (success) {
        setPendingCommunications(communications => 
          communications.map(comm => 
            comm.id === id ? { ...comm, reminder_interval: newReminderInterval } : comm
          )
        );
        toast.success('Intervalle de rappel mis à jour');
        setEditingIntervalId(null);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'intervalle:', error);
      toast.error('Erreur lors de la mise à jour de l\'intervalle');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendEmail = async (communication: MunicipalityCommunication) => {
    if (!emailContent.subject.trim() || !emailContent.message.trim()) {
      toast.error('Le sujet et le message sont requis');
      return;
    }

    setProcessingId(communication.id);
    try {
      const success = await sendEmailToMunicipality(
        communication.id,
        emailContent.subject,
        emailContent.message
      );

      if (success) {
        // Mettre à jour la liste des communications en attente
        setPendingCommunications(communications => 
          communications.filter(comm => comm.id !== communication.id)
        );
        toast.success('Email envoyé avec succès');
        setShowEmailModal(null);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: MunicipalityCommunication['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: MunicipalityCommunication['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'sent':
        return 'Envoyé';
      case 'received':
        return 'Reçu';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  const generateEmailContent = (communication: MunicipalityCommunication) => {
    const subject = `Signalement de décharge sauvage à ${communication.city_name} - Rappel ${communication.contact_count + 1}`;
    
    let message = `Bonjour,

Nous souhaitons vous informer qu'un citoyen a signalé une décharge sauvage dans votre commune, à l'emplacement suivant: ${communication.location?.neighborhood || 'Non spécifié'}.

Description du signalement:
${communication.description || 'Aucune description fournie'}

Ce signalement a été effectué le ${formatDate(communication.created_at)}.

`;

    if (communication.contact_count > 0) {
      message += `
Ceci est un rappel concernant ce signalement, pour lequel nous n'avons pas encore reçu de retour de votre part.
`;
    }

    message += `
Pourriez-vous nous informer des actions que vous comptez entreprendre pour résoudre ce problème?

Vous pouvez visualiser ce signalement et nous répondre directement en vous connectant à notre plateforme: https://StopPoubelleCM.com/admin/reports

Cordialement,
L'équipe StopPoubelleCM`;

    return { subject, message };
  };

  const handlePrepareEmail = (communication: MunicipalityCommunication) => {
    const emailTemplate = generateEmailContent(communication);
    setEmailContent(emailTemplate);
    setShowEmailModal(communication.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Communications avec les Municipalités</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'history'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Historique
          </button>
          <button
            onClick={fetchPendingCommunications}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            title="Rafraîchir"
          >
            <FaHistory />
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div>
          {pendingCommunications.length > 0 ? (
            <div className="space-y-4">
              {pendingCommunications.map(communication => (
                <div
                  key={communication.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {communication.municipality_name} ({communication.city_name})
                      </h3>
                      <div className="mt-1 text-sm text-gray-500">
                        {communication.contact_person && (
                          <p>Contact: {communication.contact_person}</p>
                        )}
                        {communication.email && (
                          <p className="flex items-center">
                            <FaEnvelope className="mr-1 text-gray-400" /> {communication.email}
                          </p>
                        )}
                        {communication.phone && (
                          <p className="flex items-center">
                            <FaPhone className="mr-1 text-gray-400" /> {communication.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          communication.status
                        )}`}
                      >
                        {getStatusText(communication.status)}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Contacts: {communication.contact_count}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Détails du signalement</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {communication.description || 'Aucune description'}
                      </p>
                      {communication.image_url && (
                        <img
                          src={communication.image_url}
                          alt="Signalement"
                          className="mt-2 w-full h-32 object-cover rounded-md"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Dates</h4>
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <p>
                          <span className="font-medium">Premier contact:</span>{' '}
                          {formatDate(communication.first_contact_date)}
                        </p>
                        <p>
                          <span className="font-medium">Dernier contact:</span>{' '}
                          {formatDate(communication.last_contact_date)}
                        </p>
                        <p>
                          <span className="font-medium">Prochain contact:</span>{' '}
                          {formatDate(communication.next_contact_date)}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="font-medium text-xs mr-2">Intervalle de rappel:</span>
                          {editingIntervalId === communication.id ? (
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="1"
                                value={newReminderInterval}
                                onChange={(e) => setNewReminderInterval(parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded mr-2"
                              />
                              <button
                                onClick={() => handleUpdateInterval(communication.id)}
                                disabled={processingId === communication.id}
                                className="p-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                              >
                                {processingId === communication.id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaSave />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingIntervalId(null)}
                                className="p-1 ml-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-xs">{communication.reminder_interval} jours</span>
                              <button
                                onClick={() => {
                                  setEditingIntervalId(communication.id);
                                  setNewReminderInterval(communication.reminder_interval);
                                }}
                                className="p-1 ml-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {communication.notes && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowNotes(showNotes === communication.id ? null : communication.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showNotes === communication.id ? 'Masquer les notes' : 'Afficher les notes'}
                      </button>
                      {showNotes === communication.id && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          {communication.notes}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handlePrepareEmail(communication)}
                      disabled={processingId === communication.id}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <FaEnvelope className="mr-1" /> Envoyer un email
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(communication.id, 'in_progress', 'Marqué comme en cours de traitement')}
                      disabled={processingId === communication.id}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                    >
                      {processingId === communication.id ? (
                        <FaSpinner className="animate-spin mr-1" />
                      ) : (
                        <FaCalendarAlt className="mr-1" />
                      )}{' '}
                      En cours
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(communication.id, 'resolved', 'Marqué comme résolu')}
                      disabled={processingId === communication.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      {processingId === communication.id ? (
                        <FaSpinner className="animate-spin mr-1" />
                      ) : (
                        <FaCheck className="mr-1" />
                      )}{' '}
                      Résolu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaExclamationTriangle className="mx-auto h-10 w-10 text-yellow-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune communication en attente</h3>
              <p className="mt-1 text-gray-500">
                Toutes les communications ont été traitées ou aucun signalement n'a encore été effectué.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal d'envoi d'email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Envoyer un email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input
                  type="text"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={10}
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({ ...emailContent, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const communication = pendingCommunications.find(c => c.id === showEmailModal);
                  if (communication) {
                    handleSendEmail(communication);
                  }
                }}
                disabled={processingId === showEmailModal}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {processingId === showEmailModal ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" /> Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaEnvelope className="mr-2" /> Envoyer
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationManager; 