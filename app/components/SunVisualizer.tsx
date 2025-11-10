"use client";

import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as SunCalc from "suncalc";
import { SunScene } from "./SunScene";
import {
	buildDateFromInputs,
	computeSunPosition,
	formatTime,
	generateSunPath,
	getSunEvents,
	type SunConfig,
} from "./sunMath";

const defaultLocation: SunConfig = {
	latitude: -23.029396,
	longitude: -46.974293,
	northOffset: 303,
	radius: 40,
};

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
			animationRef.current = gsap.to(target, {
				value: startFraction + 1,
				duration: 40,
				ease: "linear",
				repeat: -1,
				onUpdate: () => {
					const wrapped = ((target.value % 1) + 1) % 1;
					setTimeFraction(wrapped);
				},
			});
		},
		[animate],
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
			const fraction = minutes / (24 * 60);
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

	const minutesOfDay = Math.round(timeFraction * 24 * 60);
	const displayedHours = Math.floor(minutesOfDay / 60);
	const displayedMinutes = minutesOfDay % 60;

	return (
		<div className="page">
			<main className="layout">
				<section className="visual">
					<SunScene sunPosition={sunPosition} sunPath={sunPath} radius={radius} />
				</section>
				<section className="controls">
					<header>
						<h1>Sun Position Visualizer</h1>
						<p>
							Explore the sun&apos;s path for any location, date, and time. The 3D view is powered
							by React Three Fiber.
						</p>
					</header>
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
								max={24 * 60}
								value={minutesOfDay}
								onChange={(event) => handleTimeChange(Number(event.target.value))}
							/>
							<span className="time-readout">
								{displayedHours.toString().padStart(2, "0")}:
								{displayedMinutes.toString().padStart(2, "0")}
							</span>
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
							<dd>{(altitude * (180 / Math.PI)).toFixed(2)}°</dd>
						</div>
						<div>
							<dt>Azimuth</dt>
							<dd>{(azimuth * (180 / Math.PI)).toFixed(2)}°</dd>
						</div>
					</dl>
				</section>
			</main>
		</div>
	);
}
