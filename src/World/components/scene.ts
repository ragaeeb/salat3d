import { Color, Scene } from 'three'

function createScene(): Scene {
  const scene = new Scene()

  scene.background = new Color('skyblue')

  return scene
}

export { createScene }