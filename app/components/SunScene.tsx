"use client";

import { Line, OrbitControls, Sky, Text, useHelper } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
	forwardRef,
	type MutableRefObject,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";
import * as THREE from "three";
import { CameraHelper, DirectionalLightHelper } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { Birds } from "./Birds";
import {
	generateAnalemmaPaths,
	generateSunSurface,
	type SunConfig,
	type Vector3Tuple,
} from "./sunMath";

interface LightingOptions {
	ambientIntensity: number;
	sunIntensity: number;
	sunCastShadow: boolean;
	sunShadowBias: number;
}

interface SkyOptions {
	turbidity: number;
	rayleigh: number;
	mieCoefficient: number;
	mieDirectionalG: number;
	exposure: number;
}

interface VisualToggles {
	showSunSurface: boolean;
	showAnalemmas: boolean;
	showSunDayPath: boolean;
	showSunSphere: boolean;
	showOrientation: boolean;
	showBirds: boolean;
	showSunHelper: boolean;
	showShadowHelper: boolean;
}

interface CameraInfo {
	position: Vector3Tuple;
	target: Vector3Tuple;
}

export type SceneCameraInfo = CameraInfo;

interface CameraOptions {
	mode: "orbit" | "bird" | "firstPerson";
	autoRotate: boolean;
}

interface SunSceneProps {
	sunPosition: Vector3Tuple;
	sunPath: Vector3Tuple[];
	radius: number;
	config: SunConfig;
	lighting: LightingOptions;
	sky: SkyOptions;
	toggles: VisualToggles;
	camera: CameraOptions;
	onCameraUpdate?: (info: CameraInfo) => void;
}

type SceneContentsProps = Pick<
	SunSceneProps,
	"sunPosition" | "sunPath" | "radius" | "config" | "lighting" | "sky" | "toggles"
>;

function OrientationMarkers({
	radius,
	northOffset,
	visible,
}: {
	radius: number;
	northOffset: number;
	visible: boolean;
}) {
	const groupRef = useRef<THREE.Group>(null);

	useEffect(() => {
		if (groupRef.current) {
			groupRef.current.rotation.y = THREE.MathUtils.degToRad(northOffset);
		}
	}, [northOffset]);

	return (
		<group ref={groupRef} visible={visible} rotation={[-Math.PI / 2, 0, 0]}>
			<Text position={[0, 0, radius + 2]} fontSize={radius * 0.1} color="#f8f9ff">
				N
			</Text>
			<Text position={[0, 0, -radius - 2]} fontSize={radius * 0.1} color="#f8f9ff">
				S
			</Text>
			<Text position={[radius + 2, 0, 0]} fontSize={radius * 0.1} color="#f8f9ff">
				E
			</Text>
			<Text position={[-radius - 2, 0, 0]} fontSize={radius * 0.1} color="#f8f9ff">
				W
			</Text>
		</group>
	);
}

function SceneContents({
	sunPosition,
	sunPath,
	radius,
	config,
	lighting,
	sky,
	toggles,
}: SceneContentsProps) {
	const sunRef = useRef<THREE.Mesh>(null);
	const lightRef = useRef<THREE.DirectionalLight>(null);
	const shadowCameraRef = useRef<THREE.OrthographicCamera>(null);
	const { gl } = useThree();

	const pathPoints = useMemo(() => sunPath.map((point) => new THREE.Vector3(...point)), [sunPath]);

	const analemmaGroups = useMemo(() => {
		if (!toggles.showAnalemmas) {
			return [] as { hour: number; points: THREE.Vector3[] }[];
		}
		return generateAnalemmaPaths(config).map(({ hour, points }) => ({
			hour,
			points: points.map((point) => new THREE.Vector3(...point)),
		}));
	}, [config, toggles.showAnalemmas]);

	const sunSurfaceGeometry = useMemo(() => {
		if (!toggles.showSunSurface) {
			return null;
		}
		const surfaceVertices = generateSunSurface(config, 1, 1).flat();
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(surfaceVertices, 3));
		geometry.computeVertexNormals();
		return geometry;
	}, [config, toggles.showSunSurface]);

	useEffect(
		() => () => {
			sunSurfaceGeometry?.dispose();
		},
		[sunSurfaceGeometry],
	);

	useEffect(() => {
		gl.toneMappingExposure = sky.exposure;
	}, [gl, sky.exposure]);

	useEffect(() => {
		if (sunRef.current) {
			sunRef.current.position.set(...sunPosition);
		}
		if (lightRef.current) {
			lightRef.current.position.set(...sunPosition);
			lightRef.current.target.position.set(0, 0, 0);
			lightRef.current.target.updateMatrixWorld();
		}
	}, [sunPosition]);

	useEffect(() => {
		if (lightRef.current) {
			lightRef.current.castShadow = lighting.sunCastShadow;
			lightRef.current.intensity = lighting.sunIntensity;
			lightRef.current.shadow.bias = lighting.sunShadowBias;
		}
	}, [lighting.sunCastShadow, lighting.sunIntensity, lighting.sunShadowBias]);

	const lightHelper = useHelper(
		lightRef as MutableRefObject<THREE.DirectionalLight>,
		DirectionalLightHelper,
		radius * 0.25,
		"#ffe066",
	);

	const shadowHelper = useHelper(shadowCameraRef as MutableRefObject<THREE.Camera>, CameraHelper);

	useEffect(() => {
		if (lightHelper?.current) {
			lightHelper.current.visible = toggles.showSunHelper;
		}
	}, [lightHelper, toggles.showSunHelper]);

	useEffect(() => {
		if (shadowHelper?.current) {
			shadowHelper.current.visible = toggles.showShadowHelper;
		}
	}, [shadowHelper, toggles.showShadowHelper]);

	return (
		<>
			<color attach="background" args={["#05060b"]} />
			<ambientLight intensity={lighting.ambientIntensity} />
			<directionalLight
				ref={lightRef}
				castShadow={lighting.sunCastShadow}
				shadow-mapSize={[2048, 2048]}
			>
				<orthographicCamera
					ref={shadowCameraRef}
					attach="shadow-camera"
					args={[-radius, radius, radius, -radius, 1, radius * 6]}
				/>
			</directionalLight>
			<Sky
				distance={450000}
				sunPosition={sunPosition}
				inclination={0.5}
				azimuth={0.25}
				rayleigh={sky.rayleigh}
				mieCoefficient={sky.mieCoefficient}
				mieDirectionalG={sky.mieDirectionalG}
				turbidity={sky.turbidity}
			/>
			<group>
				{toggles.showSunSphere ? (
					<mesh ref={sunRef} castShadow>
						<sphereGeometry args={[radius * 0.08, 64, 64]} />
						<meshStandardMaterial emissive="#fcd34d" emissiveIntensity={2.5} color="#fff2b2" />
					</mesh>
				) : null}
				{toggles.showSunDayPath ? (
					<Line points={pathPoints} color="#fca311" lineWidth={2} dashed dashSize={1} gapSize={1} />
				) : null}
				{toggles.showAnalemmas
					? analemmaGroups.map(({ hour, points }) => (
							<Line
								key={`analemma-${hour}`}
								points={points}
								color="#ffd369"
								dashed
								dashSize={0.6}
								gapSize={0.4}
								lineWidth={1}
								transparent
								opacity={0.6}
							/>
						))
					: null}
				{toggles.showSunSurface && sunSurfaceGeometry ? (
					<mesh geometry={sunSurfaceGeometry}>
						<meshBasicMaterial color="#ffe28a" side={THREE.DoubleSide} transparent opacity={0.25} />
					</mesh>
				) : null}
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<circleGeometry args={[radius * 1.1, 128]} />
					<meshStandardMaterial
						color="#0b142f"
						metalness={0.1}
						roughness={0.9}
						transparent
						opacity={0.95}
					/>
				</mesh>
				<gridHelper args={[radius * 2, 40, "#1f3c73", "#0b142f"]} />
				<axesHelper args={[radius * 0.6]} />
				<OrientationMarkers
					radius={radius * 0.9}
					northOffset={config.northOffset}
					visible={toggles.showOrientation}
				/>
				<Birds radius={radius} visible={toggles.showBirds} />
			</group>
		</>
	);
}

export function SunScene({
	sunPosition,
	sunPath,
	radius,
	config,
	lighting,
	sky,
	toggles,
	camera,
	onCameraUpdate,
}: SunSceneProps) {
	const cameraDistance = radius * 2.2;
	const controlsRef = useRef<THREE.EventDispatcher>(null);

	const handleCreated = ({ camera: sceneCamera }: { camera: THREE.PerspectiveCamera }) => {
		if (camera.mode === "bird") {
			sceneCamera.position.set(0, radius * 3.2, radius * 2.4);
		} else if (camera.mode === "firstPerson") {
			sceneCamera.position.set(radius * 0.6, radius * 0.25, radius * 0.05);
		}
	};

	return (
		<Canvas
			shadows
			dpr={[1, 1.5]}
			camera={{ position: [cameraDistance, cameraDistance * 0.7, cameraDistance], fov: 45 }}
			onCreated={({ camera: createdCamera, gl }) => {
				gl.setClearColor("#05060b");
				handleCreated({ camera: createdCamera as THREE.PerspectiveCamera });
			}}
		>
			<SceneContents
				sunPosition={sunPosition}
				sunPath={sunPath}
				radius={radius}
				config={config}
				lighting={lighting}
				sky={sky}
				toggles={toggles}
			/>
			<ControlledOrbit
				ref={controlsRef as MutableRefObject<THREE.EventDispatcher>}
				radius={radius}
				cameraOptions={camera}
				onCameraUpdate={onCameraUpdate}
			/>
		</Canvas>
	);
}

type OrbitControlsRef = OrbitControlsImpl;

interface ControlledOrbitProps {
	radius: number;
	cameraOptions: CameraOptions;
	onCameraUpdate?: (info: CameraInfo) => void;
}

const ControlledOrbit = forwardRef<OrbitControlsRef, ControlledOrbitProps>(
	({ radius, cameraOptions, onCameraUpdate }, ref) => {
		const controlsRef = useRef<OrbitControlsRef | null>(null);
		const { camera } = useThree();
		const previous = useRef<CameraInfo | null>(null);

		useImperativeHandle(ref, () => controlsRef.current as OrbitControlsRef);

		useEffect(() => {
			if (!controlsRef.current) {
				return;
			}

			controlsRef.current.autoRotate = cameraOptions.autoRotate;
		}, [cameraOptions.autoRotate]);

		useEffect(() => {
			const orbit = controlsRef.current;
			if (!orbit) {
				return;
			}

			const defaultTarget = new THREE.Vector3(0, 0, 0);
			if (cameraOptions.mode === "bird") {
				camera.position.set(0, radius * 3.2, radius * 2.4);
				orbit.target.copy(defaultTarget);
			} else if (cameraOptions.mode === "firstPerson") {
				camera.position.set(radius * 0.4, radius * 0.35, radius * 0.4);
				orbit.target.set(0, radius * 0.1, 0);
			} else {
				camera.position.set(radius * 2.2, radius * 1.54, radius * 2.2);
				orbit.target.copy(defaultTarget);
			}
			orbit.update();
		}, [cameraOptions.mode, camera, radius]);

		useFrame(() => {
			if (!controlsRef.current || !onCameraUpdate) {
				return;
			}
			const { position } = camera;
			const target = controlsRef.current.target;
			const snapshot: CameraInfo = {
				position: [position.x, position.y, position.z],
				target: [target.x, target.y, target.z],
			};
			if (
				!previous.current ||
				previous.current.position.some(
					(value, index) => Math.abs(value - snapshot.position[index]) > 1e-3,
				) ||
				previous.current.target.some(
					(value, index) => Math.abs(value - snapshot.target[index]) > 1e-3,
				)
			) {
				previous.current = snapshot;
				onCameraUpdate(snapshot);
			}
		});

		return (
			<OrbitControls
				ref={controlsRef}
				enableDamping
				dampingFactor={0.08}
				maxPolarAngle={Math.PI * 0.95}
				minDistance={radius * 0.2}
				maxDistance={radius * 6}
			/>
		);
	},
);

ControlledOrbit.displayName = "ControlledOrbit";
