import { Box3, type Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setupModel } from './setupModel';

function polishHouseMesh(mesh: Mesh) {
    const material = mesh.material;
    if (Array.isArray(material) || !material) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return;
    }
    const std = material as MeshStandardMaterial;
    const glass = std.name === 'esquadria.vidro';
    if ('envMapIntensity' in std) {
        std.envMapIntensity = glass ? 1.3 : 0.55;
    }
    if (glass) {
        std.metalness = 0.15;
        std.opacity = 0.4;
        std.roughness = 0.06;
        std.transparent = true;
    }
    mesh.castShadow = !glass;
    mesh.receiveShadow = true;
}

async function loadHouse() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    const houseData = await gltfLoader.loadAsync('/assets/models/House-c.glb');
    const house = setupModel(houseData);
    house.traverse((n) => {
        if ((n as Mesh).isMesh) {
            polishHouseMesh(n as Mesh);
        }
    });

    const box = new Box3().setFromObject(house);
    const center = box.getCenter(new Vector3());
    house.position.x += house.position.x - center.x;
    house.position.z += house.position.z - center.z;
    // house.position.y = 2.2

    return { house };
}

export { loadHouse };
