import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three';

function createSunSphere(): Mesh {
    return new Mesh(new SphereGeometry(1.35, 24, 20), new MeshBasicMaterial({ color: 0xffe566, toneMapped: false }));
}

export { createSunSphere };
