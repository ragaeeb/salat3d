import {
    BoxGeometry,
    CanvasTexture,
    Group,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    PointLight,
    SRGBColorSpace,
} from 'three';

export type BookSpec = {
    color: string;
    file: string;
    id: string;
    title: string;
};

export type BookCatalog = { books: BookSpec[] };

function wood(color: number) {
    return new MeshStandardMaterial({ color, envMapIntensity: 0.2, metalness: 0.04, roughness: 0.88 });
}

function paintLabel(width: number, height: number, title: string, rotate: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('2d canvas unavailable');
    }
    ctx.fillStyle = '#f4e7c5';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#2a2118';
    ctx.font = `bold ${rotate ? 28 : 42}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (rotate) {
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(title, 0, 0);
    } else {
        ctx.fillText(title, width / 2, height / 2);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
}

function box(w: number, h: number, d: number, material: MeshStandardMaterial, x: number, y: number, z: number) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

async function loadCatalog(): Promise<BookSpec[]> {
    const response = await fetch('/books/books.json');
    const catalog = (await response.json()) as BookCatalog;
    return catalog.books;
}

async function createLibrary() {
    const specs = await loadCatalog();
    const group = new Group();
    group.name = 'library';
    group.position.set(0, 0, 24);

    const plaster = wood(0xd8cbb3);
    const timber = wood(0x5c3d24);
    const floor = wood(0x8a6a3b);

    group.add(
        box(10, 0.12, 8, floor, 0, 1.0, 0),
        box(10.4, 3.6, 0.28, plaster, 0, 2.8, 3.95),
        box(0.28, 3.6, 8, plaster, -5.05, 2.8, 0),
        box(0.28, 3.6, 8, plaster, 5.05, 2.8, 0),
        box(10.8, 0.28, 8.6, timber, 0, 4.75, 0.1),
        box(8.4, 0.16, 0.7, timber, 0, 2.15, 3.45),
        box(8.4, 0.16, 0.7, timber, 0, 3.35, 3.45),
    );

    const sign = new Mesh(
        new PlaneGeometry(4.2, 0.7),
        new MeshStandardMaterial({ color: 0xffffff, map: paintLabel(512, 128, 'LIBRARY', false) }),
    );
    sign.position.set(0, 4.25, -4.05);
    sign.rotation.y = Math.PI;
    group.add(sign);

    const lamp = new PointLight(0xffe2b0, 12, 14, 2);
    lamp.position.set(0, 4.2, 0);
    group.add(lamp);

    const books: Mesh[] = [];
    const span = Math.min(6.5, specs.length * 0.7);
    for (const [i, spec] of specs.entries()) {
        const t = specs.length === 1 ? 0.5 : i / (specs.length - 1);
        const cover = new MeshStandardMaterial({ color: spec.color, envMapIntensity: 0.35, roughness: 0.55 });
        const pages = new MeshStandardMaterial({ color: 0xf3ead3, roughness: 0.9 });
        const title = new MeshStandardMaterial({
            color: 0xffffff,
            map: paintLabel(256, 512, spec.title, false),
            roughness: 0.7,
        });
        const book = new Mesh(new BoxGeometry(0.55, 1.05, 0.16), [cover, cover, pages, pages, pages, title]);
        book.position.set(-span / 2 + t * span, 2.76, 3.45);
        book.rotation.y = (t - 0.5) * 0.15;
        book.castShadow = true;
        book.userData.book = spec;
        book.userData.read = { file: spec.file, folder: 'books', id: spec.id, title: spec.title };
        group.add(book);
        books.push(book);
    }

    return { books, group };
}

export { createLibrary };
