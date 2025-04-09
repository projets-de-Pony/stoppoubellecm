import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaCamera, FaUpload, FaSpinner, FaMapMarkerAlt, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { ReportFormData } from '../types';
import { uploadImage, createTrashReport, supabase, checkSimilarReports, recordContribution } from '../services/supabase';
import { toast } from 'react-toastify';
import SimilarReportsModal from './SimilarReportsModal';

interface City {
  id: string;
  name: string;
  region: string;
}

interface ReportFormProps {
  isAuthenticated: boolean;
  onSuccess?: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ isAuthenticated, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitAs, setSubmitAs] = useState<'anonymous' | 'contributor'>(
    isAuthenticated ? 'contributor' : 'anonymous'
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [similarReports, setSimilarReports] = useState<any[]>([]);
  const [showSimilarReportsModal, setShowSimilarReportsModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Charger la liste des villes
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erreur lors du chargement des villes:', error);
        return;
      }
      
      setCities(data || []);
    };

    fetchCities();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReportFormData>({
    defaultValues: {
      location: {
        neighborhood: '',
      },
      size: '',
      description: '',
      image_file: null,
    }
  });

  // Observer les changements sur les champs de géolocalisation
  const watchLocation = watch('location');

  // Demander automatiquement la géolocalisation au chargement du composant
  useEffect(() => {
    if (!locationRequested) {
      // Petit délai pour que le toast ne s'affiche pas immédiatement au chargement de la page
      const timer = setTimeout(() => {
        toast.info("Nous allons vous demander votre position pour faciliter votre signalement", {
          autoClose: 3000,
        });
        getGeolocation();
        setLocationRequested(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [locationRequested]);

  // Récupérer la position géographique de l'utilisateur
  const getGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas prise en charge par votre navigateur');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location.latitude', latitude);
        setValue('location.longitude', longitude);
        setLocation({ latitude, longitude });
        setIsGeolocating(false);
        toast.success('Position géographique récupérée avec succès');
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        let errorMsg = 'Impossible de récupérer votre position';
        
        if (error.code === 1) {
          errorMsg = 'Vous avez refusé l\'accès à votre position géographique';
        } else if (error.code === 2) {
          errorMsg = 'Position non disponible';
        } else if (error.code === 3) {
          errorMsg = 'Délai d\'attente dépassé pour obtenir la position';
        }
        
        toast.error(errorMsg);
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Le fichier est trop volumineux. Taille maximale: 10MB');
      return;
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non pris en charge. Veuillez utiliser JPG, PNG ou GIF.');
      return;
    }

    setValue('image_file', file);

    // Créer une URL d'aperçu pour l'image
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const handleContribute = async (reportId: string) => {
    setIsSubmitting(true);
    try {
      // Vérifier d'abord si le rapport existe
      const { data: report, error: reportError } = await supabase
        .from('trash_reports')
        .select('id, similar_reports')
        .eq('id', reportId)
        .single();
        
      if (reportError || !report) {
        throw new Error('Signalement non trouvé');
      }
      
      // Pour contribuer, nous pouvons simplement enregistrer le signalement comme vu
      // et éventuellement stocker une référence dans un tableau (à implémenter plus tard)
      await supabase
        .from('trash_reports')
        .update({
          // Nous mettons à jour les similar_reports pour indiquer que le signalement a été "contribué"
          // Cela permet de garder une trace des contributions
          status: 'in_review' // Changer le statut pour montrer qu'il y a une activité sur ce signalement
        })
        .eq('id', reportId);

      toast.success('Merci pour votre contribution !');
      setShowSimilarReportsModal(false);
      if (onSuccess) {
        onSuccess();
      }

      // Enregistrer la contribution
      await recordContribution();
    } catch (error) {
      console.error('Erreur lors de la contribution:', error);
      toast.error('Une erreur est survenue lors de la contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!data.image_file) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (!data.city) {
      toast.error('Veuillez sélectionner une ville');
      return;
    }

    setIsSubmitting(true);

    try {
      // Téléchargement de l'image
      const imageUrl = await uploadImage(data.image_file, 'reports');

      // Vérifier les signalements similaires
      if (data.location.latitude && data.location.longitude) {
        try {
          const similarResults = await checkSimilarReports(
            data.location.latitude,
            data.location.longitude,
            data.city,
            imageUrl
          );

          console.log("Résultats similaires:", similarResults);

          if (similarResults.has_duplicates && similarResults.similar_reports.length > 0) {
            console.log("Signalements similaires trouvés:", similarResults.similar_reports);
            setSimilarReports(similarResults.similar_reports);
            setShowSimilarReportsModal(true);
            setPendingSubmission({
              ...data,
              image_url: imageUrl
            });
            setIsSubmitting(false);
            return;
          }
        } catch (checkError) {
          console.error("Erreur lors de la vérification des signalements similaires:", checkError);
          // Continuer avec la soumission même en cas d'erreur de vérification
        }
      }

      // Soumettre directement si aucun similaire
      await submitReport(data, imageUrl);
      
      // Enregistrer la contribution
      await recordContribution();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      let errorMessage = 'Une erreur est survenue lors de la soumission du signalement';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReport = async (data: ReportFormData, imageUrl: string) => {
    try {
      const reportData = {
        image_url: imageUrl,
        location: {
          neighborhood: data.location.neighborhood,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        city_id: data.city,
        size: data.size,
        description: data.description,
        status: 'pending',
        ...(isAuthenticated && submitAs === 'contributor' && currentUser && { user_id: currentUser }),
      };

      await createTrashReport(reportData);
      
      toast.success('Votre signalement a été soumis avec succès');
      reset();
      setPreviewUrl(null);
      setSimilarReports([]);
      setShowSimilarReportsModal(false);
      setPendingSubmission(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      throw error;
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Signaler une décharge sauvage</h2>
      
      {/* Notification d'information sur la géolocalisation */}
      {!watchLocation?.latitude && !watchLocation?.longitude && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Une localisation précise permet de mieux identifier les décharges sauvages.
                {!locationRequested ? " Nous allons vous demander votre position automatiquement." : " Si vous avez refusé l'accès à votre position, vous pouvez cliquer sur \"Utiliser ma position\"."}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo de la décharge*
          </label>
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="mx-auto h-64 w-auto rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setValue('image_file', null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    X
                  </button>
                </div>
              ) : (
                <>
                  <FaCamera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                    >
                      <span>Télécharger une photo</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF jusqu'à 10MB
                  </p>
                </>
              )}
            </div>
          </div>
          {errors.image_file && (
            <p className="mt-1 text-sm text-red-600">
              {errors.image_file.message}
            </p>
          )}
        </div>

        {/* Sélection de la ville */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Ville*
          </label>
          <select
            id="city"
            className="form-input mt-1"
            {...register('city', { required: 'La ville est requise' })}
          >
            <option value="">Sélectionnez une ville</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.region})
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        {/* Quartier et Géolocalisation */}
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
              Quartier / Lieu*
            </label>
            <button
              type="button"
              onClick={getGeolocation}
              disabled={isGeolocating}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              <FaMapMarkerAlt className="mr-1" />
              {isGeolocating ? 'Localisation en cours...' : 'Utiliser ma position'}
            </button>
          </div>
          <input
            id="neighborhood"
            type="text"
            className="form-input mt-1"
            placeholder="Ex: Melen, Biyem-Assi, etc."
            {...register('location.neighborhood', { required: 'Le quartier est requis' })}
          />
          {errors.location?.neighborhood && (
            <p className="mt-1 text-sm text-red-600">
              {errors.location.neighborhood.message}
            </p>
          )}

          {/* Afficher les coordonnées si disponibles */}
          {(watchLocation?.latitude && watchLocation?.longitude) && (
            <div className="mt-2 text-xs text-gray-500">
              Position: {watchLocation.latitude.toFixed(6)}, {watchLocation.longitude.toFixed(6)}
              <input
                type="hidden"
                {...register('location.latitude')}
              />
              <input
                type="hidden"
                {...register('location.longitude')}
              />
            </div>
          )}
        </div>

        {/* Taille */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">
            Taille de la décharge*
          </label>
          <select
            id="size"
            className="form-input mt-1"
            {...register('size', { required: 'La taille est requise' })}
          >
            <option value="">Sélectionnez une taille</option>
            <option value="small">Petite (moins d'un mètre carré)</option>
            <option value="medium">Moyenne (1-10 mètres carrés)</option>
            <option value="large">Grande (10-50 mètres carrés)</option>
            <option value="very_large">Très grande (plus de 50 mètres carrés)</option>
          </select>
          {errors.size && (
            <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description*
          </label>
          <textarea
            id="description"
            rows={4}
            className="form-input mt-1"
            placeholder="Décrivez la situation (type de déchets, danger, etc.)"
            {...register('description', {
              required: 'La description est requise',
              minLength: {
                value: 20,
                message: 'La description doit contenir au moins 20 caractères',
              },
            })}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Submit as */}
        {isAuthenticated && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soumettre en tant que:
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="submitAs"
                  value="contributor"
                  checked={submitAs === 'contributor'}
                  onChange={() => setSubmitAs('contributor')}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Contributeur identifié
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="submitAs"
                  value="anonymous"
                  checked={submitAs === 'anonymous'}
                  onChange={() => setSubmitAs('anonymous')}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">Anonyme</span>
              </label>
            </div>
          </div>
        )}

        {similarReports.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {similarReports.length} signalement(s) similaire(s) trouvé(s) dans cette zone.
                  Veuillez vérifier si votre signalement n'a pas déjà été fait.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-8 py-3 flex items-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              'Soumettre le signalement'
            )}
          </button>
        </div>
      </form>

      <SimilarReportsModal
        isOpen={showSimilarReportsModal}
        onClose={() => {
          console.log("Fermeture de la modale des signalements similaires");
          setShowSimilarReportsModal(false);
        }}
        reports={similarReports}
        onContribute={(reportId) => {
          console.log("Contribution au signalement:", reportId);
          handleContribute(reportId);
        }}
        onContinue={() => {
          console.log("Continuer avec le nouveau signalement");
          if (pendingSubmission) {
            submitReport(pendingSubmission, pendingSubmission.image_url);
          }
          setShowSimilarReportsModal(false);
        }}
      />
    </div>
  );
};

export default ReportForm; 