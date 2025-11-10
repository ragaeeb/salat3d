"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AnimationMixer, Group, type Mesh, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

interface BirdsProps {
	radius: number;
	visible: boolean;
}

interface FlockPreset {
	offset: Vector3;
	scale: number;
	rotation: number;
}

export function Birds({ radius, visible }: BirdsProps) {
	const gltf = useGLTF("/assets/models/Parrot.glb");
	const groupRef = useRef<Group>(null);
	const mixers = useRef<AnimationMixer[]>([]);

	const flock = useMemo(() => {
		const presets: FlockPreset[] = [
			{
				offset: new Vector3(-radius * 0.25, radius * 0.28, radius * 0.3),
				scale: 0.03,
				rotation: Math.PI / 5,
			},
			{
				offset: new Vector3(-radius * 0.28, radius * 0.3, radius * 0.24),
				scale: 0.027,
				rotation: Math.PI / 6,
			},
			{
				offset: new Vector3(-radius * 0.22, radius * 0.26, radius * 0.22),
				scale: 0.021,
				rotation: Math.PI / 4,
			},
		];

		const clip = gltf.animations[0];
		const root = new Group();
		root.position.set(-radius * 0.8, radius * 0.08, -radius * 0.8);

		const localMixers: AnimationMixer[] = [];

		presets.forEach((preset) => {
			const base = clone(gltf.scene) as Group;
			base.scale.setScalar(preset.scale);
			base.position.copy(preset.offset);
			base.rotation.y = preset.rotation;

			const mixer = new AnimationMixer(base);
			if (clip) {
				const action = mixer.clipAction(clip);
				action.play();
			}

			base.traverse((child) => {
				const mesh = child as Mesh;
				if ("isMesh" in mesh) {
					mesh.castShadow = true;
					mesh.receiveShadow = true;
				}
			});

			localMixers.push(mixer);
			root.add(base);
		});

		mixers.current = localMixers;
		root.name = "bird-flock";

		return root;
	}, [gltf.animations, gltf.scene, radius]);

	useFrame((_, delta) => {
		mixers.current.forEach((mixer) => {
			mixer.update(delta);
		});
	});

	return <primitive object={flock} visible={visible} ref={groupRef} />;
}

useGLTF.preload("/assets/models/Parrot.glb");
