import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
    // private glbModel: THREE.Group | null = null;
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
        this.createProceduralFallback();
        // this.loadGLBModel(); // Disabled for debugging
        
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

        // TEMPORARY BASIC MATERIALS FOR DEBUGGING
        const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest: true, depthWrite: true });

        // Temporarily make the vehicle much larger
        // chassis: 8m long, 4m wide, 2m high
        const chassisGeo = new THREE.BoxGeometry(4.0, 8.0, 2.0);
        const chassis = new THREE.Mesh(chassisGeo, cyanMat);
        chassis.position.set(0, 0, 1.0); // Centered, up a bit
        procModel.add(chassis);

        const cabinGeo = new THREE.BoxGeometry(3.0, 4.0, 1.0);
        const cabin = new THREE.Mesh(cabinGeo, cyanMat);
        cabin.position.set(0, -0.4, 2.5);
        procModel.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
        wheelGeo.rotateZ(Math.PI / 2); // Put cylinder flat so wheels face sides
        const positions = [
            [2.2, 2.5, 0.7],   // front right
            [-2.2, 2.5, 0.7],  // front left
            [2.2, -2.5, 0.7],  // rear right
            [-2.2, -2.5, 0.7]  // rear left
        ];
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, cyanMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            procModel.add(wheel);
        });

        // DEBUG SPHERE
        const debugGeometry = new THREE.SphereGeometry(2.0, 16, 16);
        const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest: false, depthWrite: false });
        const debugSphere = new THREE.Mesh(debugGeometry, debugMaterial);
        debugSphere.position.set(0, 0, 5);
        procModel.add(debugSphere);

        this.proceduralModel = procModel;
        this.modelGroup.add(this.proceduralModel);
        this.status = 'PROCEDURAL_FALLBACK';
    }

    /*
    private loadGLBModel() {
        const loader = new GLTFLoader();
        loader.load('/models/nova-car.glb', (gltf: any) => {
            if (!gltf || !gltf.scene) return;
            this.glbModel = gltf.scene as THREE.Group;
            if (!this.glbModel) return;
            
            // By default GLTF is Y-up. We need MapLibre Z-up. 
            // We rotate around X to put Y up into Z up.
            this.glbModel.rotation.x = Math.PI / 2;
            
            // Assume the model is facing Z in its local space, we might need another rotation 
            // to make it face MapLibre Y (North) but that depends on the specific GLB.
            // Without the GLB to test, we leave it.

            const box = new THREE.Box3().setFromObject(this.glbModel);
            const size = box.getSize(new THREE.Vector3());
            const scale = size.z > 0 ? 4.8 / size.z : 1;
            this.glbModel.scale.set(scale, scale, scale);

            const shadowGeo = new THREE.PlaneGeometry(2.4, 5.2);
            const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false });
            const shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.position.set(0, 0, 0.01);
            shadow.rotation.x = -Math.PI / 2;
            this.glbModel.add(shadow);

            if (this.proceduralModel) {
                this.modelGroup.remove(this.proceduralModel);
            }
            this.modelGroup.add(this.glbModel);
            this.status = 'GLB';
            
            if (this.map) this.map.triggerRepaint();
        }, undefined, () => {
            // Keep procedural fallback. Status is already set.
            console.warn('[NOVA 3D] Failed to load GLB model, using procedural fallback.');
        });
    }
    */

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
