import { PCFSoftShadowMap, ReinhardToneMapping, WebGLRenderer } from 'three'

function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.useLegacyLights = false
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.toneMapping = ReinhardToneMapping

  return renderer
}

export { createRenderer }