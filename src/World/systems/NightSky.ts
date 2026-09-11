import { CalculationParameters, Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { getMoonPosition } from 'suncalc';
import {
    AdditiveBlending,
    BufferGeometry,
    CylinderGeometry,
    Float32BufferAttribute,
    Group,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Points,
    PointsMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import type { SunPath } from './SunPath';

export type NightSkyPhase = {
    comets: boolean;
    stars: boolean;
};

const STAR_COUNT = 1200;
const STAR_RADIUS = 26;
const MOON_RADIUS = 20;
const MOON_PRE_MAGHRIB = 0.2;

export function moonOpacityAt(
    date: Date,
    latitude: number,
    longitude: number,
    fajrAngle: number,
    ishaAngle: number,
): number {
    const coordinates = new Coordinates(latitude, longitude);
    const params = new CalculationParameters('Other', fajrAngle, ishaAngle);
    const today = new PrayerTimes(coordinates, date, params);
    const t = date.getTime();
    let asr = today.asr.getTime();
    let maghrib = today.maghrib.getTime();
    let fajrEnd = today.fajr.getTime();
    if (t < today.fajr.getTime()) {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        const yesterday = new PrayerTimes(coordinates, prev, params);
        asr = yesterday.asr.getTime();
        maghrib = yesterday.maghrib.getTime();
    } else {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        fajrEnd = new PrayerTimes(coordinates, next, params).fajr.getTime();
    }
    const orangeStart = (asr + maghrib) / 2;
    const appearStart = orangeStart + (1 - MOON_PRE_MAGHRIB) * (maghrib - orangeStart);
    if (t < appearStart || t >= fajrEnd) {
        return 0;
    }
    if (t >= maghrib) {
        return 1;
    }
    return (t - appearStart) / (maghrib - appearStart);
}

export function nightSkyPhase(
    date: Date,
    latitude: number,
    longitude: number,
    fajrAngle: number,
    ishaAngle: number,
): NightSkyPhase {
    const coordinates = new Coordinates(latitude, longitude);
    const params = new CalculationParameters('Other', fajrAngle, ishaAngle);
    const today = new PrayerTimes(coordinates, date, params);
    const t = date.getTime();
    const beforeFajr = t < today.fajr.getTime();
    const nightDate = new Date(date);
    if (beforeFajr) {
        nightDate.setDate(nightDate.getDate() - 1);
    }
    const sunnah = new SunnahTimes(beforeFajr ? new PrayerTimes(coordinates, nightDate, params) : today);
    let fajr = today.fajr.getTime();
    if (!beforeFajr) {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        fajr = new PrayerTimes(coordinates, next, params).fajr.getTime();
    }
    return {
        comets: t >= sunnah.lastThirdOfTheNight.getTime() && t < fajr,
        stars: t >= sunnah.middleOfTheNight.getTime() && t < fajr,
    };
}

function hemispherePoint(target: Vector3, radius: number) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random());
    target.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    );
}

type Streak = {
    from: Vector3;
    mesh: Mesh;
    speed: number;
    t: number;
    to: Vector3;
    wait: number;
};

class NightSky {
    group = new Group();
    private comets = new Group();
    private moon: Mesh;
    private moonGlow: Mesh;
    private scratch = new Vector3();
    private stars: Points;
    private streaks: Streak[];
    private sunPath: SunPath;

    constructor(sunPath: SunPath) {
        this.sunPath = sunPath;
        this.group.name = 'nightSky';

        const positions = new Float32Array(STAR_COUNT * 3);
        const point = new Vector3();
        for (let i = 0; i < STAR_COUNT; i++) {
            hemispherePoint(point, STAR_RADIUS);
            positions.set([point.x, point.y, point.z], i * 3);
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        this.stars = new Points(
            geometry,
            new PointsMaterial({
                blending: AdditiveBlending,
                color: 0xffffff,
                depthWrite: false,
                opacity: 1,
                size: 0.4,
                sizeAttenuation: true,
                toneMapped: false,
                transparent: true,
            }),
        );

        this.streaks = [0, 1, 2].map(() => this.makeStreak());
        this.stars.visible = false;
        this.comets.visible = false;
        this.moon = new Mesh(
            new SphereGeometry(2.2, 24, 20),
            new MeshBasicMaterial({ color: 0xf6f3e8, toneMapped: false, transparent: true }),
        );
        this.moonGlow = new Mesh(
            new SphereGeometry(3.5, 16, 16),
            new MeshBasicMaterial({
                color: 0xc5d0ee,
                depthWrite: false,
                opacity: 0,
                toneMapped: false,
                transparent: true,
            }),
        );
        this.moon.add(this.moonGlow);
        this.moon.visible = false;
        this.group.add(this.stars, this.comets, this.moon);
        sunPath.sunPathLight.add(this.group);
    }

    tick(delta: number) {
        const { comets, stars } = this.sunPath.nightPhase;
        this.stars.visible = stars;
        this.comets.visible = comets;
        this.updateMoon();
        if (!comets) {
            return;
        }
        for (const streak of this.streaks) {
            this.advance(streak, delta);
        }
    }

    private updateMoon() {
        const { fajrAngle, ishaAngle, latitude, longitude } = this.sunPath.params;
        const opacity = moonOpacityAt(new Date(this.sunPath.date), latitude, longitude, fajrAngle, ishaAngle);
        this.moon.visible = opacity > 0.02;
        (this.moon.material as MeshBasicMaterial).opacity = opacity;
        (this.moonGlow.material as MeshBasicMaterial).opacity = opacity * 0.22;
        if (!this.moon.visible) {
            return;
        }
        const { altitude, azimuth } = getMoonPosition(new Date(this.sunPath.date), latitude, longitude);
        // ponytail: visual floor — at maghrib the real moon is often below the island; use suncalc when higher.
        const alt = MathUtils.degToRad(Math.max(altitude, 32));
        const az = MathUtils.degToRad(azimuth + 180);
        this.moon.position.set(
            MOON_RADIUS * Math.cos(alt) * Math.cos(az),
            MOON_RADIUS * Math.sin(alt),
            MOON_RADIUS * Math.cos(alt) * Math.sin(az),
        );
    }

    private makeStreak(): Streak {
        const mesh = new Mesh(
            new CylinderGeometry(0.02, 0.12, 3.2, 5),
            new MeshBasicMaterial({
                blending: AdditiveBlending,
                color: 0x2eb9df,
                depthWrite: false,
                opacity: 0.95,
                toneMapped: false,
                transparent: true,
            }),
        );
        this.comets.add(mesh);
        return {
            from: new Vector3(),
            mesh,
            speed: 0.2,
            t: 1,
            to: new Vector3(),
            wait: Math.random() * 2,
        };
    }

    private advance(streak: Streak, delta: number) {
        if (streak.wait > 0) {
            streak.wait -= delta;
            streak.mesh.visible = false;
            return;
        }
        if (streak.t >= 1) {
            hemispherePoint(streak.from, STAR_RADIUS);
            hemispherePoint(streak.to, STAR_RADIUS);
            streak.speed = 0.12 + Math.random() * 0.2;
            streak.t = 0;
        }
        streak.t += delta * streak.speed;
        if (streak.t >= 1) {
            streak.wait = 1 + Math.random() * 3;
            streak.mesh.visible = false;
            return;
        }
        streak.mesh.visible = true;
        this.scratch.lerpVectors(streak.from, streak.to, streak.t).normalize().multiplyScalar(STAR_RADIUS);
        streak.mesh.position.copy(this.scratch);
        this.scratch
            .lerpVectors(streak.from, streak.to, Math.max(0, streak.t - 0.08))
            .normalize()
            .multiplyScalar(STAR_RADIUS);
        streak.mesh.lookAt(this.scratch);
        streak.mesh.rotateX(Math.PI / 2);
    }
}

export { NightSky };
