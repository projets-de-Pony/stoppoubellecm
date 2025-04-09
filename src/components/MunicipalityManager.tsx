import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  getMunicipalities, 
  createMunicipality, 
  updateMunicipality, 
  deleteMunicipality, 
  Municipality,
  getCities
} from '../services/supabase';

const MunicipalityManager = () => {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; region?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Municipality>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les municipalités
        const municipalitiesData = await getMunicipalities();
        setMunicipalities(municipalitiesData);

        // Récupérer les villes
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreate = async (data: Municipality) => {
    try {
      const newMunicipality = await createMunicipality({
        name: data.name,
        city_id: data.city_id,
        email: data.email,
        phone: data.phone,
        address: data.address,
        contact_person: data.contact_person
      });

      if (newMunicipality) {
        setMunicipalities([...municipalities, newMunicipality]);
        toast.success('Municipalité ajoutée avec succès');
        setIsCreating(false);
        reset();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la municipalité:', error);
      toast.error('Erreur lors de la création de la municipalité');
    }
  };

  const handleEdit = (municipality: Municipality) => {
    setEditingId(municipality.id);
    reset(municipality);
  };

  const handleUpdate = async (data: Municipality) => {
    if (!editingId) return;

    try {
      const updatedMunicipality = await updateMunicipality(editingId, {
        name: data.name,
        city_id: data.city_id,
        email: data.email,
        phone: data.phone,
        address: data.address,
        contact_person: data.contact_person
      });

      if (updatedMunicipality) {
        setMunicipalities(
          municipalities.map(m => (m.id === editingId ? updatedMunicipality : m))
        );
        toast.success('Municipalité mise à jour avec succès');
        setEditingId(null);
        reset();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la municipalité:', error);
      toast.error('Erreur lors de la mise à jour de la municipalité');
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const success = await deleteMunicipality(id);
      if (success) {
        setMunicipalities(municipalities.filter(m => m.id !== id));
        toast.success('Municipalité supprimée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la municipalité:', error);
      toast.error('Erreur lors de la suppression de la municipalité');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    reset();
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
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Municipalités</h2>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FaPlus className="mr-2" /> Ajouter une municipalité
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit(editingId ? handleUpdate : handleCreate)} className="mb-8 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? 'Modifier la municipalité' : 'Ajouter une municipalité'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                {...register('name', { required: 'Le nom est requis' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <select
                {...register('city_id', { required: 'La ville est requise' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner une ville</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.city_id && <p className="mt-1 text-xs text-red-600">{errors.city_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Adresse email invalide'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personne à contacter</label>
              <input
                type="text"
                {...register('contact_person')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <FaTimes className="mr-2 inline" /> Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <FaSave className="mr-2 inline" /> {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {municipalities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {municipalities.map(municipality => (
                <tr key={municipality.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{municipality.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{municipality.cities?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{municipality.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{municipality.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{municipality.contact_person || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(municipality)}
                      disabled={!!editingId || isCreating}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(municipality.id)}
                      disabled={isDeleting === municipality.id}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      {isDeleting === municipality.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Aucune municipalité trouvée. Ajoutez-en une pour commencer.
        </div>
      )}
    </div>
  );
};

export default MunicipalityManager; 