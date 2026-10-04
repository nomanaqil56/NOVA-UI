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

    public navState = 'IDLE';
    public status: 'LOADING' | 'GLB' | 'PROCEDURAL_FALLBACK' | 'ERROR' = 'LOADING';

    constructor() {
        this.scene.add(this.modelGroup);
        this.setupLighting();
        this.createProceduralFallback();
        console.log('[NOVA 3D] CONSTRUCTOR');
        this.loadGLBModel();
    }

    private setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.8);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffffff, 3.0);
        key.position.set(30, -40, 80);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xbfd8ff, 2.0);
        fill.position.set(-30, 40, 50);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 1.5);
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
            color: 0x6b7280,
            metalness: 0.75,
            roughness: 0.28
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
        console.log('[NOVA 3D] GLB REQUEST');

        loader.load(
            '/models/Koenigsegg.glb',
            (gltf) => {
                if (!gltf?.scene) {
                    console.error('[NOVA 3D] GLB returned no scene');
                    this.status = 'ERROR';
                    return;
                }

                const source = gltf.scene;
                let meshCount = 0;

                source.traverse((child) => {
                    if (!(child as THREE.Mesh).isMesh) return;
                    meshCount++;

                    const mesh = child as THREE.Mesh;
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

                    mesh.material = materials.map((material) => {
                        const name = String((material as THREE.Material).name || '').toLowerCase();
                        const isGlass = name.includes('glass') || name.includes('window') || name.includes('windshield');

                        return new THREE.MeshStandardMaterial({
                            name: material.name || 'NOVA Vehicle Material',
                            color: isGlass ? 0x10151c : 0x6b7280,
                            metalness: isGlass ? 0.2 : 0.78,
                            roughness: isGlass ? 0.16 : 0.27,
                        });
                    });

                    mesh.castShadow = false;
                    mesh.receiveShadow = false;
                });

                console.log('[NOVA 3D] GLB LOADED');
                console.log('[NOVA 3D] MESH COUNT', meshCount);

                if (meshCount === 0) {
                    console.error('[NOVA 3D] GLB HAS NO MESHES');
                    this.status = 'ERROR';
                    return;
                }

                const box = new THREE.Box3().setFromObject(source);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                console.log('[NOVA 3D] BOUNDS', {
                    min: box.min.toArray(),
                    max: box.max.toArray()
                });
                console.log('[NOVA 3D] DIMENSIONS', size.toArray());

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

                console.log('[NOVA 3D] NORMALIZED SCALE', normalizedScale);
                console.log('[NOVA 3D] VEHICLE READY — GLB ACTIVE');

                if (this.map) this.map.triggerRepaint();
            },
            (event) => {
                if (event.total > 0) {
                    console.log('[NOVA 3D] GLB PROGRESS', Math.round((event.loaded / event.total) * 100) + '%');
                }
            },
            (error) => {
                console.error('[NOVA 3D] GLB LOAD FAILED', error);
                this.status = 'PROCEDURAL_FALLBACK';
                if (this.fallbackRoot) this.fallbackRoot.visible = true;
                if (this.map) this.map.triggerRepaint();
            }
        );
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
        // Continuous smooth interpolation between precise visual multiplier control points
        const controlPoints: [number, number][] = [
            [18, 1.00],
            [17, 1.03],
            [16, 1.08],
            [15, 1.15],
            [14, 1.28],
            [13, 1.45],
            [12, 1.65],
            [11, 1.90],
            [10, 2.20],
            [9, 2.55],
            [8, 2.90]
        ];

        if (zoom >= 18) return 1.00;
        if (zoom <= 8) return 2.90;

        for (let i = 0; i < controlPoints.length - 1; i++) {
            const [z1, v1] = controlPoints[i]; // Higher zoom
            const [z2, v2] = controlPoints[i + 1]; // Lower zoom
            
            if (zoom <= z1 && zoom > z2) {
                // Fraction from z1 towards z2
                const t = (z1 - zoom) / (z1 - z2);
                // Smoothstep interpolation for a continuous derivative curve
                const smooth_t = t * t * (3 - 2 * t);
                return v1 + (v2 - v1) * smooth_t;
            }
        }
        
        return 1.0;
    }

    private lastLogTime = 0;

    public render(_gl: WebGLRenderingContext, input: CustomRenderMethodInput) {
        if (!this.renderer || !this.map || !this.currentLocation) return;

        const diff = this.shortestAngleDelta(this.visualHeading, this.currentHeading);
        this.visualHeading += diff * 0.14;
        this.visualHeading = (this.visualHeading + 360) % 360;

        const mercator = maplibregl.MercatorCoordinate.fromLngLat(
            this.currentLocation,
            this.currentAltitude
        );

        const matrix = input.defaultProjectionData.mainMatrix;
        if (!matrix || matrix.length !== 16) return;

        const zoom = this.map.getZoom();
        const meterScale = mercator.meterInMercatorCoordinateUnits();
        const visualMultiplier = this.getZoomVisualMultiplier(zoom);
        const finalScale = meterScale * visualMultiplier;

        if (performance.now() - this.lastLogTime > 1000) {
            this.lastLogTime = performance.now();
            console.log(
                `[NOVA VEHICLE]\n` +
                `Vehicle: GLB\n` +
                `Zoom: ${zoom.toFixed(2)}\n` +
                `Physical Scale: ${meterScale.toFixed(8)}\n` +
                `Visual Multiplier: ${visualMultiplier.toFixed(2)}\n` +
                `Final Scale: ${finalScale.toFixed(8)}\n`
            );
        }

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
        this.map.triggerRepaint();
    }

    private disposeThree(obj: THREE.Object3D) {
        if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const material = obj.material;
            if (Array.isArray(material)) material.forEach((m) => m.dispose());
            else material.dispose();
        }

        while (obj.children.length > 0) {
            const child = obj.children[0];
            this.disposeThree(child);
            obj.remove(child);
        }
    }

    public onRemove() {
        this.disposeThree(this.scene);
        this.renderer?.dispose();
        this.renderer = null;
        this.map = null;
    }
}
