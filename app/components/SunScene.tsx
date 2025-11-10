"use client";

import { Line, OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Vector3Tuple } from "./sunMath";

interface SunSceneProps {
	sunPosition: Vector3Tuple;
	sunPath: Vector3Tuple[];
	radius: number;
}

function SceneContents({ sunPosition, sunPath, radius }: SunSceneProps) {
	const sunRef = useRef<THREE.Mesh>(null);
	const lightRef = useRef<THREE.DirectionalLight>(null);

	const points = useMemo(() => sunPath.map((point) => new THREE.Vector3(...point)), [sunPath]);

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

	return (
		<>
			<color attach="background" args={["#05060b"]} />
			<ambientLight intensity={0.4} />
			<directionalLight
				ref={lightRef}
				intensity={1.2}
				castShadow
				shadow-mapSize={[2048, 2048]}
				position={[50, 60, 30]}
			>
				<orthographicCamera
					attach="shadow-camera"
					args={[-radius, radius, radius, -radius, 1, radius * 6]}
				/>
			</directionalLight>
			<Sky
				distance={450000}
				sunPosition={sunPosition}
				inclination={0.5}
				azimuth={0.25}
				mieCoefficient={0.01}
				mieDirectionalG={0.9}
				turbidity={10}
			/>
			<group>
				<mesh ref={sunRef} castShadow>
					<sphereGeometry args={[radius * 0.08, 64, 64]} />
					<meshStandardMaterial emissive="#fcd34d" emissiveIntensity={2.5} color="#fff2b2" />
				</mesh>
				<Line points={points} color="#fca311" lineWidth={2} dashed dashSize={1} gapSize={1} />
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
			</group>
			<OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.95} />
		</>
	);
}

export function SunScene(props: SunSceneProps) {
	const { radius } = props;
	const cameraDistance = radius * 2.2;
	return (
		<Canvas
			shadows
			dpr={[1, 1.5]}
			camera={{ position: [cameraDistance, cameraDistance * 0.7, cameraDistance], fov: 45 }}
		>
			<SceneContents {...props} />
		</Canvas>
	);
}
