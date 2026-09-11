import { beforeAll, describe, expect, it } from 'bun:test';
import { DirectionalLight, Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three';
import { SunPath, type SunPathParams } from './SunPath';

beforeAll(() => {
    globalThis.document = { querySelector: () => null } as any;
});

function createSunPath(overrides: Partial<SunPathParams> = {}) {
    const params: SunPathParams = {
        animateTime: false,
        baseY: 0,
        day: 21,
        fajrAngle: 18,
        hour: 12,
        ishaAngle: 18,
        latitude: -23.029396,
        longitude: -46.974293,
        minute: 0,
        month: 6,
        northOffset: 0,
        radius: 18,
        shadowBias: 0,
        showAnalemmas: false,
        showSunDayPath: false,
        showSunSurface: false,
        timeSpeed: 100,
        ...overrides,
    };
    return new SunPath(
        params,
        new Mesh(new SphereGeometry(), new MeshBasicMaterial()),
        new DirectionalLight(),
        new Object3D(),
    );
}

describe('SunPath', () => {
    it('keeps the night sky off at noon', () => {
        expect(createSunPath().nightPhase).toEqual({ comets: false, stars: false });
    });

    it('places the noon sun above the horizon toward north in the southern hemisphere', () => {
        const sunPath = createSunPath();
        const position = sunPath.getSunPosition(new Date(2024, 5, 21, 12, 0, 0));
        expect(position.y).toBeGreaterThan(0);
        expect(position.x).toBeLessThan(0);
    });

    it('applies hour, minute, day, and 1-indexed month', () => {
        const sunPath = createSunPath({ day: 10, hour: 15, minute: 30, month: 9 });
        const date = new Date(sunPath.date);
        expect(date.getHours()).toBe(15);
        expect(date.getMinutes()).toBe(30);
        expect(date.getDate()).toBe(10);
        expect(date.getMonth() + 1).toBe(9);
    });

    it('advances simulated time by delta seconds times timeSpeed', () => {
        const sunPath = createSunPath({ animateTime: true, timeSpeed: 100 });
        const before = sunPath.date;
        sunPath.tick(1);
        expect(sunPath.date - before).toBe(100_000);
    });

    it('tracks wall-clock time at 1x', () => {
        const sunPath = createSunPath({ animateTime: true, timeSpeed: 1 });
        sunPath.tick(0);
        expect(Math.abs(sunPath.date - Date.now())).toBeLessThan(50);
    });

    it('keeps month 1-indexed while animating', () => {
        const sunPath = createSunPath({ animateTime: true, day: 10, month: 9, timeSpeed: 100 });
        sunPath.tick(0.001);
        expect(sunPath.params.month).toBe(9);
    });

    it('labels a prayer time from the book id', () => {
        const sunPath = createSunPath();
        expect(sunPath.prayerTimeLabel('fajr')).toMatch(/\d{1,2}:\d{2}/);
        expect(sunPath.prayerTimeLabel('nope')).toBeUndefined();
    });
});
