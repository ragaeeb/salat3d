declare module "three/examples/jsm/utils/SkeletonUtils" {
        import type { Object3D } from "three";

        export function clone<T extends Object3D>(source: T): T;
}

declare module "three/examples/jsm/controls/OrbitControls.js" {
        export { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
}
