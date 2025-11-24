import type { Camera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createControls(camera: Camera, canvas: HTMLElement) {
    const controls = new OrbitControls(camera, canvas) as OrbitControls & { tick: (delta: number) => void };

    // damping and auto rotation require
    // the controls to be updated each frame

    // this.controls.autoRotate = true;
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    // controls.maxPolarAngle = Math.PI / 2

    controls.tick = (_delta: number) => controls.update();

    return controls;
}

export { createControls };
