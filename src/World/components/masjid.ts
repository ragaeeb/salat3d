import {
    BoxGeometry,
    CanvasTexture,
    ConeGeometry,
    CylinderGeometry,
    DoubleSide,
    Group,
    LatheGeometry,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    PointLight,
    RepeatWrapping,
    SphereGeometry,
    SRGBColorSpace,
    TorusGeometry,
    Vector2,
} from 'three';

function std(color: number, extras: ConstructorParameters<typeof MeshStandardMaterial>[0] = {}) {
    return new MeshStandardMaterial({ color, envMapIntensity: 0.28, metalness: 0.04, roughness: 0.82, ...extras });
}

function canvasTex(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('2d canvas unavailable');
    }
    paint(ctx, size);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
}

function tileTexture() {
    const texture = canvasTex(256, (ctx, size) => {
        ctx.fillStyle = '#e7d7b6';
        ctx.fillRect(0, 0, size, size);
        const step = 32;
        for (let y = 0; y < size; y += step) {
            for (let x = 0; x < size; x += step) {
                const cx = x + step / 2;
                const cy = y + step / 2;
                ctx.fillStyle = (x + y) % 64 === 0 ? '#1f6f68' : '#2d8a7a';
                ctx.beginPath();
                ctx.moveTo(cx, y + 3);
                ctx.lineTo(x + step - 3, cy);
                ctx.lineTo(cx, y + step - 3);
                ctx.lineTo(x + 3, cy);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#c9a24a';
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }
    });
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 8);
    return texture;
}

function rugTexture() {
    return canvasTex(256, (ctx, size) => {
        ctx.fillStyle = '#7a1820';
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 9; i++) {
            ctx.fillStyle = i % 2 ? '#c9a24a' : '#5c1016';
            ctx.fillRect(18, 16 + i * 24, size - 36, 10);
        }
        ctx.strokeStyle = '#e6c56a';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, size - 20, size - 20);
        ctx.fillStyle = '#e6c56a';
        ctx.beginPath();
        ctx.moveTo(size / 2, 28);
        ctx.lineTo(size / 2 + 36, 70);
        ctx.lineTo(size / 2, 58);
        ctx.lineTo(size / 2 - 36, 70);
        ctx.closePath();
        ctx.fill();
    });
}

function box(w: number, h: number, d: number, material: MeshStandardMaterial, x: number, y: number, z: number) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function createMasjid() {
    const group = new Group();
    group.name = 'masjid';
    group.position.set(-20, 0, 8);
    group.rotation.y = Math.PI;

    const plaster = std(0xeee0c4);
    const stone = std(0xd7c4a3, { roughness: 0.9 });
    const band = std(0x1f6f68, { roughness: 0.45 });
    const gold = std(0xd4b056, { metalness: 0.65, roughness: 0.28 });
    const wood = std(0x5a3a22, { roughness: 0.88 });
    const dome = std(0x2a9b8a, { metalness: 0.18, roughness: 0.32 });
    const floor = std(0xffffff, { map: tileTexture(), roughness: 0.7 });
    const glass = new MeshPhysicalMaterial({
        color: 0x7ec8c0,
        envMapIntensity: 1.1,
        metalness: 0.1,
        opacity: 0.45,
        roughness: 0.08,
        side: DoubleSide,
        transparent: true,
    });

    group.add(
        box(14, 0.12, 12.2, floor, 0, 1.0, 0),
        box(10, 0.1, 6.4, stone, 0, 0.99, -9.2),
        box(14.2, 4.9, 0.34, plaster, 0, 3.45, 6.05),
        box(0.34, 4.9, 12.2, plaster, -7.05, 3.45, 0),
        box(0.34, 4.9, 12.2, plaster, 7.05, 3.45, 0),
        box(5.3, 4.9, 0.34, plaster, -4.55, 3.45, -6.05),
        box(5.3, 4.9, 0.34, plaster, 4.55, 3.45, -6.05),
        box(3.6, 1.35, 0.34, plaster, 0, 5.22, -6.05),
        box(14.6, 0.22, 12.6, stone, 0, 5.95, 0),
        box(14.4, 0.16, 0.22, band, 0, 5.62, 6.12),
        box(0.22, 0.16, 12.4, band, -7.12, 5.62, 0),
        box(0.22, 0.16, 12.4, band, 7.12, 5.62, 0),
        box(1.15, 3.4, 0.42, wood, -2.35, 2.7, -6.08),
        box(1.15, 3.4, 0.42, wood, 2.35, 2.7, -6.08),
        box(1.7, 4.2, 0.7, plaster, 0, 3.1, 5.55),
    );

    const arch = new Mesh(new CylinderGeometry(1.85, 1.85, 0.36, 22, 1, false, 0, Math.PI), plaster);
    arch.rotation.set(0, 0, Math.PI / 2);
    arch.position.set(0, 4.35, -6.05);
    arch.castShadow = true;
    group.add(arch);

    const drum = new Mesh(new CylinderGeometry(3.15, 3.25, 1.15, 32), plaster);
    drum.position.set(0, 6.6, 0.4);
    drum.castShadow = true;
    const onion = new Mesh(
        new LatheGeometry(
            [
                new Vector2(0.02, 0),
                new Vector2(3.2, 0.08),
                new Vector2(3.38, 0.55),
                new Vector2(3.05, 1.3),
                new Vector2(2.15, 2.2),
                new Vector2(1.1, 3.0),
                new Vector2(0.38, 3.5),
                new Vector2(0.09, 3.92),
                new Vector2(0.02, 4.12),
            ],
            40,
        ),
        dome,
    );
    onion.position.set(0, 7.1, 0.4);
    onion.castShadow = true;
    const finial = new Mesh(new SphereGeometry(0.14, 12, 10), gold);
    finial.position.set(0, 11.3, 0.4);
    const crescent = new Mesh(new TorusGeometry(0.28, 0.045, 8, 20, Math.PI * 1.55), gold);
    crescent.position.set(0, 11.62, 0.4);
    crescent.rotation.z = 0.45;
    group.add(drum, onion, finial, crescent);

    const minaret = new Group();
    minaret.position.set(-6.35, 0, -5.35);
    minaret.add(
        box(1.7, 1.4, 1.7, stone, 0, 1.7, 0),
        box(1.35, 8.2, 1.35, plaster, 0, 6.5, 0),
        box(2.05, 0.18, 2.05, band, 0, 10.7, 0),
        box(0.95, 1.7, 0.95, plaster, 0, 11.65, 0),
    );
    const cap = new Mesh(new ConeGeometry(0.72, 1.55, 16), dome);
    cap.position.y = 12.95;
    cap.castShadow = true;
    const minaretCrescent = crescent.clone();
    minaretCrescent.position.set(0, 13.85, 0);
    minaret.add(cap, minaretCrescent);
    group.add(minaret);

    const niche = std(0x1a5c56, { roughness: 0.55 });
    group.add(
        box(1.55, 2.9, 0.18, niche, 0, 2.65, 5.88),
        box(0.14, 2.9, 0.4, gold, -0.82, 2.65, 5.72),
        box(0.14, 2.9, 0.4, gold, 0.82, 2.65, 5.72),
        box(1.78, 0.12, 0.4, gold, 0, 4.16, 5.72),
    );
    const mihrabArch = new Mesh(new TorusGeometry(0.82, 0.08, 8, 22, Math.PI), gold);
    mihrabArch.position.set(0, 4.1, 5.72);
    group.add(mihrabArch);

    const rugMap = rugTexture();
    const rugMat = std(0xffffff, { map: rugMap, roughness: 0.78, side: DoubleSide });
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const rug = new Mesh(new PlaneGeometry(1.7, 2.35), rugMat);
            rug.rotation.x = -Math.PI / 2;
            rug.position.set(-3.6 + col * 2.4, 1.07, -1.6 + row * 2.55);
            rug.receiveShadow = true;
            group.add(rug);
        }
    }

    for (const x of [-3.2, 3.2]) {
        const column = new Mesh(new CylinderGeometry(0.22, 0.26, 4.4, 14), stone);
        column.position.set(x, 3.2, 1.4);
        column.castShadow = true;
        const capital = new Mesh(new CylinderGeometry(0.38, 0.22, 0.22, 14), gold);
        capital.position.set(x, 5.35, 1.4);
        group.add(column, capital);
    }

    for (const [x, z, ry] of [
        [-7.08, -2.2, Math.PI / 2],
        [-7.08, 2.2, Math.PI / 2],
        [7.08, -2.2, -Math.PI / 2],
        [7.08, 2.2, -Math.PI / 2],
    ] as const) {
        const pane = new Mesh(new PlaneGeometry(1.5, 2.1), glass);
        pane.position.set(x, 3.15, z);
        pane.rotation.y = ry;
        group.add(pane);
    }

    const basin = new Mesh(new CylinderGeometry(1.15, 1.35, 0.42, 24), stone);
    basin.position.set(0, 1.22, -9.1);
    const water = new Mesh(
        new CylinderGeometry(1.0, 1.0, 0.1, 24),
        new MeshPhysicalMaterial({
            color: 0x2a8a9a,
            metalness: 0.12,
            opacity: 0.75,
            roughness: 0.05,
            transparent: true,
        }),
    );
    water.position.set(0, 1.4, -9.1);
    const spout = new Mesh(new CylinderGeometry(0.1, 0.14, 0.7, 10), stone);
    spout.position.set(0, 1.7, -9.1);
    basin.castShadow = spout.castShadow = true;
    group.add(basin, water, spout);

    for (const x of [-2.4, 2.4]) {
        const lamp = new Mesh(
            new SphereGeometry(0.16, 12, 10),
            std(0xffe2a8, { emissive: 0xffc978, emissiveIntensity: 1.4 }),
        );
        lamp.position.set(x, 4.55, 0.2);
        const light = new PointLight(0xffe0b0, 10, 13, 2);
        light.position.copy(lamp.position);
        group.add(lamp, light);
    }

    return group;
}

export { createMasjid };
