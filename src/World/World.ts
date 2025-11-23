import { loadHouse } from './components/house/house'
import { loadBirds } from './components/birds/birds'
import { createBirdCamera } from './components/birdCamera'
import { createFirstPersonCamera } from './components/firstPersonCamera'
import { createBase } from './components/base'
import { createLights } from './components/lights'
import { createScene } from './components/scene'
import { createDirectionalLightHelper, createShadowCameraHelper } from './components/helpers'
import { createSunSphere } from './components/sunSphere'

import { createGUI } from './systems/gui'
import { createControls } from './systems/controls'
import { createRenderer } from './systems/renderer'
import { Resizer } from './systems/Resizer'
import { Loop } from './systems/Loop'
import { SunPath, SunPathParams } from './systems/SunPath'
import { DynamicSky, SkyControl } from './systems/DynamicSky'
import { createPlayer } from './systems/player'

import gsap from 'gsap'
import { PerspectiveCamera, Scene, WebGLRenderer, Mesh, BufferGeometry, Float32BufferAttribute, CylinderGeometry, MeshStandardMaterial, MeshBasicMaterial } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import GUI from 'lil-gui'

class World {
  private birdCamera: PerspectiveCamera;
  private firstPersonCamera: PerspectiveCamera;
  private activeCamera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private loop: Loop;
  private controls: OrbitControls & { tick: (delta: number) => void };
  private resizer: Resizer;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private gui: GUI;
  private tl: gsap.core.Timeline;

  constructor(container: Element) {
    this.birdCamera = createBirdCamera()
    this.firstPersonCamera = createFirstPersonCamera()
    this.activeCamera = this.birdCamera

    this.scene = createScene()
    this.renderer = createRenderer()
    this.loop = new Loop(this.activeCamera, this.scene, this.renderer)
    container.append(this.renderer.domElement)
    this.controls = createControls(this.activeCamera, this.renderer.domElement)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.controls.tick = (delta: number) => this.controls.update();

    const params: SunPathParams = {
      animateTime: true,
      showSunSurface: true,
      showAnalemmas: true,
      showSunDayPath: true,
      minute: new Date().getMinutes(),
      day: new Date().getDate(),
      // removed unused variable(),
      // removed unused variable(),
      hour: new Date().getHours(),
      // removed unused variable(),
      month: new Date().getMonth() + 1,
      latitude: -23.029396,
      longitude: -46.974293,
      northOffset: 303,
      radius: 18,
      baseY: 0,
      timeSpeed: 100,
      shadowBias: -0.00086
    }

    const skyControl: SkyControl = {
      turbidity: 10,
      rayleigh: 0.425,
      mieCoefficient: 0.012,
      mieDirectionalG: 1,
      exposure: 6.99
    }

    const { ambientLight, sunLight } = createLights()
    sunLight.shadow.camera.top = params.radius
    sunLight.shadow.camera.bottom = - params.radius
    sunLight.shadow.camera.left = - params.radius
    sunLight.shadow.camera.right = params.radius
    sunLight.shadow.bias = params.shadowBias

    const sunSphere = createSunSphere()

    const base = createBase(params)
    const sunPath = new SunPath(params, sunSphere, sunLight, base)

    const sky = new DynamicSky(skyControl, sunPath.sphereLight, this.renderer)

    const sunHelper = createDirectionalLightHelper(sunLight)
    const sunShadowHelper = createShadowCameraHelper(sunLight)
    // const axesHelper = createAxesHelper(30)
    sunShadowHelper.visible = false

    this.loop.updatables.push(base, this.controls, sunPath, sky)

    this.scene.add(sky.sky, ambientLight, sunHelper, sunShadowHelper, sunPath.sunPathLight)

    const cameraControl = {
      firstPerson: () => {
        this.activeCamera = this.firstPersonCamera
        this.loop.camera = this.firstPersonCamera
        this.resizer.camera = this.firstPersonCamera
        this.resizer.onResize()
      },
      birdView: () => {
        this.activeCamera = this.birdCamera
        this.loop.camera = this.birdCamera
        this.resizer.camera = this.birdCamera
        this.resizer.onResize()
      }
    }

    this.gui = createGUI(params, ambientLight, sunLight, sunHelper, sunShadowHelper, sunPath, this.controls, skyControl, cameraControl)
    this.resizer = new Resizer(container, this.activeCamera, this.renderer)

    this.tl = gsap.timeline({ repeat: -1 })
  }

  async init() {
    const { house } = await loadHouse()
    const birds = await loadBirds()
    for (var b = 0; b < birds.children.length; b++) {
      // Cast to any because birds children might not implement Updatable interface strictly in Three types, but we added tick
      this.loop.updatables.push(birds.children[b] as any)
    }
    this.scene.add(house, birds)
    this.tl.to(birds.position, { duration: 60, delay: 1, x: 100, z: 120 })
    const player = createPlayer(this.firstPersonCamera, house)
    this.loop.updatables.push(player)
    house.traverse(n => {
      if ((n as Mesh).isMesh) {
        const material = (n as Mesh).material;
        const matName = Array.isArray(material) ? '' : (material as any).name;
        if (matName === 'esquadria.vidro') {
          n.castShadow = false;
        } else {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      }
    });
  }

  start() {
    this.loop.start()
  }

  stop() {
    this.loop.stop()
  }
}

export { World }
