import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klrwvvsubcxdnxwnylvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtscnd2dnN1YmN4ZG54d255bHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTE5NjgsImV4cCI6MjA1OTMyNzk2OH0.beIehkMj6BUoFN7rzgOMWDBqg9vyyBNAfQD-7dZfQ-M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReports() {
  try {
    console.log('Identifying corrupted reports...');
    const { data, error } = await supabase.from('trash_reports').select('*');
    
    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }
    
    console.log(`Found ${data?.length || 0} total reports`);
    
    if (!data || data.length === 0) {
      console.log('No reports to fix');
      return;
    }
    
    // Identifier les rapports corrompus
    const problematicReports = [];
    const goodReports = [];
    
    for (const report of data) {
      try {
        // Vérifier si le rapport a les champs essentiels
        const hasBasicFields = report && 
          typeof report === 'object' && 
          report.id && 
          report.image_url &&
          report.status &&
          report.size &&
          report.description &&
          report.created_at;
          
        // Vérifier si la localisation est correcte
        const hasValidLocation = report.location && 
          typeof report.location === 'object' &&
          report.location.neighborhood;
          
        if (hasBasicFields && hasValidLocation) {
          goodReports.push(report);
        } else {
          problematicReports.push(report);
        }
      } catch (e) {
        console.error(`Error checking report ${report?.id || 'unknown'}:`, e);
        problematicReports.push(report);
      }
    }
    
    console.log(`Found ${goodReports.length} good reports`);
    console.log(`Found ${problematicReports.length} problematic reports`);
    
    // Afficher les rapports problématiques
    if (problematicReports.length > 0) {
      for (const report of problematicReports) {
        console.log(`Problematic report ID: ${report.id || 'unknown'}`);
        console.log('Report data:', JSON.stringify(report, null, 2));
        
        // Tenter de corriger le rapport
        const fixedReport = { ...report };
        
        // Corriger la localisation si nécessaire
        if (!report.location || typeof report.location !== 'object') {
          fixedReport.location = { neighborhood: 'Localisation inconnue' };
        } else if (!report.location.neighborhood) {
          fixedReport.location = { 
            ...report.location, 
            neighborhood: 'Localisation inconnue' 
          };
        }
        
        // Corriger les autres champs manquants
        if (!report.status) fixedReport.status = 'pending';
        if (!report.size) fixedReport.size = 'medium';
        if (!report.description) fixedReport.description = 'Pas de description';
        
        console.log('Fixed report data:', JSON.stringify(fixedReport, null, 2));
        
        // Mettre à jour le rapport dans la base de données
        try {
          const { error: updateError } = await supabase
            .from('trash_reports')
            .update(fixedReport)
            .eq('id', report.id);
            
          if (updateError) {
            console.error(`Error updating report ${report.id}:`, updateError);
          } else {
            console.log(`Successfully fixed report ${report.id}`);
          }
        } catch (updateErr) {
          console.error(`Error during update of report ${report.id}:`, updateErr);
        }
      }
    }
    
    console.log('Report fixing process completed');
  } catch (err) {
    console.error('Unexpected error in fixReports:', err);
  }
}

fixReports(); 