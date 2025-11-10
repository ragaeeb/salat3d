import * as SunCalc from "suncalc";

export interface SunConfig {
	latitude: number;
	longitude: number;
	radius: number;
	northOffset: number;
}

export type Vector3Tuple = [number, number, number];

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
	const minutesPerSegment = (24 * 60) / segments;

	for (let index = 0; index <= segments; index += 1) {
		const sample = new Date(startOfDay.getTime() + minutesPerSegment * index * 60 * 1000);
		points.push(computeSunPosition(sample, config));
	}

	return points;
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
