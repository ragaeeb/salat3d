import { AmbientLight, DirectionalLight, HemisphereLight } from 'three';

function createLights() {
    const ambientLight = new AmbientLight(0xfff1e0, 0.35);
    const hemisphereLight = new HemisphereLight(0x9ec8ff, 0x3d4a2c, 0.7);
    const sunLight = new DirectionalLight(0xfff3d6, 8);
    sunLight.castShadow = true;
    sunLight.shadow.bias = -0.005;
    sunLight.shadow.mapSize.set(2048, 2048);

    return { ambientLight, hemisphereLight, sunLight };
}

export { createLights };
