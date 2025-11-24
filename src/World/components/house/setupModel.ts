import { Group } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

function setupModel(data: GLTF): Group {
    const model = data.scene;
    return model;
}

export { setupModel };
