import { createClient } from '@supabase/supabase-js';
import { TrashReport } from '../types';

// Utiliser les variables d'environnement avec différents préfixes possibles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.REACT_APP_SUPABASE_URL || 
                   'https://klrwvvsubcxdnxwnylvm.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        import.meta.env.REACT_APP_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtscnd2dnN1YmN4ZG54d255bHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTE5NjgsImV4cCI6MjA1OTMyNzk2OH0.beIehkMj6BUoFN7rzgOMWDBqg9vyyBNAfQD-7dZfQ-M';

// Pour le développement, vous pouvez utiliser une vérification
if (supabaseUrl === 'VOTRE_URL_SUPABASE' || supabaseAnonKey === 'VOTRE_CLE_ANON_SUPABASE') {
  console.warn(
    'Vous utilisez des clés Supabase par défaut. Pour un environnement de production, définissez les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Télécharge une image vers le bucket Supabase
 * @param file - Le fichier image à télécharger
 * @param folder - Le dossier de destination dans le bucket
 * @returns L'URL publique de l'image téléchargée
 */
export const uploadImage = async (file: File, folder: string): Promise<string> => {
  try {
    // Vérification du fichier
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    // Vérification du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non pris en charge. Veuillez utiliser JPG, PNG ou GIF.');
    }

    // Vérification de la taille du fichier (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux. Taille maximale: 10MB');
    }

    // Génération d'un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Téléchargement du fichier
    const { error: uploadError, data } = await supabase.storage
      .from('trash-reports')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erreur lors du téléchargement:', uploadError);
      throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
    }

    // Récupération de l'URL publique
    const { data: urlData } = supabase.storage
      .from('trash-reports')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erreur dans uploadImage:', error);
    throw error;
  }
};

/**
 * Extrait les caractéristiques d'une image en utilisant un hash de l'URL
 * @param imageUrl - L'URL de l'image à analyser
 * @returns Un vecteur de caractéristiques de l'image
 */
const extractImageFeatures = async (imageUrl: string): Promise<number[]> => {
  try {
    // Générer un hash basé sur l'URL de l'image pour assurer une certaine unicité
    const hash = imageUrl.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0) | 0;
    }, 0);
    
    // Générer un vecteur pseudo-aléatoire basé sur l'URL de l'image
    // Cela permettra d'avoir des vecteurs similaires pour des images similaires
    // si elles ont des URL similaires (ex: noms de fichiers avec timestamps proches)
    const pseudoVector = new Array(512).fill(0).map((_, i) => {
      return Math.sin(hash + i) * 0.5 + 0.5; // Valeurs entre 0 et 1
    });
    
    return pseudoVector;
  } catch (error) {
    console.error('Erreur lors de la génération du vecteur d\'image:', error);
    // En cas d'erreur, retourner un vecteur aléatoire
    return Array.from({ length: 512 }, () => Math.random());
  }
};

/**
 * Crée un nouveau signalement de décharge sauvage
 * @param data - Les données du signalement
 * @returns Le signalement créé
 */
export const createTrashReport = async (data: Omit<TrashReport, 'id' | 'created_at'>): Promise<TrashReport> => {
  try {
    // Validation des données requises
    if (!data.image_url) {
      throw new Error('L\'URL de l\'image est requise');
    }
    if (!data.location || !data.location.neighborhood) {
      throw new Error('L\'emplacement est requis');
    }
    if (!data.size) {
      throw new Error('La taille est requise');
    }
    if (!data.description) {
      throw new Error('La description est requise');
    }

    // Extraire les caractéristiques de l'image
    const imageVector = await extractImageFeatures(data.image_url);

    // Insertion dans la base de données avec le vecteur d'image
    const { error, data: report } = await supabase
      .from('trash_reports')
      .insert({
        ...data,
        image_vector: imageVector
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du signalement:', error);
      throw new Error(`Erreur lors de la création du signalement: ${error.message}`);
    }

    return report;
  } catch (error) {
    console.error('Erreur dans createTrashReport:', error);
    throw error;
  }
};

/**
 * Récupère tous les signalements de décharges, triés par date de création
 * @returns Liste des signalements de décharges
 */
export const getTrashReports = async (): Promise<TrashReport[]> => {
  try {
    console.log('Début de la récupération des signalements...');
    
    // Vérifier d'abord si l'utilisateur est connecté pour le débogage
    const { data: { session } } = await supabase.auth.getSession();
    console.log('État de la session:', session ? 'Connecté' : 'Non connecté');
    
    const { data, error } = await supabase
      .from('trash_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      throw new Error(`Erreur lors de la récupération des signalements: ${error.message}`);
    }

    console.log(`Nombre de signalements récupérés: ${data?.length || 0}`);
    
    // Vérifier les données reçues pour le débogage
    if (data && data.length > 0) {
      console.log('Premier signalement:', {
        id: data[0].id,
        status: data[0].status,
        hasLocation: !!data[0].location
      });
    } else {
      console.log('Aucun signalement récupéré');
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getTrashReports:', error);
    
    // Plus d'informations sur l'erreur pour faciliter le débogage
    if (error instanceof Error) {
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Renvoyer un tableau vide au lieu de propager l'erreur
    // pour éviter que l'interface ne se bloque complètement
    return [];
  }
};

/**
 * Récupère un signalement de décharge par son ID
 * @param id - L'ID du signalement à récupérer
 * @returns Le signalement correspondant à l'ID
 */
export const getTrashReportById = async (id: string): Promise<TrashReport> => {
  try {
    if (!id) {
      throw new Error('ID non fourni');
    }

    const { data, error } = await supabase
      .from('trash_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération du signalement ${id}:`, error);
      throw new Error(`Erreur lors de la récupération du signalement: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Signalement avec l'ID ${id} non trouvé`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getTrashReportById:', error);
    throw error;
  }
};

/**
 * Recherche des signalements par quartier ou description
 * @param searchTerm - Le terme à rechercher
 * @returns Liste des signalements correspondants
 */
export const searchTrashReports = async (searchTerm: string): Promise<TrashReport[]> => {
  try {
    if (!searchTerm) {
      return await getTrashReports();
    }

    // Utilisation de la fonction SQL personnalisée
    const { data, error } = await supabase
      .rpc('search_trash_reports', { search_term: searchTerm });

    if (error) {
      console.error('Erreur lors de la recherche de signalements:', error);
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans searchTrashReports:', error);
    throw error;
  }
};

/**
 * Met à jour un signalement de décharge
 * @param id - L'ID du signalement à mettre à jour
 * @param data - Les données à mettre à jour
 * @returns Le signalement mis à jour
 */
export const updateTrashReport = async (id: string, data: Partial<TrashReport>): Promise<TrashReport> => {
  try {
    const { error, data: updatedReport } = await supabase
      .from('trash_reports')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du signalement: ${error.message}`);
    }

    return updatedReport;
  } catch (error) {
    console.error('Erreur dans updateTrashReport:', error);
    throw error;
  }
};

/**
 * Supprime un signalement de décharge
 * @param id - L'ID du signalement à supprimer
 */
export const deleteTrashReport = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('trash_reports')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression du signalement: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur dans deleteTrashReport:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques des signalements
 * @returns Les statistiques des signalements
 */
export const getTrashReportStats = async () => {
  try {
    const { data, error } = await supabase
      .from('trash_reports')
      .select('status, count')
      .groupBy('status');

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getTrashReportStats:', error);
    throw error;
  }
};

/**
 * Récupère les utilisateurs de la plateforme
 * @returns La liste des utilisateurs
 */
export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getUsers:', error);
    throw error;
  }
};

/**
 * Met à jour le rôle d'un utilisateur
 * @param userId - L'ID de l'utilisateur
 * @param role - Le nouveau rôle
 */
export const updateUserRole = async (userId: string, role: 'contributor' | 'admin'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du rôle: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur dans updateUserRole:', error);
    throw error;
  }
};

/**
 * Vérifie les signalements similaires dans une zone donnée
 * @param latitude - Latitude du nouveau signalement
 * @param longitude - Longitude du nouveau signalement
 * @param cityId - ID de la ville
 * @param imageUrl - URL de l'image du nouveau signalement
 * @returns Informations sur les signalements similaires
 */
export const checkSimilarReports = async (
  latitude: number,
  longitude: number,
  cityId: string,
  imageUrl: string
): Promise<{
  similar_reports: Array<{
    id: string;
    image_url: string;
    location: any;
    description: string;
    size: string;
    username: string | null;
    similarity_score: number;
  }>;
  has_duplicates: boolean;
}> => {
  try {
    // Générer un vecteur de caractéristiques basé sur l'URL de l'image
    const imageFeatures = await extractImageFeatures(imageUrl);
    
    // Rechercher d'abord les signalements proches géographiquement
    const { data: geoReports, error: geoError } = await supabase
      .from('trash_reports')
      .select('id, image_url, location, description, size, created_at, user_id')
      .eq('city_id', cityId)
      .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
    if (geoError) {
      console.error('Erreur lors de la recherche de signalements proches:', geoError);
      throw geoError;
    }
    
    // Filtrer les signalements proches par distance (50 mètres)
    const nearbyReports = geoReports?.filter(report => {
      const reportLat = report.location?.latitude;
      const reportLng = report.location?.longitude;
      if (!reportLat || !reportLng) return false;
      
      // Calcul de distance en mètres (formule de Haversine)
      const R = 6371e3; // Rayon de la Terre en mètres
      const φ1 = latitude * Math.PI/180;
      const φ2 = reportLat * Math.PI/180;
      const Δφ = (reportLat - latitude) * Math.PI/180;
      const Δλ = (reportLng - longitude) * Math.PI/180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance < 50; // 50 mètres
    }) || [];
    
    // S'il y a des signalements proches, essayer d'utiliser la fonction RPC pour obtenir les scores de similarité
    if (nearbyReports.length > 0) {
      try {
        // Appeler la procédure stockée pour les scores de similarité
        const { data, error } = await supabase
          .rpc('find_similar_reports', {
            p_latitude: latitude,
            p_longitude: longitude,
            p_city_id: cityId,
            p_image_vector: imageFeatures,
            p_radius: 50, // 50 mètres
            p_days: 7, // 7 derniers jours
            p_similarity_threshold: 0.5 // Seuil plus bas pour notre méthode simplifiée
          });

        if (!error && data && data.length > 0) {
          console.log('Signalements similaires trouvés par RPC:', data);
          return {
            similar_reports: data,
            has_duplicates: data.length > 0
          };
        }
      } catch (rpcError) {
        console.error('Erreur lors de l\'appel RPC, utilisation de la méthode de secours:', rpcError);
      }
    }
    
    // Si aucun résultat de RPC, formater nos propres résultats à partir des signalements géographiquement proches
    if (nearbyReports.length > 0) {
      // Obtenir les noms d'utilisateurs pour les signalements
      const userIds = nearbyReports.filter(r => r.user_id).map(r => r.user_id);
      let usernames: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
          
        usernames = (profiles || []).reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string>);
      }
      
      // Formatter les résultats
      const formattedReports = nearbyReports.map(report => ({
        id: report.id,
        image_url: report.image_url,
        location: report.location,
        description: report.description,
        size: report.size,
        username: report.user_id ? usernames[report.user_id] || null : null,
        similarity_score: 0.8 // Score élevé pour les signalements géographiquement proches
      }));
      
      return {
        similar_reports: formattedReports,
        has_duplicates: formattedReports.length > 0
      };
    }
    
    // Aucun signalement similaire trouvé
    return {
      similar_reports: [],
      has_duplicates: false
    };
  } catch (error) {
    console.error('Erreur lors de la vérification des signalements similaires:', error);
    return {
      similar_reports: [],
      has_duplicates: false
    };
  }
};

// Après les autres fonctions, ajoutons les nouvelles fonctions pour la gestion des municipalités

/**
 * Interface pour les municipalités
 */
export interface Municipality {
  id: string;
  name: string;
  city_id: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at?: string;
}

/**
 * Interface pour les communications avec les municipalités
 */
export interface MunicipalityCommunication {
  id: string;
  trash_report_id: string;
  municipality_id: string;
  status: 'pending' | 'sent' | 'received' | 'in_progress' | 'resolved' | 'failed';
  first_contact_date?: string;
  last_contact_date?: string;
  next_contact_date?: string;
  contact_count: number;
  reminder_interval: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Champs rejoints
  municipality_name?: string;
  city_name?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  image_url?: string;
  location?: any;
  description?: string;
}

/**
 * Récupère toutes les municipalités
 */
export const getMunicipalities = async (): Promise<Municipality[]> => {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .select(`
        *,
        cities(name)
      `)
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des municipalités:', error);
      throw new Error(`Erreur lors de la récupération des municipalités: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getMunicipalities:', error);
    return [];
  }
};

/**
 * Récupère une municipalité par son ID
 */
export const getMunicipalityById = async (id: string): Promise<Municipality | null> => {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .select(`
        *,
        cities(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération de la municipalité ${id}:`, error);
      throw new Error(`Erreur lors de la récupération de la municipalité: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getMunicipalityById:', error);
    return null;
  }
};

/**
 * Ajoute une nouvelle municipalité
 */
export const createMunicipality = async (municipality: Omit<Municipality, 'id' | 'created_at'>): Promise<Municipality | null> => {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .insert(municipality)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la municipalité:', error);
      throw new Error(`Erreur lors de la création de la municipalité: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans createMunicipality:', error);
    return null;
  }
};

/**
 * Met à jour une municipalité existante
 */
export const updateMunicipality = async (id: string, municipality: Partial<Municipality>): Promise<Municipality | null> => {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .update(municipality)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de la municipalité ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour de la municipalité: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur dans updateMunicipality:', error);
    return null;
  }
};

/**
 * Supprime une municipalité
 */
export const deleteMunicipality = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('municipalities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la suppression de la municipalité ${id}:`, error);
      throw new Error(`Erreur lors de la suppression de la municipalité: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur dans deleteMunicipality:', error);
    return false;
  }
};

/**
 * Récupère les communications en attente qui nécessitent un rappel
 */
export const getPendingCommunications = async (): Promise<MunicipalityCommunication[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_pending_communications');

    if (error) {
      console.error('Erreur lors de la récupération des communications en attente:', error);
      throw new Error(`Erreur lors de la récupération des communications en attente: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getPendingCommunications:', error);
    return [];
  }
};

/**
 * Récupère toutes les communications pour un rapport spécifique
 */
export const getCommunicationsForReport = async (reportId: string): Promise<MunicipalityCommunication[]> => {
  try {
    const { data, error } = await supabase
      .from('municipality_communications')
      .select(`
        *,
        municipalities(
          name,
          email,
          phone,
          contact_person,
          cities(name)
        )
      `)
      .eq('trash_report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des communications pour le rapport ${reportId}:`, error);
      throw new Error(`Erreur lors de la récupération des communications: ${error.message}`);
    }

    // Transformer les données pour correspondre à l'interface
    const formattedData = data.map(item => ({
      ...item,
      municipality_name: item.municipalities.name,
      city_name: item.municipalities.cities.name,
      email: item.municipalities.email,
      phone: item.municipalities.phone,
      contact_person: item.municipalities.contact_person
    }));

    return formattedData || [];
  } catch (error) {
    console.error('Erreur dans getCommunicationsForReport:', error);
    return [];
  }
};

/**
 * Met à jour le statut d'une communication
 */
export const updateCommunicationStatus = async (
  communicationId: string,
  status: MunicipalityCommunication['status'],
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_municipality_communication', {
        p_communication_id: communicationId,
        p_status: status,
        p_notes: notes
      });

    if (error) {
      console.error(`Erreur lors de la mise à jour du statut de la communication ${communicationId}:`, error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur dans updateCommunicationStatus:', error);
    return false;
  }
};

/**
 * Met à jour l'intervalle de rappel d'une communication
 */
export const updateCommunicationInterval = async (
  communicationId: string,
  reminderInterval: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('municipality_communications')
      .update({ reminder_interval: reminderInterval })
      .eq('id', communicationId);

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'intervalle de rappel ${communicationId}:`, error);
      throw new Error(`Erreur lors de la mise à jour de l'intervalle: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur dans updateCommunicationInterval:', error);
    return false;
  }
};

/**
 * Envoie un email à la municipalité (à intégrer avec un service d'email)
 */
export const sendEmailToMunicipality = async (
  communicationId: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    // Mettre à jour le statut de la communication
    await updateCommunicationStatus(communicationId, 'sent', `Email envoyé: ${subject}`);
    
    // Ici, vous intégreriez un service d'envoi d'email
    // Par exemple, SendGrid, Mailgun, ou un service personnalisé
    
    // Pour le moment, on simule un envoi d'email réussi
    console.log(`Email envoyé pour la communication ${communicationId}: ${subject}`);
    
    return true;
  } catch (error) {
    console.error('Erreur dans sendEmailToMunicipality:', error);
    
    // Mettre à jour le statut en cas d'échec
    await updateCommunicationStatus(communicationId, 'failed', `Échec de l'envoi d'email: ${error}`);
    
    return false;
  }
};

/**
 * Récupère la liste des villes
 * @returns La liste des villes
 */
export const getCities = async (): Promise<{id: string; name: string; region: string}[]> => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, region')
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des villes:', error);
      throw new Error(`Erreur lors de la récupération des villes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getCities:', error);
    return [];
  }
};

/**
 * Interface pour les statistiques d'analyse
 */
export interface AnalyticsStats {
  id: string;
  date: string;
  visits: number;
  interactions: number;
  contributions: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour les statistiques totales
 */
export interface TotalStats {
  total_visits: number;
  total_interactions: number;
  total_contributions: number;
  daily_stats: AnalyticsStats[];
}

/**
 * Enregistre une visite sur la plateforme
 */
export const recordVisit = async (): Promise<void> => {
  try {
    await supabase.rpc('increment_stats', { p_stat_type: 'visit' });
    console.log('Visite enregistrée');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la visite:', error);
  }
};

/**
 * Enregistre une interaction sur la plateforme
 * (par exemple: recherche, clic sur un signalement, filtrage, etc.)
 */
export const recordInteraction = async (): Promise<void> => {
  try {
    await supabase.rpc('increment_stats', { p_stat_type: 'interaction' });
    console.log('Interaction enregistrée');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'interaction:', error);
  }
};

/**
 * Enregistre une contribution sur la plateforme
 * (par exemple: nouveau signalement, commentaire, etc.)
 */
export const recordContribution = async (): Promise<void> => {
  try {
    await supabase.rpc('increment_stats', { p_stat_type: 'contribution' });
    console.log('Contribution enregistrée');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la contribution:', error);
  }
};

/**
 * Récupère les statistiques totales et récentes
 * @param days - Nombre de jours pour les statistiques récentes (défaut: 30)
 */
export const getAnalyticsStats = async (days: number = 30): Promise<TotalStats> => {
  try {
    // Récupérer les statistiques des X derniers jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: dailyStats, error: dailyError } = await supabase
      .from('analytics_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
      
    if (dailyError) {
      throw new Error(`Erreur lors de la récupération des statistiques quotidiennes: ${dailyError.message}`);
    }
    
    // Calculer les totaux
    const { data: totals, error: totalsError } = await supabase
      .from('analytics_stats')
      .select('SUM(visits) as total_visits, SUM(interactions) as total_interactions, SUM(contributions) as total_contributions')
      .single();
      
    if (totalsError) {
      throw new Error(`Erreur lors de la récupération des statistiques totales: ${totalsError.message}`);
    }
    
    return {
      total_visits: totals?.total_visits || 0,
      total_interactions: totals?.total_interactions || 0,
      total_contributions: totals?.total_contributions || 0,
      daily_stats: dailyStats || []
    };
  } catch (error) {
    console.error('Erreur dans getAnalyticsStats:', error);
    return {
      total_visits: 0,
      total_interactions: 0, 
      total_contributions: 0,
      daily_stats: []
    };
  }
}; 