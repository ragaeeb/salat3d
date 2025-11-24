import { AnimationMixer, Group, type Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

async function loadBirds() {
    const gltfLoader = new GLTFLoader();
    const parrotData = await gltfLoader.loadAsync('/assets/models/Parrot.glb');
    const parrot = parrotData.scene as Group & { tick: (delta: number) => void };
    const clip = parrotData.animations[0];
    const mixer = new AnimationMixer(parrot);
    const action = mixer.clipAction(clip);
    action.play();
    parrot.tick = (delta: number) => mixer.update(delta);

    parrot.traverse((n) => {
        if ((n as Mesh).isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });
    parrot.scale.multiplyScalar(0.03);
    parrot.position.set(-10, 10, 12);
    const parrot2 = parrot.clone() as Group & { tick: (delta: number) => void };
    parrot2.scale.multiplyScalar(0.9);
    parrot2.position.set(-12, 10, 10);
    const mixer2 = new AnimationMixer(parrot2);
    const action2 = mixer2.clipAction(clip);
    action2.play();
    parrot2.tick = (delta: number) => mixer2.update(delta);

    const parrot3 = parrot.clone() as Group & { tick: (delta: number) => void };
    parrot3.scale.multiplyScalar(0.7);
    parrot3.position.set(-8, 10, 10);
    const mixer3 = new AnimationMixer(parrot3);
    const action3 = mixer3.clipAction(clip);
    action3.play();
    parrot3.tick = (delta: number) => mixer3.update(delta);

    const araras = new Group();
    araras.add(parrot, parrot2, parrot3);
    araras.position.set(-100, 3, -100);
    araras.rotation.y = Math.PI / 6;

    return araras;
}

export { loadBirds };
