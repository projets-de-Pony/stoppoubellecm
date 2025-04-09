import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaChevronDown, FaSync, FaCamera, FaMapMarkedAlt, FaLeaf, FaTag, FaSort, FaTimes } from 'react-icons/fa';
import { getTrashReports, searchTrashReports, recordInteraction } from '../services/supabase';
import { TrashReport } from '../types';
import TrashReportCard from '../components/TrashReportCard';
import MapComponent from '../components/MapComponent';

const ReportsPage = () => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TrashReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    status: [] as string[],
    size: [] as string[],
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getTrashReports();
        setReports(data);
        setFilteredReports(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des signalements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    // Appliquer les filtres et la recherche
    let result = [...reports];

    // Appliquer la recherche
    if (searchQuery.trim() !== '') {
      result = result.filter(report => 
        report.location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Appliquer les filtres de statut
    if (filters.status.length > 0) {
      result = result.filter(report => filters.status.includes(report.status));
    }

    // Appliquer les filtres de taille
    if (filters.size.length > 0) {
      result = result.filter(report => filters.size.includes(report.size));
    }

    // Trier les résultats
    result = result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredReports(result);

    // Mise à jour des filtres actifs pour l'affichage
    const newActiveFilters: string[] = [];
    
    filters.status.forEach(status => {
      switch(status) {
        case 'pending': newActiveFilters.push('En attente'); break;
        case 'in_review': newActiveFilters.push('Contribué'); break;
        case 'resolved': newActiveFilters.push('Résolu'); break;
      }
    });
    
    filters.size.forEach(size => {
      switch(size) {
        case 'small': newActiveFilters.push('Petite'); break;
        case 'medium': newActiveFilters.push('Moyenne'); break;
        case 'large': newActiveFilters.push('Grande'); break;
        case 'very_large': newActiveFilters.push('Très grande'); break;
      }
    });
    
    setActiveFilters(newActiveFilters);

  }, [searchQuery, filters, reports, sortBy]);

  useEffect(() => {
    // Fermer le menu de filtres si on clique ailleurs
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // Enregistrer une interaction lors de la recherche
    if (e.target.value.length > 2) {
      recordInteraction();
    }
  };

  const handleFilterChange = (category: 'status' | 'size', value: string) => {
    const newFilters = { ...filters };
    
    if (newFilters[category].includes(value)) {
      // Retirer le filtre s'il est déjà présent
      newFilters[category] = newFilters[category].filter(f => f !== value);
      setActiveFilters(prev => prev.filter(f => f !== `${category}:${value}`));
    } else {
      // Ajouter le nouveau filtre
      newFilters[category].push(value);
      setActiveFilters(prev => [...prev, `${category}:${value}`]);
    }
    
    setFilters(newFilters);
    
    // Enregistrer une interaction lors du filtrage
    recordInteraction();
  };

  const removeFilter = (filter: string) => {
    let category: 'status' | 'size' | null = null;
    let value: string | null = null;

    switch(filter) {
      case 'En attente': category = 'status'; value = 'pending'; break;
      case 'Contribué': category = 'status'; value = 'in_review'; break;
      case 'Résolu': category = 'status'; value = 'resolved'; break;
      case 'Petite': category = 'size'; value = 'small'; break;
      case 'Moyenne': category = 'size'; value = 'medium'; break;
      case 'Grande': category = 'size'; value = 'large'; break;
      case 'Très grande': category = 'size'; value = 'very_large'; break;
    }

    if (category && value) {
      handleFilterChange(category, value);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      size: [],
    });
    setSearchQuery('');
  };

  const toggleSort = () => {
    setSortBy(sortBy === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bannière supérieure avec effet gradient */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Décharges signalées
              </h1>
              <p className="mt-2 text-primary-100 max-w-3xl">
                Explorez les décharges sauvages signalées par notre communauté et contribuez à un Cameroun plus propre.
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-3">
              <button
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-gray-50"
              >
                <FaMapMarkedAlt className="mr-2" />
                {showMap ? 'Masquer la carte' : 'Afficher la carte'}
              </button>
              <Link
                to="/report/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FaCamera className="mr-2" />
                Signaler
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Carte */}
      {showMap && (
        <div className="w-full bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-[450px] rounded-lg overflow-hidden">
              <MapComponent className="rounded-lg" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recherche et filtres */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 py-3 rounded-lg border-gray-300 w-full focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Rechercher par quartier ou description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <FaTimes className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <div className="relative" ref={filterRef}>
                  <button
                    className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex items-center"
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <FaFilter className="mr-2 text-gray-500" />
                    Filtres
                    <FaChevronDown className={`ml-2 transition-transform ${filterOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  {filterOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="p-5">
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Statut</h3>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.status.includes('pending')}
                                onChange={() => handleFilterChange('status', 'pending')}
                              />
                              <span className="ml-2 text-sm text-gray-700">En attente</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.status.includes('in_review')}
                                onChange={() => handleFilterChange('status', 'in_review')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Contribué</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.status.includes('resolved')}
                                onChange={() => handleFilterChange('status', 'resolved')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Résolu</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Taille</h3>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.size.includes('small')}
                                onChange={() => handleFilterChange('size', 'small')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Petite</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.size.includes('medium')}
                                onChange={() => handleFilterChange('size', 'medium')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Moyenne</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.size.includes('large')}
                                onChange={() => handleFilterChange('size', 'large')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Grande</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={filters.size.includes('very_large')}
                                onChange={() => handleFilterChange('size', 'very_large')}
                              />
                              <span className="ml-2 text-sm text-gray-700">Très grande</span>
                            </label>
                          </div>
                        </div>
                        
                        <button
                          onClick={resetFilters}
                          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <FaSync className="mr-2" />
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleSort}
                  className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex items-center"
                >
                  <FaSort className="mr-2 text-gray-500" />
                  {sortBy === 'newest' ? 'Plus récents' : 'Plus anciens'}
                </button>
              </div>
            </div>

            {/* Filtres actifs */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <div key={filter} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                    <span>{filter}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-2 text-primary-600 hover:text-primary-900"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-gray-700 text-sm ml-2"
                >
                  Effacer tout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredReports.length > 0 ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaLeaf className="text-primary-500 mr-2" />
                {filteredReports.length} signalement{filteredReports.length > 1 ? 's' : ''} trouvé{filteredReports.length > 1 ? 's' : ''}
              </h2>
              <div className="text-sm text-gray-500">
                <FaTag className="inline mr-1" /> Triés par: {sortBy === 'newest' ? 'Plus récents' : 'Plus anciens'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <TrashReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="inline-block p-4 rounded-full bg-primary-100 text-primary-600 mb-4">
              <FaSearch className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucun signalement trouvé</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Aucun signalement ne correspond à votre recherche. Essayez de modifier vos filtres ou votre requête de recherche.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FaSync className="mr-2" />
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage; 