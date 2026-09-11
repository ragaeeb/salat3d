import { describe, expect, it } from 'bun:test';
import { Loop } from './Loop';

describe('Loop', () => {
    it('passes frame delta in seconds, not milliseconds', async () => {
        const loop = new Loop({} as any, {} as any, { render() {}, setAnimationLoop() {} } as any);
        const deltas: number[] = [];
        loop.updatables.push({ tick: (delta) => deltas.push(delta) });

        loop.tick();
        await Bun.sleep(50);
        loop.tick();

        expect(deltas[1]).toBeGreaterThan(0.03);
        expect(deltas[1]).toBeLessThan(0.2);
    });
});
