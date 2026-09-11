import { type Camera, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { applyTokens, markdownToHtml } from './markdown';
import type { SunPath } from './SunPath';

export type ReadSpec = {
    file: string;
    folder: string;
    id?: string;
    title: string;
};

let bookOpen = false;

export function isBookOpen() {
    return bookOpen;
}

type BookReaderOptions = {
    camera: Camera;
    isActive: () => boolean;
    items: Mesh[];
    sunPath: SunPath;
};

function tokens(sunPath: SunPath, bookId: string): Record<string, string> {
    const date = new Date(sunPath.date);
    return {
        date: date.toLocaleDateString(),
        fajrAngle: String(sunPath.params.fajrAngle),
        ishaAngle: String(sunPath.params.ishaAngle),
        latitude: sunPath.params.latitude.toFixed(4),
        longitude: sunPath.params.longitude.toFixed(4),
        time: sunPath.prayerTimeLabel(bookId) ?? '—',
    };
}

function specOf(mesh: Mesh) {
    return mesh.userData.read as ReadSpec | undefined;
}

async function loadMarkdown(key: string, cache: Map<string, string>) {
    const cached = cache.get(key);
    if (cached) {
        return cached;
    }
    const response = await fetch(`/${key}`);
    if (!response.ok) {
        throw new Error(String(response.status));
    }
    const markdown = await response.text();
    cache.set(key, markdown);
    return markdown;
}

function createBookReader({ camera, isActive, items, sunPath }: BookReaderOptions) {
    const prompt = document.querySelector('#interact-prompt');
    const overlay = document.querySelector('#book-reader');
    const body = document.querySelector('#book-reader-body');
    const close = document.querySelector('#book-reader-close');
    const raycaster = new Raycaster();
    const center = new Vector2(0, 0);
    const world = new Vector3();
    const cache = new Map<string, string>();
    const failed = new Set<string>();
    let focused: Mesh | null = null;
    let opening = false;

    const visibleItems = () => items.filter((mesh) => mesh.visible);

    const nearest = () => {
        let closest: Mesh | undefined;
        let closestDistance = 5;
        for (const mesh of visibleItems()) {
            if (!specOf(mesh)) {
                continue;
            }
            const distance = mesh.getWorldPosition(world).distanceTo(camera.position);
            if (distance < closestDistance) {
                closest = mesh;
                closestDistance = distance;
            }
        }
        return closest;
    };

    const hidePrompt = () => {
        if (prompt instanceof HTMLElement) {
            prompt.hidden = true;
        }
    };

    const closeBook = () => {
        bookOpen = false;
        if (overlay instanceof HTMLElement) {
            overlay.hidden = true;
        }
    };

    const open = async (mesh: Mesh) => {
        const spec = specOf(mesh);
        if (!spec || !(body instanceof HTMLElement) || !(overlay instanceof HTMLElement)) {
            return;
        }
        const key = `${spec.folder}/${spec.file}`;
        if (failed.has(key) || opening) {
            return;
        }
        opening = true;
        try {
            const markdown = await loadMarkdown(key, cache);
            const filled =
                spec.folder === 'books' && spec.id ? applyTokens(markdown, tokens(sunPath, spec.id)) : markdown;
            body.innerHTML = markdownToHtml(filled);
            if (spec.folder === 'scrolls') {
                mesh.visible = false;
            }
            overlay.hidden = false;
            bookOpen = true;
            document.exitPointerLock();
            hidePrompt();
        } catch {
            failed.add(key);
        } finally {
            opening = false;
        }
    };

    close?.addEventListener('click', closeBook);
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Escape') {
            closeBook();
            return;
        }
        if (event.code !== 'KeyE' || !focused || bookOpen || !isActive()) {
            return;
        }
        void open(focused);
    });

    const focusFromView = () => {
        raycaster.setFromCamera(center, camera);
        const hit = raycaster.intersectObjects(visibleItems(), false)[0];
        const aimed = hit && hit.distance < 5 && hit.object instanceof Mesh ? hit.object : undefined;
        return (aimed && specOf(aimed) ? aimed : undefined) ?? nearest() ?? null;
    };

    const showPrompt = (spec?: ReadSpec) => {
        if (!(prompt instanceof HTMLElement)) {
            return;
        }
        if (!spec) {
            prompt.hidden = true;
            return;
        }
        prompt.hidden = false;
        prompt.textContent =
            spec.folder === 'scrolls' ? `Press E to pick up ${spec.title}` : `Press E to read ${spec.title}`;
    };

    return {
        tick() {
            if (!isActive() || bookOpen) {
                focused = null;
                hidePrompt();
                return;
            }
            focused = focusFromView();
            const spec = focused ? specOf(focused) : undefined;
            if (
                focused &&
                spec?.folder === 'scrolls' &&
                focused.getWorldPosition(world).distanceTo(camera.position) < 1.25
            ) {
                void open(focused);
                return;
            }
            showPrompt(spec);
        },
    };
}

export { createBookReader };
