import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as maplibregl from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput } from 'maplibre-gl';

export class NovaVehicle3DLayer implements CustomLayerInterface {
    public id = 'nova-vehicle-3d';
    public type = 'custom' as const;
    public renderingMode = '3d' as const;

    private map: maplibregl.Map | null = null;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.WebGLRenderer | null = null;
    
    private modelGroup: THREE.Group;
    private glbModel: THREE.Group | null = null;
    // private glbWrapper: THREE.Group | null = null;
    private proceduralModel: THREE.Group | null = null;
    private underglow: THREE.PointLight | null = null;
    
    private currentLocation: { lng: number, lat: number } | null = null;
    private currentHeading = 0;
    private visualHeading = 0;
    private currentAltitude = 0;
    
    public navState = 'IDLE';
    public status: 'LOADING' | 'GLB' | 'PROCEDURAL_FALLBACK' | 'ERROR' = 'LOADING';

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.modelGroup = new THREE.Group();
        this.scene.add(this.modelGroup);

        console.log('[3D] CONSTRUCTOR');
        this.setupLighting();
        
        // Add Temporary Debug Box (Task 5)
        const debugGeo = new THREE.BoxGeometry(2, 5, 2); // 2m wide, 5m long, 2m high
        const debugMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false, depthTest: false }); // Highly visible
        const debugMesh = new THREE.Mesh(debugGeo, debugMat);
        debugMesh.position.set(0, 0, 1); // Sit exactly on map surface (Z center = 1)
        this.modelGroup.add(debugMesh);
        
        this.loadGLBModel();
        
        console.log('[3D] MODEL CHILDREN', this.modelGroup.children.length);
    }

    private setupLighting() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(40, -40, 100);
        this.scene.add(directionalLight);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 0, 100);
        this.scene.add(hemiLight);

        this.underglow = new THREE.PointLight(0x00d2ff, 0, 10);
        this.underglow.position.set(0, 0, 0.2);
        this.modelGroup.add(this.underglow);
    }

    private createProceduralFallback() {
        const procModel = new THREE.Group();

        // Simple basic fallback box
        const fallbackMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest: true, depthWrite: true });
        const chassisGeo = new THREE.BoxGeometry(1.9, 4.8, 1.5);
        const chassis = new THREE.Mesh(chassisGeo, fallbackMat);
        chassis.position.set(0, 0, 0.75);
        procModel.add(chassis);

        this.proceduralModel = procModel;
        this.modelGroup.add(this.proceduralModel);
        this.status = 'PROCEDURAL_FALLBACK';
    }

    private loadGLBModel() {
        const loader = new GLTFLoader();
        console.log('[NOVA 3D] GLB REQUEST');
        loader.load('/models/Koenigsegg.glb', (gltf: any) => {
            console.log('[NOVA 3D] GLB LOADED');
            if (!gltf || !gltf.scene) {
                console.error('[NOVA 3D] GLB LOAD FAILED — PROCEDURAL FALLBACK ACTIVE');
                this.createProceduralFallback();
                return;
            }
            
            this.glbModel = gltf.scene as THREE.Group;
            if (!this.glbModel) return;

            // Log mesh count
            let meshCount = 0;
            this.glbModel.traverse((child) => { if ((child as THREE.Mesh).isMesh) meshCount++; });
            console.log('[NOVA 3D] MESH COUNT', meshCount);

            const box = new THREE.Box3().setFromObject(this.glbModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            console.log('[NOVA 3D] BOUNDS', { min: box.min, max: box.max });
            console.log('[NOVA 3D] DIMENSIONS', { x: size.x, y: size.y, z: size.z });
            console.log('[NOVA 3D] CENTER', { x: center.x, y: center.y, z: center.z });

            // Determine length
            let length = size.z;
            if (size.x > size.y && size.x > size.z) { length = size.x; }
            if (size.y > size.x && size.y > size.z) { length = size.y; }

            // Normalize vehicle to ~4.8m long
            const scale = length > 0 ? 4.8 / length : 1;
            console.log('[NOVA 3D] SCALE', scale);

            // Clean hierarchy
            const vehicleRoot = new THREE.Group();
            const orientationWrapper = new THREE.Group();
            
            // Put center on local X/Y = 0, and bottom exactly at local Z = 0 (before orientation)
            this.glbModel.position.set(-center.x, -box.min.y, -center.z);
            orientationWrapper.add(this.glbModel);

            // Apply Y-up to Z-up orientation correction
            orientationWrapper.rotation.x = Math.PI / 2;
            console.log('[NOVA 3D] ORIENTATION', 'Applied Math.PI/2 on X-axis to convert Y-up to Z-up based on GLB bounds inspection');

            vehicleRoot.scale.set(scale, scale, scale);
            vehicleRoot.add(orientationWrapper);

            if (this.proceduralModel) {
                this.modelGroup.remove(this.proceduralModel);
                this.proceduralModel = null;
            }
            
            this.modelGroup.add(vehicleRoot);
            this.status = 'GLB';
            console.log('[NOVA 3D] VEHICLE READY', 'GLB VEHICLE ACTIVE');
            
            if (this.map) this.map.triggerRepaint();
        }, undefined, (err) => {
            console.error('[NOVA 3D] Failed to load GLB model', err);
            console.error('[NOVA 3D] GLB LOAD FAILED — PROCEDURAL FALLBACK ACTIVE');
            this.createProceduralFallback();
        });
    }

    public updatePosition(lng: number, lat: number) {
        console.log('[3D] POSITION', lng, lat);
        this.currentLocation = { lng, lat };
        if (this.map) this.map.triggerRepaint();
    }

    // Shortest-angle interpolation logic for rotation
    private shortestAngleDelta(current: number, target: number): number {
        let diff = target - current;
        diff = ((diff + 180) % 360) - 180;
        if (diff < -180) diff += 360;
        return diff;
    }

    public updateHeading(heading: number) {
        this.currentHeading = heading;
        if (this.map) this.map.triggerRepaint();
    }

    public updateNavState(state: string) {
        this.navState = state;
        if (this.underglow) {
            this.underglow.intensity = (state === 'NAVIGATING') ? 2.0 : 0.0;
        }
        if (this.map) this.map.triggerRepaint();
    }

    public onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
        console.log('[3D] ON_ADD');
        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;
    }

    public render(_gl: WebGLRenderingContext, input: CustomRenderMethodInput) {
        if (!this.renderer || !this.map || !this.currentLocation) return;
        
        // Smooth visual heading towards current target
        const diff = this.shortestAngleDelta(this.visualHeading, this.currentHeading);
        this.visualHeading += diff * 0.1; 
        // Normalize visualHeading to [0, 360)
        this.visualHeading = ((this.visualHeading % 360) + 360) % 360;
        
        const mercator = maplibregl.MercatorCoordinate.fromLngLat(
            {
                lng: this.currentLocation.lng,
                lat: this.currentLocation.lat
            },
            this.currentAltitude
        );
        
        if (!Number.isFinite(mercator.x) || !Number.isFinite(mercator.y) || !Number.isFinite(mercator.z)) {
            console.error('[3D] INVALID MERCATOR POSITION');
            return;
        }

        const matrix = input.defaultProjectionData.mainMatrix;
        if (!matrix || matrix.length !== 16) {
            console.error('[3D] INVALID MAPLIBRE MATRIX');
            return;
        }

        const scale = mercator.meterInMercatorCoordinateUnits();
        
        console.log('[3D] RENDERING VEHICLE', {
            lng: this.currentLocation.lng,
            lat: this.currentLocation.lat,
            mercatorX: mercator.x,
            mercatorY: mercator.y,
            scale
        });

        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            0
        );

        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            0
        );

        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            -this.visualHeading * Math.PI / 180
        );

        const m = new THREE.Matrix4().fromArray(matrix);

        const l = new THREE.Matrix4()
            .makeTranslation(
                mercator.x,
                mercator.y,
                mercator.z
            )
            .scale(
                new THREE.Vector3(
                    scale,
                    -scale,
                    scale
                )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);
            
        this.camera.projectionMatrix = m.multiply(l);
        
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        
        if (this.map) {
            this.map.triggerRepaint();
        }
    }

    private disposeThree(obj: THREE.Object3D) {
        if (obj instanceof THREE.Mesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        }
        while (obj.children.length > 0) {
            this.disposeThree(obj.children[0]);
            obj.remove(obj.children[0]);
        }
    }

    public onRemove() {
        this.disposeThree(this.scene);
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        this.map = null;
    }
}
