import type { PerspectiveCamera, WebGLRenderer } from 'three';

const setSize = (container: Element, camera: PerspectiveCamera, renderer: WebGLRenderer) => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
};

class Resizer {
    container: Element;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    constructor(container: Element, camera: PerspectiveCamera, renderer: WebGLRenderer) {
        this.container = container;
        this.camera = camera;
        this.renderer = renderer;
        // set initial size on load
        setSize(container, camera, renderer);

        window.addEventListener('resize', () => {
            // set the size again if a resize occurs
            // setSize(container, this.camera, renderer);
            // perform any custom actions
            this.onResize();
        });
    }

    onResize() {
        setSize(this.container, this.camera, this.renderer);
    }
}

export { Resizer };
