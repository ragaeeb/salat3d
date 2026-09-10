import { describe, expect, it } from 'bun:test';
import { CalculationParameters, Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { nightSkyPhase } from './NightSky';

const latitude = 43.65;
const longitude = -79.38;

describe('nightSkyPhase', () => {
    const noon = new Date(2026, 8, 10, 12, 0, 0);
    const coords = new Coordinates(latitude, longitude);
    const params = new CalculationParameters('Other', 18, 18);
    const prayers = new PrayerTimes(coords, noon, params);
    const sunnah = new SunnahTimes(prayers);

    it('hides stars and comets during the day', () => {
        expect(nightSkyPhase(noon, latitude, longitude, 18, 18)).toEqual({ comets: false, stars: false });
    });

    it('shows stars from the middle of the night', () => {
        expect(nightSkyPhase(sunnah.middleOfTheNight, latitude, longitude, 18, 18)).toEqual({
            comets: false,
            stars: true,
        });
    });

    it('shows stars and comets in the last third of the night', () => {
        expect(nightSkyPhase(sunnah.lastThirdOfTheNight, latitude, longitude, 18, 18)).toEqual({
            comets: true,
            stars: true,
        });
    });

    it('hides the night sky after fajr', () => {
        expect(nightSkyPhase(new Date(2026, 8, 11, 12, 0, 0), latitude, longitude, 18, 18)).toEqual({
            comets: false,
            stars: false,
        });
    });
});
