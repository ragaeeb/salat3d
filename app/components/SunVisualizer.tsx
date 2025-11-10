"use client";

import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as SunCalc from "suncalc";
import { type SceneCameraInfo, SunScene } from "./SunScene";
import {
	buildDateFromInputs,
	computeSunPosition,
	formatTime,
	generateSunPath,
	getSunEvents,
	type SunConfig,
} from "./sunMath";

type CameraMode = "orbit" | "bird" | "firstPerson";

const defaultLocation: SunConfig = {
	latitude: -23.029396,
	longitude: -46.974293,
	northOffset: 303,
	radius: 40,
};

const MINUTES_PER_DAY = 24 * 60;

function toTimeFraction(date: Date) {
	return (date.getHours() * 60 + date.getMinutes()) / (24 * 60);
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function SunVisualizer() {
	const now = useMemo(() => new Date(), []);
	const [latitude, setLatitude] = useState(defaultLocation.latitude);
	const [longitude, setLongitude] = useState(defaultLocation.longitude);
	const [northOffset, setNorthOffset] = useState(defaultLocation.northOffset);
	const [radius, setRadius] = useState(defaultLocation.radius);
	const [selectedDate, setSelectedDate] = useState(() => now.toISOString().slice(0, 10));
	const [timeFraction, setTimeFraction] = useState(() => toTimeFraction(now));
	const [animate, setAnimate] = useState(false);
	const [timeSpeed, setTimeSpeed] = useState(120);

	const [showSunSurface, setShowSunSurface] = useState(true);
	const [showAnalemmas, setShowAnalemmas] = useState(false);
	const [showSunDayPath, setShowSunDayPath] = useState(true);
	const [showSunSphere, setShowSunSphere] = useState(true);
	const [showOrientation, setShowOrientation] = useState(true);
	const [showBirds, setShowBirds] = useState(true);
	const [showSunHelper, setShowSunHelper] = useState(false);
	const [showShadowHelper, setShowShadowHelper] = useState(false);

	const [ambientIntensity, setAmbientIntensity] = useState(0.4);
	const [sunIntensity, setSunIntensity] = useState(1.2);
	const [sunCastShadow, setSunCastShadow] = useState(true);
	const [sunShadowBias, setSunShadowBias] = useState(-0.0005);

	const [skyTurbidity, setSkyTurbidity] = useState(10);
	const [skyRayleigh, setSkyRayleigh] = useState(2);
	const [skyMieCoefficient, setSkyMieCoefficient] = useState(0.01);
	const [skyMieDirectionalG, setSkyMieDirectionalG] = useState(0.9);
	const [skyExposure, setSkyExposure] = useState(0.9);

	const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
	const [autoRotate, setAutoRotate] = useState(false);
	const [cameraInfo, setCameraInfo] = useState<SceneCameraInfo | null>(null);

	const animationRef = useRef<gsap.core.Tween | null>(null);

	const config = useMemo<SunConfig>(
		() => ({ latitude, longitude, northOffset, radius }),
		[latitude, longitude, northOffset, radius],
	);

	const activeDate = useMemo(
		() => buildDateFromInputs(selectedDate, timeFraction),
		[selectedDate, timeFraction],
	);

	const sunPosition = useMemo(() => computeSunPosition(activeDate, config), [activeDate, config]);

	const sunPath = useMemo(() => generateSunPath(activeDate, config), [activeDate, config]);

	const events = useMemo(() => getSunEvents(activeDate, config), [activeDate, config]);

	const { altitude, azimuth } = useMemo(
		() => SunCalc.getPosition(activeDate, latitude, longitude),
		[activeDate, latitude, longitude],
	);

	const restartAnimation = useCallback(
		(startFraction: number) => {
			if (!animate) {
				return;
			}
			animationRef.current?.kill();
			const target = { value: startFraction };
			const clampedSpeed = Math.max(timeSpeed, 1);
			const duration = MINUTES_PER_DAY / clampedSpeed || 1;
			animationRef.current = gsap.to(target, {
				value: startFraction + 1,
				duration,
				ease: "linear",
				repeat: -1,
				onUpdate: () => {
					const wrapped = ((target.value % 1) + 1) % 1;
					setTimeFraction(wrapped);
				},
			});
		},
		[animate, timeSpeed],
	);

	useEffect(() => {
		if (!animate) {
			animationRef.current?.kill();
			animationRef.current = null;
			return () => {};
		}

		restartAnimation(timeFraction);

		return () => {
			animationRef.current?.kill();
			animationRef.current = null;
		};
	}, [animate, restartAnimation, timeFraction]);

	const handleTimeChange = useCallback(
		(minutes: number) => {
			const fraction = minutes / MINUTES_PER_DAY;
			setTimeFraction(fraction);
			restartAnimation(fraction);
		},
		[restartAnimation],
	);

	const handleNow = useCallback(() => {
		const freshNow = new Date();
		setSelectedDate(freshNow.toISOString().slice(0, 10));
		const fraction = toTimeFraction(freshNow);
		setTimeFraction(fraction);
		restartAnimation(fraction);
	}, [restartAnimation]);

	useEffect(
		() => () => {
			animationRef.current?.kill();
		},
		[],
	);

	const minutesOfDay = Math.round(timeFraction * MINUTES_PER_DAY);
	const displayedHours = Math.floor(minutesOfDay / 60);
	const displayedMinutes = minutesOfDay % 60;

	const altitudeDegrees = (altitude * (180 / Math.PI)).toFixed(2);
	const azimuthDegrees = (azimuth * (180 / Math.PI)).toFixed(2);

	return (
		<div className="page">
			<main className="layout">
				<section className="visual">
					<SunScene
						sunPosition={sunPosition}
						sunPath={sunPath}
						radius={radius}
						config={config}
						lighting={{
							ambientIntensity,
							sunIntensity,
							sunCastShadow,
							sunShadowBias,
						}}
						sky={{
							turbidity: skyTurbidity,
							rayleigh: skyRayleigh,
							mieCoefficient: skyMieCoefficient,
							mieDirectionalG: skyMieDirectionalG,
							exposure: skyExposure,
						}}
						toggles={{
							showSunSurface,
							showAnalemmas,
							showSunDayPath,
							showSunSphere,
							showOrientation,
							showBirds,
							showSunHelper,
							showShadowHelper,
						}}
						camera={{ mode: cameraMode, autoRotate }}
						onCameraUpdate={setCameraInfo}
					/>
				</section>
				<section className="controls">
					<header>
						<h1>Sun Position Visualizer</h1>
						<p>
							Explore the sun&apos;s path for any location, date, and time. The 3D view is powered
							by React Three Fiber.
						</p>
					</header>

					<section className="control-section">
						<h2>Location &amp; time</h2>
						<div className="control-grid">
							<label>
								Latitude
								<input
									type="number"
									step="0.0001"
									value={latitude}
									onChange={(event) => setLatitude(clamp(Number(event.target.value), -90, 90))}
								/>
							</label>
							<label>
								Longitude
								<input
									type="number"
									step="0.0001"
									value={longitude}
									onChange={(event) => setLongitude(clamp(Number(event.target.value), -180, 180))}
								/>
							</label>
							<label>
								North offset (°)
								<input
									type="number"
									step="1"
									value={northOffset}
									onChange={(event) => setNorthOffset(Number(event.target.value))}
								/>
							</label>
							<label>
								Orbit radius
								<input
									type="number"
									step="1"
									min={10}
									max={100}
									value={radius}
									onChange={(event) => setRadius(Number(event.target.value))}
								/>
							</label>
							<label>
								Date
								<input
									type="date"
									value={selectedDate}
									onChange={(event) => setSelectedDate(event.target.value)}
								/>
							</label>
							<label>
								Time
								<input
									type="range"
									min="0"
									max={MINUTES_PER_DAY}
									value={minutesOfDay}
									onChange={(event) => handleTimeChange(Number(event.target.value))}
								/>
								<span className="time-readout">
									{displayedHours.toString().padStart(2, "0")}:
									{displayedMinutes.toString().padStart(2, "0")}
								</span>
							</label>
						</div>
						<div className="inline-controls">
							<label className="range">
								<span>Time speed (minutes / sec)</span>
								<input
									type="range"
									min="1"
									max="720"
									value={timeSpeed}
									onChange={(event) => setTimeSpeed(Number(event.target.value))}
								/>
								<span className="value-badge">{timeSpeed}</span>
							</label>
						</div>
						<div className="actions">
							<button type="button" onClick={() => setAnimate((value) => !value)}>
								{animate ? "Pause animation" : "Play daily cycle"}
							</button>
							<button type="button" onClick={handleNow}>
								Jump to now
							</button>
						</div>
					</section>

					<section className="control-section">
						<h2>Display layers</h2>
						<div className="toggle-grid">
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showSunSphere}
									onChange={(event) => setShowSunSphere(event.target.checked)}
								/>
								<span>Sun sphere</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showSunDayPath}
									onChange={(event) => setShowSunDayPath(event.target.checked)}
								/>
								<span>Daily path</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showSunSurface}
									onChange={(event) => setShowSunSurface(event.target.checked)}
								/>
								<span>Sun surface</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showAnalemmas}
									onChange={(event) => setShowAnalemmas(event.target.checked)}
								/>
								<span>Analemmas</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showOrientation}
									onChange={(event) => setShowOrientation(event.target.checked)}
								/>
								<span>Orientation</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showBirds}
									onChange={(event) => setShowBirds(event.target.checked)}
								/>
								<span>Birds</span>
							</label>
						</div>
					</section>

					<section className="control-section">
						<h2>Lighting</h2>
						<div className="slider-grid">
							<label className="range">
								<span>Sun intensity</span>
								<input
									type="range"
									min="0"
									max="10"
									step="0.1"
									value={sunIntensity}
									onChange={(event) => setSunIntensity(Number(event.target.value))}
								/>
								<span className="value-badge">{sunIntensity.toFixed(1)}</span>
							</label>
							<label className="range">
								<span>Ambient intensity</span>
								<input
									type="range"
									min="0"
									max="5"
									step="0.1"
									value={ambientIntensity}
									onChange={(event) => setAmbientIntensity(Number(event.target.value))}
								/>
								<span className="value-badge">{ambientIntensity.toFixed(1)}</span>
							</label>
							<label className="range">
								<span>Shadow bias</span>
								<input
									type="range"
									min="-0.005"
									max="0"
									step="0.0001"
									value={sunShadowBias}
									onChange={(event) => setSunShadowBias(Number(event.target.value))}
								/>
								<span className="value-badge">{sunShadowBias.toFixed(4)}</span>
							</label>
						</div>
						<div className="toggle-grid compact">
							<label className="checkbox">
								<input
									type="checkbox"
									checked={sunCastShadow}
									onChange={(event) => setSunCastShadow(event.target.checked)}
								/>
								<span>Sun shadows</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showSunHelper}
									onChange={(event) => setShowSunHelper(event.target.checked)}
								/>
								<span>Sun helper</span>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={showShadowHelper}
									onChange={(event) => setShowShadowHelper(event.target.checked)}
								/>
								<span>Shadow frustum</span>
							</label>
						</div>
					</section>

					<section className="control-section">
						<h2>Sky model</h2>
						<div className="slider-grid">
							<label className="range">
								<span>Turbidity</span>
								<input
									type="range"
									min="0"
									max="20"
									step="0.1"
									value={skyTurbidity}
									onChange={(event) => setSkyTurbidity(Number(event.target.value))}
								/>
								<span className="value-badge">{skyTurbidity.toFixed(1)}</span>
							</label>
							<label className="range">
								<span>Rayleigh</span>
								<input
									type="range"
									min="0"
									max="4"
									step="0.01"
									value={skyRayleigh}
									onChange={(event) => setSkyRayleigh(Number(event.target.value))}
								/>
								<span className="value-badge">{skyRayleigh.toFixed(2)}</span>
							</label>
							<label className="range">
								<span>Mie coefficient</span>
								<input
									type="range"
									min="0"
									max="0.1"
									step="0.001"
									value={skyMieCoefficient}
									onChange={(event) => setSkyMieCoefficient(Number(event.target.value))}
								/>
								<span className="value-badge">{skyMieCoefficient.toFixed(3)}</span>
							</label>
							<label className="range">
								<span>Mie directional G</span>
								<input
									type="range"
									min="0"
									max="1"
									step="0.01"
									value={skyMieDirectionalG}
									onChange={(event) => setSkyMieDirectionalG(Number(event.target.value))}
								/>
								<span className="value-badge">{skyMieDirectionalG.toFixed(2)}</span>
							</label>
							<label className="range">
								<span>Exposure</span>
								<input
									type="range"
									min="0.1"
									max="3"
									step="0.1"
									value={skyExposure}
									onChange={(event) => setSkyExposure(Number(event.target.value))}
								/>
								<span className="value-badge">{skyExposure.toFixed(1)}</span>
							</label>
						</div>
					</section>

					<section className="control-section">
						<h2>Camera</h2>
						<div className="camera-controls">
							<label>
								<span>Mode</span>
								<select
									value={cameraMode}
									onChange={(event) => setCameraMode(event.target.value as CameraMode)}
								>
									<option value="orbit">Orbit</option>
									<option value="bird">Bird view</option>
									<option value="firstPerson">First person</option>
								</select>
							</label>
							<label className="checkbox">
								<input
									type="checkbox"
									checked={autoRotate}
									onChange={(event) => setAutoRotate(event.target.checked)}
								/>
								<span>Auto rotate</span>
							</label>
						</div>
						<div className="camera-readout">
							<div>
								<span className="label">Position</span>
								<span className="value">
									{cameraInfo
										? cameraInfo.position.map((value) => value.toFixed(2)).join(", ")
										: "--"}
								</span>
							</div>
							<div>
								<span className="label">Target</span>
								<span className="value">
									{cameraInfo
										? cameraInfo.target.map((value) => value.toFixed(2)).join(", ")
										: "--"}
								</span>
							</div>
						</div>
					</section>

					<section className="control-section">
						<h2>Solar events</h2>
						<dl className="info">
							<div>
								<dt>Sunrise</dt>
								<dd>{formatTime(events.sunrise)}</dd>
							</div>
							<div>
								<dt>Solar noon</dt>
								<dd>{formatTime(events.solarNoon)}</dd>
							</div>
							<div>
								<dt>Sunset</dt>
								<dd>{formatTime(events.sunset)}</dd>
							</div>
							<div>
								<dt>Altitude</dt>
								<dd>{altitudeDegrees}°</dd>
							</div>
							<div>
								<dt>Azimuth</dt>
								<dd>{azimuthDegrees}°</dd>
							</div>
						</dl>
					</section>
				</section>
			</main>
		</div>
	);
}
