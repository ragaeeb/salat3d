import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, TorusGeometry } from 'three';
import type { ReadSpec } from '../systems/BookReader';
import { GROUND_RADIUS } from './base';

type ScrollCatalog = { scrolls: { file: string; id: string; title: string }[] };

const BLOCKED = [
    { r: 14, x: 0, z: 0 },
    { r: 8, x: 0, z: 24 },
    { r: 12, x: -20, z: 8 },
];

function farEnough(x: number, z: number, placed: { x: number; z: number }[]) {
    if (Math.hypot(x, z) > GROUND_RADIUS - 8) {
        return false;
    }
    return (
        BLOCKED.every((b) => Math.hypot(x - b.x, z - b.z) > b.r) &&
        placed.every((p) => Math.hypot(x - p.x, z - p.z) > 6)
    );
}

function scatter(count: number, spots: { x: number; z: number }[] = []) {
    for (let i = 0; i < 80 && spots.length < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 16 + Math.random() * 24;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (farEnough(x, z, spots)) {
            spots.push({ x, z });
        }
    }
    return spots;
}

async function createScrolls() {
    const catalog = (await (await fetch('/scrolls/scrolls.json')).json()) as ScrollCatalog;
    const group = new Group();
    group.name = 'scrolls';
    const parchment = new MeshStandardMaterial({
        color: 0xf0d4a2,
        emissive: 0x5a3a12,
        emissiveIntensity: 0.18,
        roughness: 0.78,
    });
    const ribbon = new MeshStandardMaterial({ color: 0x7a1f24, roughness: 0.55 });
    const spots = scatter(catalog.scrolls.length, [{ x: 7, z: 18 }]);
    const meshes: Mesh[] = [];

    for (const [i, entry] of catalog.scrolls.entries()) {
        const spot = spots[i] ?? { x: 20 + i, z: -18 };
        const roll = new Mesh(new CylinderGeometry(0.08, 0.08, 0.62, 12), parchment);
        roll.position.set(spot.x, 1.34, spot.z);
        roll.rotation.set(0.15, Math.random() * Math.PI, 0.35);
        roll.castShadow = true;
        const band = new Mesh(new TorusGeometry(0.085, 0.018, 6, 12), ribbon);
        band.rotation.x = Math.PI / 2;
        roll.add(band);
        roll.userData.read = {
            file: entry.file,
            folder: 'scrolls',
            id: entry.id,
            title: entry.title,
        } satisfies ReadSpec;
        group.add(roll);
        meshes.push(roll);
    }

    return { group, meshes };
}

export { createScrolls };
