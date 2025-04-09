import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function downloadModel() {
  try {
    // Create directory if it doesn't exist
    const modelDir = path.join(__dirname, '../public/models/mobilenet');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    // Load the model
    console.log('Loading MobileNet model...');
    const model = await tf.loadGraphModel('https://tfhub.dev/google/imagenet/mobilenet_v3_small_100_224/feature_vector/5');

    // Convert to layers model
    console.log('Converting model...');
    const layersModel = await tf.models.modelFromTensorFlow(model);

    // Save the model
    console.log('Saving model...');
    await layersModel.save(`file://${modelDir}`);

    console.log('Model downloaded and saved successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

downloadModel(); 