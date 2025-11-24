import { AxesHelper, CameraHelper, type DirectionalLight, DirectionalLightHelper } from 'three';

function createDirectionalLightHelper(light: DirectionalLight): DirectionalLightHelper {
    const directionalLightHelper = new DirectionalLightHelper(light);
    return directionalLightHelper;
}

function createShadowCameraHelper(light: DirectionalLight): CameraHelper {
    const shadowCameraHelper = new CameraHelper(light.shadow.camera);
    return shadowCameraHelper;
}

function createAxesHelper(size: number): AxesHelper {
    const axesHelper = new AxesHelper(size);
    return axesHelper;
}

export { createDirectionalLightHelper, createShadowCameraHelper, createAxesHelper };
