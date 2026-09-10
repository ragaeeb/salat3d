import { CalculationParameters, Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import {
    AdditiveBlending,
    BufferGeometry,
    CylinderGeometry,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshBasicMaterial,
    Points,
    PointsMaterial,
    Vector3,
} from 'three';
import type { SunPath } from './SunPath';

export type NightSkyPhase = {
    comets: boolean;
    stars: boolean;
};

const STAR_COUNT = 1200;
const STAR_RADIUS = 26;

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
        this.group.add(this.stars, this.comets);
        sunPath.sunPathLight.add(this.group);
    }

    tick(delta: number) {
        const { comets, stars } = this.sunPath.nightPhase;
        this.stars.visible = stars;
        this.comets.visible = comets;
        if (!comets) {
            return;
        }
        for (const streak of this.streaks) {
            this.advance(streak, delta);
        }
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
