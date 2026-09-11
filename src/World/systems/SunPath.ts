import { CalculationParameters, Coordinates, Prayer, PrayerTimes } from 'adhan';
import { getPosition } from 'suncalc';
import {
    BufferGeometry,
    type DirectionalLight,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    LineBasicMaterial,
    LineDashedMaterial,
    LineLoop,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    type Object3D,
} from 'three';
import { nightSkyPhase } from './NightSky';

export interface SunPathParams {
    hour: number;
    minute: number;
    day: number;
    month: number;
    latitude: number;
    longitude: number;
    radius: number;
    showAnalemmas: boolean;
    showSunSurface: boolean;
    showSunDayPath: boolean;
    northOffset: number;
    animateTime: boolean;
    timeSpeed: number;
    shadowBias: number;
    baseY: number;
    fajrAngle: number;
    ishaAngle: number;
}

class SunPath {
    params: SunPathParams;
    date: number;
    timeText: Element | null;
    prayerText: Element | null;
    sunLight: DirectionalLight;
    sunPathLight: Group;
    sphereLight: Group;
    nightPhase = { comets: false, stars: false };

    constructor(params: SunPathParams, sunSphere: Mesh, sunLight: DirectionalLight, base: Object3D) {
        this.params = params;
        const now = new Date();
        this.date = new Date(now.getFullYear(), params.month - 1, params.day, params.hour, params.minute).getTime();
        this.timeText = document.querySelector('#time-display');
        this.prayerText = document.querySelector('#prayer-display');
        this.sunLight = sunLight;
        this.sunPathLight = new Group();
        this.sphereLight = new Group();
        this.sphereLight.add(sunSphere, sunLight);
        this.sunPathLight.add(this.sphereLight, base);
        this.drawSunDayPath();
        this.drawSunSurface();
        this.drawAnalemmas();
        this.updateSunPosition();
        this.updateNorth();
        this.updatePrayerInfo();
    }

    updatePrayerInfo() {
        const date = new Date(this.date);
        this.nightPhase = nightSkyPhase(
            date,
            this.params.latitude,
            this.params.longitude,
            this.params.fajrAngle,
            this.params.ishaAngle,
        );

        if (!this.timeText || !this.prayerText) {
            return;
        }

        const coordinates = new Coordinates(this.params.latitude, this.params.longitude);
        const params = new CalculationParameters('Other', this.params.fajrAngle, this.params.ishaAngle);
        const prayerTimes = new PrayerTimes(coordinates, date, params);

        const currentPrayer = prayerTimes.currentPrayer(date);

        let prayerName = '';
        if (this.nightPhase.comets) {
            prayerName = 'last third of the night';
        } else if (this.nightPhase.stars) {
            prayerName = 'middle of the night';
        } else if (currentPrayer === Prayer.None) {
            prayerName = 'Waiting for Fajr';
        } else {
            prayerName = currentPrayer;
        }

        // Format time
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        this.timeText.textContent = `${hours}:${minutes} - ${day}/${month}`;
        this.prayerText.textContent = `Current: ${prayerName}`;
    }

    prayerTimeLabel(id: string) {
        const date = new Date(this.date);
        const coordinates = new Coordinates(this.params.latitude, this.params.longitude);
        const params = new CalculationParameters('Other', this.params.fajrAngle, this.params.ishaAngle);
        const prayerTimes = new PrayerTimes(coordinates, date, params);
        const prayer = prayerTimes[id as keyof PrayerTimes];
        if (!(prayer instanceof Date) || Number.isNaN(prayer.getTime())) {
            return undefined;
        }
        return prayer.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    getSunPosition(date: number | Date) {
        const { altitude, azimuth } = getPosition(new Date(date), this.params.latitude, this.params.longitude);
        const alt = MathUtils.degToRad(altitude);
        // suncalc v2 is north-based clockwise; existing x/z mapping is south-based.
        const az = MathUtils.degToRad(azimuth + 180);
        const x = this.params.radius * Math.cos(alt) * Math.cos(az);
        const z = this.params.radius * Math.cos(alt) * Math.sin(az);
        const y = this.params.radius * Math.sin(alt);
        return { x, y, z };
    }

    drawAnalemmas() {
        if (this.params.showAnalemmas) {
            const analemmaPath = this.sunPathLight.getObjectByName('analemmaPath');
            if (analemmaPath) {
                this.sunPathLight.remove(analemmaPath);
            }
            const analemmas = new Group();
            for (let h = 7; h < 18; h++) {
                const vertices = [];
                const from = new Date(2022, 0, 1);
                const to = new Date(2023, 0, 1);
                for (let d = from; d < to; d.setDate(d.getDate() + 1)) {
                    const date = new Date(d).setHours(h);
                    const sunPosition = this.getSunPosition(date);
                    vertices.push(sunPosition.x, sunPosition.y, sunPosition.z);
                }
                const geometry = new BufferGeometry();
                const analemmaMaterial = new LineDashedMaterial({
                    color: 'yellow',
                    dashSize: 6,
                    gapSize: 3,
                    linewidth: 1,
                    opacity: 0.7,
                    scale: 10,
                    transparent: true,
                });
                geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
                const analemma = new LineLoop(geometry, analemmaMaterial);
                analemma.computeLineDistances();
                analemmas.add(analemma);
                analemmas.name = 'analemmaPath';
            }
            this.sunPathLight.add(analemmas);
        } else {
            const analemmaPath = this.sunPathLight.getObjectByName('analemmaPath');
            if (analemmaPath) {
                this.sunPathLight.remove(analemmaPath);
            }
        }
    }

    drawSunSurface() {
        if (this.params.showSunSurface) {
            const sunSurface = this.sunPathLight.getObjectByName('sunSurface');
            if (sunSurface) {
                this.sunPathLight.remove(sunSurface);
            }
            const vertices = [];
            for (let m = 0; m < 6; m++) {
                let dateVal = new Date('2022-01-01T00:00:00').getTime();
                for (let h = 0; h < 24; h++) {
                    dateVal = new Date(dateVal).setMonth(m);
                    dateVal = new Date(dateVal).setHours(h);
                    const sunPosition = this.getSunPosition(dateVal);
                    vertices.push(sunPosition.x, sunPosition.y, sunPosition.z);
                    dateVal = new Date(dateVal).setHours(h + 1);
                    const sunPosition2 = this.getSunPosition(dateVal);
                    vertices.push(sunPosition2.x, sunPosition2.y, sunPosition2.z);
                    dateVal = new Date(dateVal).setMonth(m + 1);
                    dateVal = new Date(dateVal).setHours(h);
                    const sunPosition3 = this.getSunPosition(dateVal);
                    vertices.push(sunPosition3.x, sunPosition3.y, sunPosition3.z);
                    vertices.push(sunPosition3.x, sunPosition3.y, sunPosition3.z);
                    vertices.push(sunPosition2.x, sunPosition2.y, sunPosition2.z);
                    dateVal = new Date(dateVal).setHours(h + 1);
                    const sunPosition4 = this.getSunPosition(dateVal);
                    vertices.push(sunPosition4.x, sunPosition4.y, sunPosition4.z);
                }
            }
            const surfaceGeometry = new BufferGeometry();
            const surfaceMaterial = new MeshBasicMaterial({
                color: 'yellow',
                opacity: 0.1,
                side: DoubleSide,
                transparent: true,
            });
            surfaceGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
            const surfaceMesh = new Mesh(surfaceGeometry, surfaceMaterial);
            surfaceMesh.name = 'sunSurface';
            this.sunPathLight.add(surfaceMesh);
        } else {
            const sunSurface = this.sunPathLight.getObjectByName('sunSurface');
            if (sunSurface) {
                this.sunPathLight.remove(sunSurface);
            }
        }
    }

    updateHour() {
        this.date = new Date(this.date).setHours(this.params.hour);
        this.date = new Date(this.date).setMinutes(this.params.minute);
        this.updateSunPosition();
        this.updatePrayerInfo();
    }

    updateMonth() {
        this.date = new Date(this.date).setHours(this.params.hour);
        this.date = new Date(this.date).setDate(this.params.day);
        this.date = new Date(this.date).setMonth(this.params.month - 1);
        this.updateSunPosition();
        this.drawSunDayPath();
        this.updatePrayerInfo();
    }

    updateNorth() {
        this.sunPathLight.rotation.y = MathUtils.degToRad(this.params.northOffset);
    }

    updateLocation() {
        this.drawSunDayPath();
        this.drawSunSurface();
        this.drawAnalemmas();
        this.updateSunPosition();
        this.updatePrayerInfo();
    }

    updateSunPosition() {
        const sunPosition = this.getSunPosition(this.date);
        this.sphereLight.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
        this.sunPathLight.updateMatrixWorld(true);
        this.sunLight.target.position.set(0, 0, 0);
    }

    drawSunDayPath() {
        if (this.params.showSunDayPath) {
            const dayPath = this.sunPathLight.getObjectByName('dayPath');
            if (dayPath) {
                this.sunPathLight.remove(dayPath);
            }
            const pathMaterial = new LineBasicMaterial({
                color: 'red',
                linewidth: 5,
                opacity: 0.5,
                transparent: true,
            });
            const geometry = new BufferGeometry();
            const positions = [];
            for (let h = 0; h < 24; h++) {
                const date = new Date(this.date).setHours(h);
                const sunPosition = this.getSunPosition(date);
                positions.push(sunPosition.x, sunPosition.y, sunPosition.z);
            }
            geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
            const path = new LineLoop(geometry, pathMaterial);
            path.name = 'dayPath';
            this.sunPathLight.add(path);
        } else {
            const dayPath = this.sunPathLight.getObjectByName('dayPath');
            if (dayPath) {
                this.sunPathLight.remove(dayPath);
            }
        }
    }

    tick(delta: number) {
        if (!this.params.animateTime) {
            return;
        }
        this.date = this.params.timeSpeed === 1 ? Date.now() : this.date + delta * 1000 * this.params.timeSpeed;
        const date = new Date(this.date);
        this.params.minute = date.getMinutes();
        this.params.hour = date.getHours();
        this.params.day = date.getDate();
        this.params.month = date.getMonth() + 1;
        this.updateSunPosition();
        this.drawSunDayPath();
        this.updatePrayerInfo();
    }
}

export { SunPath };
