import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as maplibregl from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput } from 'maplibre-gl';

export class NovaVehicle3DLayer implements CustomLayerInterface {
    public id = 'nova-vehicle-3d';
    public type = 'custom' as const;
    public renderingMode = '3d' as const;

    private map: maplibregl.Map | null = null;
    private scene = new THREE.Scene();
    private camera = new THREE.Camera();
    private renderer: THREE.WebGLRenderer | null = null;
    private modelGroup = new THREE.Group();
    private fallbackRoot: THREE.Group | null = null;
    private underglow: THREE.PointLight | null = null;

    private currentLocation: { lng: number; lat: number } | null = null;
    private currentHeading = 0;
    private visualHeading = 0;
    private currentAltitude = 0;
    private removed = false;

    public navState = 'IDLE';
    public status: 'LOADING' | 'GLB' | 'PROCEDURAL_FALLBACK' | 'ERROR' = 'LOADING';

    constructor() {
        this.scene.add(this.modelGroup);
        this.setupLighting();
        this.createProceduralFallback();
        this.loadGLBModel();
    }

    private setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffffff, 2.0);
        key.position.set(30, -40, 80);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xbfd8ff, 0.8);
        fill.position.set(-30, 40, 50);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.6);
        rim.position.set(0, 0, 100);
        this.scene.add(rim);

        this.underglow = new THREE.PointLight(0x00d2ff, 0, 10);
        this.underglow.position.set(0, 0, 0.2);
        this.modelGroup.add(this.underglow);
    }

    private createProceduralFallback() {
        if (this.fallbackRoot) return;

        const root = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            metalness: 0.52,
            roughness: 0.32
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            metalness: 0.15,
            roughness: 0.18
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x090b0f,
            metalness: 0.05,
            roughness: 0.85
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 4.8, 0.7), bodyMat);
        body.position.z = 0.65;
        root.add(body);

        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.45, 0.22), bodyMat);
        hood.position.set(0, 1.95, 0.98);
        root.add(hood);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.0, 0.65), glassMat);
        cabin.position.set(0, 0.15, 1.18);
        root.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 20);
        const wheelPositions = [
            [-0.98, 1.45, 0.42], [0.98, 1.45, 0.42],
            [-0.98, -1.45, 0.42], [0.98, -1.45, 0.42]
        ];
        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, tireMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, y, z);
            root.add(wheel);
        }

        root.visible = true;
        this.fallbackRoot = root;
        this.modelGroup.add(root);
        this.status = 'PROCEDURAL_FALLBACK';
    }

    private loadGLBModel() {
        const loader = new GLTFLoader();
        loader.load(
            `${import.meta.env.BASE_URL}models/Koenigsegg.glb`,
            (gltf) => {
                if (this.removed) {
                    this.disposeThree(gltf.scene);
                    return;
                }

                if (!gltf?.scene) {
                    this.status = 'PROCEDURAL_FALLBACK';
                    return;
                }

                const source = gltf.scene;
                let meshCount = 0;

                source.traverse((child) => {
                    if (!(child as THREE.Mesh).isMesh) return;
                    meshCount++;

                    const mesh = child as THREE.Mesh;
                    const isWheel = this.hasWheelAncestor(mesh, source);
                    const recolor = (material: THREE.Material) => {
                        const name = material.name.toLowerCase();
                        const isGlass = name.includes('glass') || name.includes('window') || name.includes('windshield');
                        const isRearLight = name.includes('rear light') || name.includes('taillight') || name.includes('tail light');
                        const replacement = material.clone();

                        if (replacement instanceof THREE.MeshStandardMaterial) {
                            if (isGlass) {
                                replacement.color.set(0x1a222b);
                                replacement.metalness = 0.20;
                                replacement.roughness = 0.15;
                            } else if (isRearLight) {
                                replacement.color.set(0xc62e3a);
                                replacement.emissive.set(0x5c0e16);
                                replacement.emissiveIntensity = 0.35;
                                replacement.metalness = 0.15;
                                replacement.roughness = 0.3;
                            } else if (isWheel) {
                                replacement.color.set(0x171b20);
                                replacement.metalness = 0.24;
                                replacement.roughness = 0.68;
                            } else {
                                // BODY: medium/dark metallic gray, high metalness, low roughness
                                replacement.color.set(0x4a5059);
                                replacement.metalness = 0.78;
                                replacement.roughness = 0.25;
                            }
                        }

                        return replacement;
                    };

                    // Single-material meshes have no groups, so keep their material scalar.
                    mesh.material = Array.isArray(mesh.material)
                        ? mesh.material.map(recolor)
                        : recolor(mesh.material);

                    mesh.castShadow = false;
                    mesh.receiveShadow = false;
                    mesh.frustumCulled = false;
                    // Also make sure it renders on both sides just in case winding is flipped
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => m.side = THREE.DoubleSide);
                    } else {
                        mesh.material.side = THREE.DoubleSide;
                    }
                });

                if (meshCount === 0) {
                    this.disposeThree(source);
                    this.status = 'PROCEDURAL_FALLBACK';
                    return;
                }

                const box = new THREE.Box3().setFromObject(source);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Verified asset convention: X=width, Y=length/forward, Z=up.
                const vehicleLength = Math.max(size.y, 0.001);
                const normalizedScale = 4.9 / vehicleLength;

                const root = new THREE.Group();
                source.position.set(-center.x, -center.y, -box.min.z);
                root.add(source);
                root.scale.setScalar(normalizedScale);

                this.modelGroup.add(root);
                this.status = 'GLB';

                if (this.fallbackRoot) {
                    this.fallbackRoot.visible = false;
                }

                if (this.map) this.map.triggerRepaint();
            },
            () => {},
            (error) => {
                if (this.removed) return;
                console.error('Unable to load the NOVA vehicle model:', error);
                this.status = 'PROCEDURAL_FALLBACK';
                if (this.fallbackRoot) this.fallbackRoot.visible = true;
                if (this.map) this.map.triggerRepaint();
            }
        );
    }

    private hasWheelAncestor(mesh: THREE.Mesh, root: THREE.Object3D): boolean {
        let current: THREE.Object3D | null = mesh;
        while (current && current !== root) {
            if (/^(fl|fr|rl|rr)$/i.test(current.name) || /wheel/i.test(current.name)) return true;
            current = current.parent;
        }
        return false;
    }

    public updatePosition(lng: number, lat: number) {
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
        this.currentLocation = { lng, lat };
        if (this.map) this.map.triggerRepaint();
    }

    public updateHeading(heading: number) {
        if (!Number.isFinite(heading)) return;
        this.currentHeading = heading;
        if (this.map) this.map.triggerRepaint();
    }

    public updateNavState(state: string) {
        this.navState = state;
        if (this.underglow) {
            this.underglow.intensity = state === 'NAVIGATING' ? 2.0 : 0.0;
        }
        if (this.map) this.map.triggerRepaint();
    }

    public onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
        console.log('[NOVA 3D] ON_ADD');
        this.map = map;

        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
            alpha: true
        });
        this.renderer.autoClear = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        if (this.currentLocation) {
            console.log('[NOVA 3D] POSITION_ALREADY_AVAILABLE', this.currentLocation);
        }
    }

    private shortestAngleDelta(current: number, target: number) {
        let diff = (target - current + 180) % 360 - 180;
        if (diff < -180) diff += 360;
        return diff;
    }

    private getZoomVisualMultiplier(zoom: number): number {
        // Base multiplier to hit ~70px target at zoom 18 for a 4.9m model.
        // MapLibre zoom logic halves scale each step down, so we use 2^(18 - zoom) to maintain pixel size.
        const baseMultiplier = 4.5 * Math.pow(2, Math.max(0, 18 - zoom));

        // Use the exact continuous scaling approach requested:
        // 18->1.00, 17->1.03, 16->1.08, 15->1.15, 14->1.28, 13->1.45, 
        // 12->1.65, 11->1.90, 10->2.20, 9->2.55, 8->2.90
        // We divide baseMultiplier by this factor so the pixel size smoothly shrinks
        // as we zoom out, hitting exactly the target screen sizes.
        let factor = 1.0;
        if (zoom >= 18) factor = 1.0;
        else if (zoom >= 17) factor = 1.00 + (1.03 - 1.00) * (18 - zoom);
        else if (zoom >= 16) factor = 1.03 + (1.08 - 1.03) * (17 - zoom);
        else if (zoom >= 15) factor = 1.08 + (1.15 - 1.08) * (16 - zoom);
        else if (zoom >= 14) factor = 1.15 + (1.28 - 1.15) * (15 - zoom);
        else if (zoom >= 13) factor = 1.28 + (1.45 - 1.28) * (14 - zoom);
        else if (zoom >= 12) factor = 1.45 + (1.65 - 1.45) * (13 - zoom);
        else if (zoom >= 11) factor = 1.65 + (1.90 - 1.65) * (12 - zoom);
        else if (zoom >= 10) factor = 1.90 + (2.20 - 1.90) * (11 - zoom);
        else if (zoom >= 9)  factor = 2.20 + (2.55 - 2.20) * (10 - zoom);
        else if (zoom >= 8)  factor = 2.55 + (2.90 - 2.55) * (9 - zoom);
        else factor = 2.90;

        return baseMultiplier / factor;
    }

    public render(_gl: WebGLRenderingContext, input: CustomRenderMethodInput) {
        if (!this.renderer || !this.map || !this.currentLocation) return;

        const diff = this.shortestAngleDelta(this.visualHeading, this.currentHeading);
        if (Math.abs(diff) > 0.05) {
            this.visualHeading = (this.visualHeading + diff * 0.14 + 360) % 360;
            this.map.triggerRepaint();
        } else {
            this.visualHeading = (this.currentHeading + 360) % 360;
        }

        const mercator = maplibregl.MercatorCoordinate.fromLngLat(
            this.currentLocation,
            this.currentAltitude
        );

        const matrix = input.defaultProjectionData.mainMatrix;
        if (!matrix || matrix.length !== 16) return;

        const baseScale = mercator.meterInMercatorCoordinateUnits();
        const visualMultiplier = this.getZoomVisualMultiplier(this.map.getZoom());
        const finalScale = baseScale * visualMultiplier;

        // GLB uses Z-up and Y-forward. MapLibre's mercator custom-layer
        // transform uses +X east, -Y north, +Z up.
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            -this.visualHeading * Math.PI / 180
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(mercator.x, mercator.y, mercator.z)
            .scale(new THREE.Vector3(finalScale, -finalScale, finalScale))
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
    }

    private disposeThree(obj: THREE.Object3D) {
        obj.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.geometry.dispose();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => material.dispose());
        });
    }

    public onRemove() {
        this.removed = true;
        this.disposeThree(this.scene);
        this.renderer?.dispose();
        this.renderer = null;
        this.map = null;
    }
}
