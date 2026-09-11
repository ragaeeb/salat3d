import {
    CanvasTexture,
    Color,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    IcosahedronGeometry,
    InstancedMesh,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    Object3D,
    PlaneGeometry,
    RepeatWrapping,
    RingGeometry,
    SphereGeometry,
    SRGBColorSpace,
} from 'three';
import { GROUND_RADIUS } from './base';

const TREE_COUNT = 12;
const ROCK_COUNT = 18;

function hash(n: number) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

function speckledTexture(hue: number, sat: number, lite: number, specks: number) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('2d canvas unavailable');
    }
    ctx.fillStyle = `hsl(${hue} ${sat}% ${lite}%)`;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < specks; i++) {
        ctx.fillStyle = `hsl(${hue + (hash(i) - 0.5) * 16} ${sat + hash(i + 1) * 18}% ${lite + (hash(i + 2) - 0.5) * 18}%)`;
        ctx.fillRect(hash(i + 3) * 256, hash(i + 4) * 256, 1 + hash(i + 5) * 3, 1 + hash(i + 6) * 3);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
}

function createGarden() {
    const garden = new Group();
    garden.name = 'garden';
    const dummy = new Object3D();
    const leafTint = new Color();

    const pathTex = speckledTexture(34, 16, 58, 2200);
    pathTex.repeat.set(8, 3);
    const path = new Mesh(
        new RingGeometry(12.5, 18, 72),
        new MeshStandardMaterial({
            color: 0xffffff,
            envMapIntensity: 0.2,
            map: pathTex,
            metalness: 0.04,
            roughness: 0.9,
        }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 1.02;
    path.receiveShadow = true;

    const trunkMat = new MeshStandardMaterial({
        color: 0x4a311c,
        envMapIntensity: 0.15,
        metalness: 0,
        roughness: 0.96,
    });
    const leafMat = new MeshStandardMaterial({
        color: 0x3a6b2c,
        envMapIntensity: 0.18,
        metalness: 0,
        roughness: 0.82,
    });
    const trunks = new InstancedMesh(new CylinderGeometry(0.22, 0.38, 3.1, 8), trunkMat, TREE_COUNT);
    const pines = new InstancedMesh(new ConeGeometry(1.9, 4.4, 8), leafMat, TREE_COUNT);
    const crowns = new InstancedMesh(new IcosahedronGeometry(1.7, 1), leafMat, TREE_COUNT);
    trunks.castShadow = pines.castShadow = crowns.castShadow = true;
    trunks.receiveShadow = pines.receiveShadow = crowns.receiveShadow = true;

    for (let i = 0; i < TREE_COUNT; i++) {
        const angle = (i / TREE_COUNT) * Math.PI * 2 + hash(i) * 0.4;
        const radius = 32 + hash(i + 8) * (GROUND_RADIUS - 38);
        const scale = 0.85 + hash(i + 9) * 0.7;
        dummy.position.set(Math.cos(angle) * radius, 1 + 1.55 * scale, Math.sin(angle) * radius);
        dummy.rotation.set((hash(i + 10) - 0.5) * 0.08, angle, (hash(i + 11) - 0.5) * 0.08);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);

        dummy.position.y = 1 + 3.6 * scale;
        dummy.scale.set(scale, scale * 1.05, scale);
        dummy.updateMatrix();
        pines.setMatrixAt(i, dummy.matrix);
        leafTint.setHSL(0.27 + hash(i + 13) * 0.07, 0.42, 0.28 + hash(i + 14) * 0.12);
        pines.setColorAt(i, leafTint);

        dummy.position.y = 1 + 4.2 * scale;
        dummy.scale.set(scale * 1.15, scale * 0.7, scale * 1.15);
        dummy.updateMatrix();
        crowns.setMatrixAt(i, dummy.matrix);
        crowns.setColorAt(i, leafTint);
        if (i % 2 === 0) {
            dummy.scale.setScalar(0.001);
            dummy.updateMatrix();
            crowns.setMatrixAt(i, dummy.matrix);
        } else {
            dummy.scale.setScalar(0.001);
            dummy.updateMatrix();
            pines.setMatrixAt(i, dummy.matrix);
        }
    }
    if (pines.instanceColor) {
        pines.instanceColor.needsUpdate = true;
    }
    if (crowns.instanceColor) {
        crowns.instanceColor.needsUpdate = true;
    }

    const rockMat = new MeshStandardMaterial({
        color: 0x8a8376,
        envMapIntensity: 0.2,
        metalness: 0.05,
        roughness: 0.95,
    });
    const rocks = new InstancedMesh(new IcosahedronGeometry(0.7, 0), rockMat, ROCK_COUNT);
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    for (let i = 0; i < ROCK_COUNT; i++) {
        const angle = hash(i + 20) * Math.PI * 2;
        const radius = 20 + hash(i + 21) * (GROUND_RADIUS - 24);
        const scale = 0.7 + hash(i + 22) * 1.6;
        dummy.position.set(Math.cos(angle) * radius, 1 + 0.22 * scale, Math.sin(angle) * radius);
        dummy.rotation.set(hash(i + 23) * Math.PI, hash(i + 24) * Math.PI, hash(i + 25) * Math.PI);
        dummy.scale.set(scale, scale * (0.5 + hash(i + 26) * 0.45), scale * (0.65 + hash(i + 27) * 0.4));
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
    }

    const fountain = new Group();
    const stone = new MeshStandardMaterial({ color: 0xc4bbab, metalness: 0.08, roughness: 0.72 });
    const basin = new Mesh(new CylinderGeometry(2.6, 2.9, 0.65, 28), stone);
    basin.position.y = 1.32;
    const water = new Mesh(
        new CylinderGeometry(2.35, 2.35, 0.14, 28),
        new MeshPhysicalMaterial({
            color: 0x1d6f7a,
            metalness: 0.15,
            opacity: 0.8,
            roughness: 0.06,
            transparent: true,
        }),
    );
    water.position.y = 1.55;
    const spout = new Mesh(new CylinderGeometry(0.2, 0.28, 1.35, 12), stone);
    spout.position.y = 2.1;
    basin.castShadow = spout.castShadow = true;
    basin.receiveShadow = water.receiveShadow = true;
    fountain.add(basin, water, spout);
    fountain.position.set(22, 0, 16);

    garden.add(path, trunks, pines, crowns, rocks, fountain, createPicnic());
    return garden;
}

function createPicnic() {
    const picnic = new Group();
    picnic.name = 'picnic';
    picnic.position.set(8, 0, -23);
    picnic.rotation.y = 0.35;

    const gingham = document.createElement('canvas');
    gingham.width = gingham.height = 256;
    const ginghamCtx = gingham.getContext('2d');
    if (ginghamCtx) {
        ginghamCtx.fillStyle = '#9a1f24';
        ginghamCtx.fillRect(0, 0, 256, 256);
        ginghamCtx.fillStyle = '#f6e7c4';
        for (let i = 0; i < 8; i++) {
            ginghamCtx.fillRect(i * 32, 0, 14, 256);
            ginghamCtx.fillRect(0, i * 32, 256, 14);
        }
    }
    const matMap = new CanvasTexture(gingham);
    matMap.colorSpace = SRGBColorSpace;
    matMap.repeat.set(2, 2);
    matMap.wrapS = matMap.wrapT = RepeatWrapping;
    const mat = new Mesh(
        new PlaneGeometry(4.4, 3.2),
        new MeshStandardMaterial({
            color: 0xffffff,
            envMapIntensity: 0.2,
            map: matMap,
            roughness: 0.92,
            side: DoubleSide,
        }),
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.y = 1.03;
    mat.receiveShadow = true;

    const bowl = new Mesh(
        new CylinderGeometry(0.28, 0.22, 0.12, 16),
        new MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.55 }),
    );
    bowl.position.set(-0.15, 1.12, 0.1);
    bowl.castShadow = true;

    const dateMat = new MeshStandardMaterial({ color: 0x5a2a12, roughness: 0.7 });
    for (let i = 0; i < 9; i++) {
        const date = new Mesh(new SphereGeometry(0.055, 8, 6), dateMat);
        date.scale.set(1.15, 0.7, 0.85);
        date.position.set(-0.2 + (i % 3) * 0.08, 1.18 + Math.floor(i / 3) * 0.04, 0.04 + Math.floor(i / 3) * 0.07);
        picnic.add(date);
    }

    const glass = new MeshPhysicalMaterial({
        color: 0x8ec5d8,
        metalness: 0.08,
        opacity: 0.42,
        roughness: 0.06,
        transparent: true,
    });
    const capMat = new MeshStandardMaterial({ color: 0xf4f0ea, roughness: 0.4 });
    for (const [x, z] of [
        [0.85, -0.35],
        [1.05, -0.15],
        [0.7, 0.55],
    ] as const) {
        const bottle = new Mesh(new CylinderGeometry(0.07, 0.08, 0.32, 10), glass);
        bottle.position.set(x, 1.22, z);
        const neck = new Mesh(new CylinderGeometry(0.035, 0.05, 0.1, 8), glass);
        neck.position.set(x, 1.42, z);
        const cap = new Mesh(new CylinderGeometry(0.04, 0.04, 0.05, 8), capMat);
        cap.position.set(x, 1.48, z);
        bottle.castShadow = cap.castShadow = true;
        picnic.add(bottle, neck, cap);
    }

    picnic.add(mat, bowl);
    return picnic;
}

export { createGarden };
