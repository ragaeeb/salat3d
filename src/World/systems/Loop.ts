import { type Camera, type Scene, Timer, type WebGLRenderer } from 'three';

interface Updatable {
    tick(delta: number): void;
}

class Loop {
    camera: Camera;
    scene: Scene;
    renderer: WebGLRenderer;
    updatables: Updatable[];
    private timer = new Timer();

    constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
    }

    start() {
        this.timer.reset();
        this.renderer.setAnimationLoop((time) => {
            this.tick(time);
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    tick(timestamp?: number) {
        this.timer.update(timestamp);
        const delta = this.timer.getDelta();

        for (const object of this.updatables) {
            object.tick(delta);
        }
    }
}

export { Loop };
