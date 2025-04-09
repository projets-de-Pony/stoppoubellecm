import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css'; // Importer notre CSS personnalisé
import { TrashReport } from '../types';
import { getTrashReports } from '../services/supabase';

// Correction de l'icône par défaut de Leaflet
// (nécessaire car les chemins relatifs sont cassés dans le build)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Assignation manuelle des icônes pour éviter les problèmes de chemin d'accès
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface MapComponentProps {
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ className = '' }) => {
  const [reports, setReports] = useState<TrashReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Position du centre du Cameroun
  const cameroonCenter = [7.3697, 12.3547];
  const defaultZoom = 6;

  // Chargement des signalements
  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log('MapComponent: Chargement des signalements...');
        const reportsData = await getTrashReports();
        console.log(`MapComponent: ${reportsData.length} signalements récupérés`);
        
        // Filtrer les signalements qui ont des coordonnées valides
        const validReports = reportsData.filter(
          (report) => report.location && report.location.latitude && report.location.longitude
        );
        
        console.log(`MapComponent: ${validReports.length} signalements avec coordonnées valides`);
        
        // Vérifier les coordonnées du premier signalement pour débogage
        if (validReports.length > 0) {
          const firstReport = validReports[0];
          console.log('MapComponent: Premier signalement valide:', {
            id: firstReport.id,
            latitude: firstReport.location.latitude,
            longitude: firstReport.location.longitude
          });
        }
        
        setReports(validReports);
      } catch (error) {
        console.error('MapComponent: Erreur lors du chargement des signalements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Couleurs des marqueurs selon le statut
  const statusColors = {
    pending: { color: '#FFC107', fillColor: '#FFC107' },
    in_review: { color: '#2196F3', fillColor: '#2196F3' },
    resolved: { color: '#4CAF50', fillColor: '#4CAF50' },
  };

  const statusLabels = {
    pending: 'En attente',
    in_review: 'Contribué',
    resolved: 'Résolu',
  };

  const sizeText = {
    small: 'Petite',
    medium: 'Moyenne',
    large: 'Grande',
    very_large: 'Très grande',
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
          <p>Chargement de la carte...</p>
        </div>
      ) : (
        <>
          <MapContainer
            center={cameroonCenter as [number, number]}
            zoom={defaultZoom}
            style={{ height: '500px', width: '100%', borderRadius: '0.5rem' }}
            className="z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => (
              <CircleMarker
                key={report.id}
                center={[report.location.latitude!, report.location.longitude!]}
                radius={8}
                pathOptions={{
                  color: statusColors[report.status].color,
                  fillColor: statusColors[report.status].fillColor,
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <div>
                    <img 
                      src={report.image_url} 
                      alt="Décharge" 
                      className="w-full h-32 object-cover mb-2 rounded"
                    />
                    <h3 className="font-semibold">{report.location.neighborhood}</h3>
                    <p className="text-sm">{report.description.substring(0, 100)}...</p>
                    <div className="text-xs mt-2">
                      <span className="font-semibold">Taille:</span> {sizeText[report.size]}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">Statut:</span> {statusLabels[report.status]}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Légende */}
          <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-20">
            <h4 className="font-semibold text-sm mb-2">Légende</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-xs">En attente</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs">Contribué</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs">Résolu</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapComponent; 