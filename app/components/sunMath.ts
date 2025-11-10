import * as SunCalc from "suncalc";

export interface SunConfig {
	latitude: number;
	longitude: number;
	radius: number;
	northOffset: number;
}

export type Vector3Tuple = [number, number, number];

const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = HOURS_IN_DAY * 60;

function rotateAroundY(point: Vector3Tuple, degrees: number): Vector3Tuple {
	const angle = (degrees * Math.PI) / 180;
	const [x, y, z] = point;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	return [x * cos - z * sin, y, x * sin + z * cos];
}

export function computeSunPosition(date: Date, config: SunConfig): Vector3Tuple {
	const { latitude, longitude, radius, northOffset } = config;
	const { altitude, azimuth } = SunCalc.getPosition(date, latitude, longitude);

	const distance = radius;
	const horizontal = distance * Math.cos(altitude);
	const az = azimuth + Math.PI;
	const x = horizontal * Math.sin(az);
	const z = horizontal * Math.cos(az);
	const y = distance * Math.sin(altitude);

	return rotateAroundY([x, y, z], northOffset);
}

export function generateSunPath(date: Date, config: SunConfig, segments = 96): Vector3Tuple[] {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const points: Vector3Tuple[] = [];
	const minutesPerSegment = MINUTES_IN_DAY / segments;

	for (let index = 0; index <= segments; index += 1) {
		const sample = new Date(startOfDay.getTime() + minutesPerSegment * index * 60 * 1000);
		points.push(computeSunPosition(sample, config));
	}

	return points;
}

export function generateDayPath(date: Date, config: SunConfig, stepMinutes = 60): Vector3Tuple[] {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const positions: Vector3Tuple[] = [];

	for (let minutes = 0; minutes <= MINUTES_IN_DAY; minutes += stepMinutes) {
		const sample = new Date(startOfDay.getTime() + minutes * 60 * 1000);
		positions.push(computeSunPosition(sample, config));
	}

	return positions;
}

export interface AnalemmaPath {
	hour: number;
	points: Vector3Tuple[];
}

export function generateAnalemmaPaths(
	config: SunConfig,
	hours: number[] = Array.from({ length: 11 }, (_, index) => index + 7),
): AnalemmaPath[] {
	const base = new Date(Date.UTC(2022, 0, 1, 0, 0, 0));
	const dayCount = 365;
	return hours.map((hour) => {
		const points: Vector3Tuple[] = [];
		for (let day = 0; day < dayCount; day += 1) {
			const sample = new Date(base.getTime());
			sample.setUTCDate(sample.getUTCDate() + day);
			sample.setUTCHours(hour, 0, 0, 0);
			points.push(computeSunPosition(sample, config));
		}
		return { hour, points };
	});
}

export function generateSunSurface(config: SunConfig, monthStep = 1, hourStep = 1) {
	const vertices: Vector3Tuple[] = [];
	for (let month = 0; month < 12 - monthStep; month += monthStep) {
		for (let hour = 0; hour < HOURS_IN_DAY; hour += hourStep) {
			const date = new Date(Date.UTC(2022, month, 1, hour, 0, 0));
			const nextHour = hour + hourStep;
			const nextMonth = month + monthStep;

			if (nextHour > HOURS_IN_DAY || nextMonth > 11) {
				continue;
			}

			const basePos = computeSunPosition(date, config);
			const hourPos = computeSunPosition(
				new Date(Date.UTC(2022, month, 1, nextHour, 0, 0)),
				config,
			);
			const monthPos = computeSunPosition(
				new Date(Date.UTC(2022, nextMonth, 1, hour, 0, 0)),
				config,
			);
			const diagonalPos = computeSunPosition(
				new Date(Date.UTC(2022, nextMonth, 1, nextHour, 0, 0)),
				config,
			);

			vertices.push(basePos, hourPos, monthPos, monthPos, hourPos, diagonalPos);
		}
	}

	return vertices;
}

export interface SunEvents {
	sunrise?: Date;
	sunset?: Date;
	solarNoon?: Date;
}

export function getSunEvents(date: Date, { latitude, longitude }: SunConfig): SunEvents {
	const times = SunCalc.getTimes(date, latitude, longitude);
	return {
		sunrise: times.sunrise,
		sunset: times.sunset,
		solarNoon: times.solarNoon,
	};
}

export function formatTime(date?: Date): string {
	if (!date) {
		return "--:--";
	}

	return date
		.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		})
		.replace(/^24/, "00");
}

export function buildDateFromInputs(day: string, timeFraction: number): Date {
	const base = new Date(`${day}T00:00:00`);
	const minutes = Math.round(timeFraction * 24 * 60);
	base.setMinutes(minutes);
	return base;
}
