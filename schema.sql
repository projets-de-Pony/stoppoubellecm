 -- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour les signalements de décharges
CREATE TABLE trash_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  location JSONB NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'very_large')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches
CREATE INDEX idx_trash_reports_status ON trash_reports(status);
CREATE INDEX idx_trash_reports_size ON trash_reports(size);
CREATE INDEX idx_trash_reports_created_at ON trash_reports(created_at);
CREATE INDEX idx_trash_reports_user_id ON trash_reports(user_id);

-- Politiques de sécurité pour les signalements
ALTER TABLE trash_reports ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les signalements
CREATE POLICY "Anyone can read trash reports" 
  ON trash_reports FOR SELECT USING (true);

-- Les utilisateurs authentifiés peuvent créer des signalements
CREATE POLICY "Authenticated users can create trash reports" 
  ON trash_reports FOR INSERT TO authenticated WITH CHECK (true);

-- Les utilisateurs non authentifiés peuvent également créer des signalements (pour les contributions anonymes)
CREATE POLICY "Anonymous users can create trash reports" 
  ON trash_reports FOR INSERT TO anon WITH CHECK (true);

-- Les utilisateurs peuvent mettre à jour leurs propres signalements
CREATE POLICY "Users can update their own trash reports" 
  ON trash_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seuls les admins peuvent supprimer les signalements (à configurer via un rôle personnalisé)
CREATE POLICY "Only admins can delete trash reports" 
  ON trash_reports FOR DELETE USING (false);

-- Fonction pour rechercher des signalements par quartier ou description
CREATE OR REPLACE FUNCTION search_trash_reports(search_term TEXT) 
RETURNS SETOF trash_reports AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM trash_reports
  WHERE 
    (location->'neighborhood')::TEXT ILIKE '%' || search_term || '%'
    OR description ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Configuration du stockage
-- Note: Cette partie doit être configurée manuellement dans l'interface Supabase
/*
1. Créer un bucket 'trash-reports'
2. Définir les politiques de sécurité suivantes:
   - Permettre aux utilisateurs authentifiés de télécharger des fichiers
   - Permettre aux utilisateurs anonymes de télécharger des fichiers (pour les contributions anonymes)
   - Permettre à tous les utilisateurs de lire les fichiers
*/ 