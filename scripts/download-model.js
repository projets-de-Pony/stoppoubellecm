import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

async function downloadModel() {
  try {
    // Charger le modèle MobileNet depuis TensorFlow Hub
    const model = await tf.loadGraphModel(
      'https://tfhub.dev/google/imagenet/mobilenet_v3_small_100_224/feature_vector/5'
    );

    // Créer le dossier de destination s'il n'existe pas
    const modelDir = path.join(process.cwd(), 'public', 'models', 'mobilenet');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    // Sauvegarder le modèle
    await model.save(`file://${modelDir}`);
    console.log('Modèle téléchargé avec succès !');
  } catch (error) {
    console.error('Erreur lors du téléchargement du modèle:', error);
  }
}

downloadModel(); 