import {
    BufferGeometry,
    CanvasTexture,
    CylinderGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshStandardMaterial,
    RepeatWrapping,
    SRGBColorSpace,
} from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import type { SunPathParams } from '../systems/SunPath';

export const GROUND_RADIUS = 60;

function grassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('2d canvas unavailable');
    }
    ctx.fillStyle = '#3f6b2c';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) {
        const hue = 88 + ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 28;
        const lite = 22 + ((Math.sin(i * 78.233) * 43758.5453) % 1) * 26;
        ctx.fillStyle = `hsl(${hue} 42% ${lite}%)`;
        ctx.fillRect(((Math.sin(i * 4.1) * 43758) % 1) * 256, ((Math.sin(i * 9.2) * 43758) % 1) * 256, 2, 3);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.repeat.set(14, 14);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
}

function createBase(params: SunPathParams) {
    const grass = new MeshStandardMaterial({
        color: 0xffffff,
        envMapIntensity: 0.2,
        map: grassTexture(),
        metalness: 0,
        roughness: 0.94,
    });
    const earth = new MeshStandardMaterial({ color: 0x6b4f38, metalness: 0, roughness: 0.96 });
    const geometry = new CylinderGeometry(GROUND_RADIUS, GROUND_RADIUS, 2, 180);
    const base = new Mesh(geometry, [earth, grass, earth]) as unknown as Mesh & { tick: (delta: number) => void };
    base.position.y = params.baseY;
    base.receiveShadow = true;

    const fontLoader = new FontLoader();
    const fontMaterial = new MeshStandardMaterial({ color: 0xf3ead6, metalness: 0.05, roughness: 0.55 });

    fontLoader.load('fonts/droid_sans_bold.typeface.json', (font) => {
        const place = (letter: string, x: number, z: number, extraZ = 0) => {
            const textGeometry = new TextGeometry(letter, { depth: 0.3, font, size: 3 });
            const text = new Mesh(textGeometry, fontMaterial);
            text.rotation.x = -Math.PI / 2;
            if (extraZ) {
                text.rotation.z = extraZ;
            }
            text.position.set(x, 1.02, z);
            textGeometry.computeBoundingBox();
            if (textGeometry.boundingBox && extraZ) {
                text.position.z = -(textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y) / 2;
            } else if (textGeometry.boundingBox && letter === 'L') {
                text.position.x = -(textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y) / 2;
            }
            text.castShadow = true;
            base.add(text);
        };
        place('N', -GROUND_RADIUS - 8, 0, -Math.PI / 2);
        place('S', GROUND_RADIUS + 4, 0, -Math.PI / 2);
        place('L', 0, -GROUND_RADIUS - 6);
        place('O', 0, GROUND_RADIUS + 8);
    });

    const arrowVertices = [-5, 0, 0, 0, 0, 10, 0, 0, -10];
    const arrowGeometry = new BufferGeometry();
    arrowGeometry.setAttribute('position', new Float32BufferAttribute(arrowVertices, 3));
    const arrowMat = new MeshStandardMaterial({ color: 0x2c2418, roughness: 0.85 });
    const arrowN = new Mesh(arrowGeometry, arrowMat);
    arrowN.position.set(-GROUND_RADIUS + 2, 1.02, 0);
    const arrowS = arrowN.clone();
    arrowS.rotation.y = Math.PI;
    arrowS.position.x = GROUND_RADIUS - 2;
    const arrowL = arrowN.clone();
    arrowL.rotation.y = -Math.PI / 2;
    arrowL.position.set(0, 1.02, -GROUND_RADIUS + 2);
    const arrowO = arrowL.clone();
    arrowO.rotation.y = Math.PI / 2;
    arrowO.position.set(0, 1.02, GROUND_RADIUS - 2);
    base.add(arrowN, arrowS, arrowL, arrowO);

    base.tick = (_delta: number) => {};

    return base;
}

export { createBase };
