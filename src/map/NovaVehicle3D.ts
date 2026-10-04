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
    private proceduralModel: THREE.Group | null = null;
    private underglow: THREE.PointLight | null = null;
    
    private currentLocation = { lng: 0, lat: 0 };
    private currentHeading = 0;
    private visualHeading = 0;
    private altitude = 0;
    
    public navState = 'IDLE';
    public status: 'LOADING' | 'GLB' | 'PROCEDURAL' | 'ERROR' = 'LOADING';

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.modelGroup = new THREE.Group();
        this.scene.add(this.modelGroup);

        this.setupLighting();
        this.createProceduralFallback();
        this.loadGLBModel();
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

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.3, metalness: 0.8 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.9 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
        const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const chassisGeo = new THREE.BoxGeometry(2.0, 4.8, 0.5);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.set(0, 0, 0.4);
        procModel.add(chassis);

        const cabinGeo = new THREE.BoxGeometry(1.6, 2.6, 0.8);
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, -0.2, 1.05);
        procModel.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const positions = [[1.0, 1.5, 0.35], [-1.0, 1.5, 0.35], [1.0, -1.5, 0.35], [-1.0, -1.5, 0.35]];
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            procModel.add(wheel);
        });

        const frontLightGeo = new THREE.BoxGeometry(1.8, 0.1, 0.05);
        const frontLight = new THREE.Mesh(frontLightGeo, cyanMat);
        frontLight.position.set(0, 2.4, 0.6);
        procModel.add(frontLight);

        const rearLightGeo = new THREE.BoxGeometry(1.8, 0.1, 0.05);
        const rearLight = new THREE.Mesh(rearLightGeo, redMat);
        rearLight.position.set(0, -2.4, 0.6);
        procModel.add(rearLight);

        const sensorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        sensorGeo.rotateX(Math.PI / 2);
        const sensor = new THREE.Mesh(sensorGeo, bodyMat);
        sensor.position.set(0, 0.5, 1.45);
        procModel.add(sensor);
        
        const shadowGeo = new THREE.PlaneGeometry(2.4, 5.2);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.position.set(0, 0, 0.01);
        procModel.add(shadow);

        this.proceduralModel = procModel;
        this.modelGroup.add(this.proceduralModel);
        this.status = 'PROCEDURAL';
    }

    private loadGLBModel() {
        const loader = new GLTFLoader();
        loader.load('/models/nova-car.glb', (gltf: any) => {
            if (!gltf || !gltf.scene) return;
            this.glbModel = gltf.scene as THREE.Group;
            if (!this.glbModel) return;
            
            this.glbModel.rotation.x = Math.PI / 2;
            
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
        }, undefined, (error: any) => {
            console.warn('[NOVA 3D] Failed to load GLB model, using procedural fallback.', error);
        });
    }

    public updatePosition(lng: number, lat: number) {
        this.currentLocation = { lng, lat };
        if (this.map) this.map.triggerRepaint();
    }

    public updateHeading(heading: number) {
        const diff = heading - this.currentHeading;
        let delta = ((diff + 180) % 360) - 180;
        if (delta < -180) delta += 360;
        this.currentHeading += delta;
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
        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;
    }

    public render(_gl: WebGLRenderingContext, input: CustomRenderMethodInput) {
        if (!this.renderer || !this.map) return;

        const diff = this.currentHeading - this.visualHeading;
        this.visualHeading += diff * 0.1; 
        
        const mercator = maplibregl.MercatorCoordinate.fromLngLat(
            this.currentLocation, 
            this.altitude
        );

        // input is either a matrix or an object containing projectionMatrix in older/newer maplibre
        const matrixArray = (input as any).default || input;
        
        let m = new THREE.Matrix4();
        if (matrixArray instanceof Float32Array || Array.isArray(matrixArray)) {
             m.fromArray(matrixArray as any);
        } else if ((input as any).projectionMatrix) {
             m.fromArray((input as any).projectionMatrix);
        }

        const scale = mercator.meterInMercatorCoordinateUnits();

        const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
        const rotationMatrix = new THREE.Matrix4().makeRotationZ(-this.visualHeading * Math.PI / 180);
        const translationMatrix = new THREE.Matrix4().makeTranslation(mercator.x, mercator.y, mercator.z);
        
        const transformMatrix = new THREE.Matrix4()
            .multiply(translationMatrix)
            .multiply(rotationMatrix)
            .multiply(scaleMatrix);

        this.camera.projectionMatrix = m.multiply(transformMatrix);
        
        // Save the GL state before rendering Three.js
        this.renderer.resetState();
        
        this.renderer.render(this.scene, this.camera);
        
        if (Math.abs(diff) > 0.1 && this.map) {
            this.map.triggerRepaint();
        }
    }

    public onRemove() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        this.map = null;
    }
}
