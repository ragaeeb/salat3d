import { Mesh, ShaderMaterial } from 'three';

export class Sky extends Mesh {
    isSky: boolean;
    override material: ShaderMaterial;
}
