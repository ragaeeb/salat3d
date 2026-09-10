import { PCFShadowMap, ReinhardToneMapping, WebGLRenderer } from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.toneMapping = ReinhardToneMapping;

    return renderer;
}

export { createRenderer };
