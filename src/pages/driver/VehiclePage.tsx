import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Battery, Car, Gauge, Thermometer, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export const VehiclePage = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Three.js Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(-15, 8, 20);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(30, 40, 80);
    scene.add(key);
    
    const fill = new THREE.DirectionalLight(0xbfd8ff, 0.8);
    fill.position.set(-30, 40, -50);
    scene.add(fill);
    
    const rim = new THREE.DirectionalLight(0x00d2ff, 1.5); // Neon accent
    rim.position.set(0, -20, 0);
    scene.add(rim);

    let vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);

    // Load GLB
    const loader = new GLTFLoader();
    loader.load(
      `${import.meta.env.BASE_URL}models/Koenigsegg.glb`,
      (gltf) => {
        const source = gltf.scene;
        
        // Materials (matching the MapLibre one but adapted for dark UI showcase)
        source.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const material = child.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
          
          const recolor = (mat: THREE.Material) => {
            const m = mat.clone() as THREE.MeshStandardMaterial;
            const name = m.name.toLowerCase();
            const isGlass = name.includes('glass') || name.includes('window') || name.includes('windshield');
            const isWheel = name.includes('wheel') || name.includes('tire') || name.includes('rim');
            const isRearLight = name.includes('rear light') || name.includes('taillight');
            
            if (isGlass) {
              m.color.set(0x1a222b);
              m.metalness = 0.20;
              m.roughness = 0.15;
              m.transparent = true;
              m.opacity = 0.8;
            } else if (isRearLight) {
              m.color.set(0xc62e3a);
              m.emissive.set(0x5c0e16);
              m.emissiveIntensity = 0.5;
            } else if (isWheel) {
              m.color.set(0x171b20);
              m.roughness = 0.68;
            } else {
              m.color.set(0x9ca3af); // The exact UI silver we picked
              m.metalness = 0.15;
              m.roughness = 0.55;
            }
            return m;
          };

          child.material = Array.isArray(material) ? material.map(recolor) : recolor(material);
        });

        const box = new THREE.Box3().setFromObject(source);
        const center = box.getCenter(new THREE.Vector3());
        
        // Center it
        source.position.set(-center.x, -box.min.y, -center.z);
        
        // The GLB is quite large originally (38 units long). We want it to fit nicely.
        const size = box.getSize(new THREE.Vector3());
        const length = Math.max(size.z, 0.001);
        const targetLength = 15; // Arbitrary showcase size
        const scale = targetLength / length;
        
        const orientationRoot = new THREE.Group();
        orientationRoot.add(source);
        // Correct GLB orientation (same as map)
        orientationRoot.rotation.set(Math.PI / 2, Math.PI, 0, 'XYZ');
        
        vehicleGroup.add(orientationRoot);
        vehicleGroup.scale.setScalar(scale);
        
        // Put the vehicle slightly lower in the frame
        vehicleGroup.position.y = -2;
      }
    );

    camera.lookAt(0, 0, 0);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      vehicleGroup.rotation.y += 0.003; // Slow rotation
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const Card = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={cn("glass-panel-elevated p-6 rounded-2xl border border-border backdrop-blur-md flex flex-col", className)}>
      <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-6 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
        {title}
      </h3>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  const StatusRow = ({ label, value, status }: { label: string, value?: string, status?: 'nominal' | 'warning' | 'error' | 'active' }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-primary-muted">{label}</span>
      <div className="flex items-center gap-3">
        {value && <span className="font-semibold text-primary">{value}</span>}
        {status && (
          <span className={cn(
            "text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase",
            status === 'nominal' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
            status === 'active' ? "bg-accent/10 text-accent border border-accent/20" :
            status === 'warning' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
            "bg-red-500/10 text-red-500 border border-red-500/20"
          )}>
            {status === 'nominal' ? 'NOMINAL' : status === 'active' ? 'ACTIVE' : status}
          </span>
        )}
      </div>
    </div>
  );

  const SensorRow = ({ label, ratio, status }: { label: string, ratio: string, status: string }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-primary-muted">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-primary/80">{ratio}</span>
        <span className={cn("text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase", 
          status === 'ONLINE' || status === 'CONNECTED' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {status}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Car className="w-8 h-8 text-accent" />
              Vehicle Command Center
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Autonomous Fleet · Unit 042</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light tracking-tight text-accent">KOENIGSEGG</div>
            <div className="text-[10px] font-bold tracking-widest text-primary-muted mt-1 uppercase">Jesko Absolut - Custom</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[700px]">
          
          {/* Left Column: 3D View */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass-panel rounded-2xl border border-border/60 relative overflow-hidden flex-1 group">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] opacity-30" />
              
              <div ref={mountRef} className="absolute inset-0 z-10" />
              
              {/* Overlay UI on 3D View */}
              <div className="absolute top-4 left-4 z-20">
                <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-border/50 backdrop-blur-md flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Live Telemetry</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] font-mono text-primary-muted tracking-widest">
                  X: 0.00 Y: 0.00 Z: 0.00<br/>
                  PITCH: 0.0° ROLL: 0.0° YAW: 42.1°
                </div>
                <div className="text-[10px] font-bold tracking-widest text-primary-muted">
                  3D VISUALIZATION ENGINE
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status Panels */}
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto hide-scrollbar">
            
            {/* VEHICLE STATUS */}
            <Card title="Vehicle Status">
              <StatusRow label="Drive System" status="nominal" />
              <StatusRow label="Autonomous System" status="active" />
              <StatusRow label="Battery" value="78%" />
              <StatusRow label="Range" value="312 km" />
              <StatusRow label="Speed" value="0 km/h" />
            </Card>

            {/* SENSOR NETWORK */}
            <Card title="Sensor Network">
              <SensorRow label="LiDAR Array" ratio="4 / 4" status="ONLINE" />
              <SensorRow label="Vision Cameras" ratio="8 / 8" status="ONLINE" />
              <SensorRow label="Radar System" ratio="5 / 5" status="ONLINE" />
              <SensorRow label="GPS Receiver" ratio="1 / 1" status="CONNECTED" />
              <SensorRow label="IMU & Odometry" ratio="2 / 2" status="ONLINE" />
            </Card>

            {/* POWERTRAIN */}
            <Card title="Powertrain">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 p-4 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 text-primary-muted mb-2">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Motor Temp</span>
                  </div>
                  <div className="text-xl font-semibold">68°C</div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 text-primary-muted mb-2">
                    <Battery className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Bat Temp</span>
                  </div>
                  <div className="text-xl font-semibold">34°C</div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 text-primary-muted mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Output</span>
                  </div>
                  <div className="text-xl font-semibold">12.4 <span className="text-xs text-primary-muted font-medium">kW</span></div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 text-primary-muted mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Efficiency</span>
                  </div>
                  <div className="text-xl font-semibold">14.2 <span className="text-xs text-primary-muted font-medium">kWh/100km</span></div>
                </div>
              </div>
            </Card>

            {/* SAFETY */}
            <Card title="Safety Systems" className="mb-6">
              <StatusRow label="Brake System" status="nominal" />
              <StatusRow label="Steering Actuators" status="nominal" />
              <StatusRow label="Airbags & Restraints" status="nominal" />
              <StatusRow label="Emergency Cutoff" status="nominal" />
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};
