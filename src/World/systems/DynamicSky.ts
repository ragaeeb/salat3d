import { Vector3, WebGLRenderer, Object3D } from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

export interface SkyControl {
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  exposure: number;
}

class DynamicSky {
  skyControl: SkyControl;
  sky: Sky;
  renderer: WebGLRenderer;
  sphereLight: Object3D;

  constructor(skyControl: SkyControl, sphereLight: Object3D, renderer: WebGLRenderer) {
    this.skyControl = skyControl
    this.sky = new Sky()
    this.renderer = renderer
    this.sphereLight = sphereLight
    this.sky.scale.setScalar(450000)
  }
  tick() {
    let sunPosition = new Vector3().setFromMatrixPosition(this.sphereLight.matrixWorld)
    if (sunPosition.y < 0) {
      this.sphereLight.children[1].visible = false
    } else {
      this.sphereLight.children[1].visible = true
    }
    const uniforms = this.sky.material.uniforms
    uniforms['turbidity'].value = this.skyControl.turbidity;
    uniforms['rayleigh'].value = this.skyControl.rayleigh;
    uniforms['mieCoefficient'].value = this.skyControl.mieCoefficient;
    uniforms['mieDirectionalG'].value = this.skyControl.mieDirectionalG;
    uniforms['sunPosition'].value.copy(sunPosition)
    this.renderer.toneMappingExposure = this.skyControl.exposure
    // console.log(this.sphereLight.position)
  }
}

export { DynamicSky }