import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCw, ZoomIn, Info, ShieldAlert, Cpu } from 'lucide-react';

interface Subsystem {
  id: string;
  name: string;
  position: [number, number, number];
  status: 'nominal' | 'warning' | 'critical';
  telemetry: string;
  metric: string;
}

const SUBSYSTEMS: Subsystem[] = [
  {
    id: 'spindle',
    name: 'Main Spindle & Rotary Drive',
    position: [0, 0.4, 0.3],
    status: 'nominal',
    telemetry: 'RPM: 1540 | Torque: 42.1 Nm',
    metric: 'Mechanical Load Nominal'
  },
  {
    id: 'thermal',
    name: 'Thermal Dissipation & Radiator Block',
    position: [0, 0.3, -1.2],
    status: 'warning',
    telemetry: 'Delta T: 10.4 K | Process Temp: 309.8 K',
    metric: 'Elevated Gradient'
  },
  {
    id: 'turret',
    name: 'Electro-Mechanical Turret Traverse',
    position: [0, 0.9, 0],
    status: 'nominal',
    telemetry: 'Azimuth: 142.5° | Power Draw: 6.8 kW',
    metric: 'Guideway Clear'
  },
  {
    id: 'tracks',
    name: 'Track Sprocket & Final Drives',
    position: [1.3, -0.4, 0.2],
    status: 'critical',
    telemetry: 'Tool/Pin Wear: 218 min | Vibration: +2.8g',
    metric: 'Severe Wear Threshold Exceeded'
  },
  {
    id: 'armorsensor',
    name: 'Hull Stress & Dynamic Telemetry Array',
    position: [-1.3, 0.1, 0],
    status: 'nominal',
    telemetry: 'Strain: 145 µε | Ambient Temp: 298.2 K',
    metric: 'Calibrated'
  }
];

export const Vehicle3DViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(SUBSYSTEMS[0]);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070b12);
    scene.fog = new THREE.FogExp2(0x070b12, 0.08);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.5);
    camera.lookAt(0, 0.3, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x10b981, 1.2);
    backLight.position.set(-5, 4, -5);
    scene.add(backLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(12, 24, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -0.85;
    scene.add(gridHelper);

    // Vehicle Group
    const vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);

    // Common Armor Materials
    materialsRef.current = [];
    const createArmorMat = (color: number, roughness = 0.35, metalness = 0.75) => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        wireframe: wireframeMode,
      });
      materialsRef.current.push(mat);
      return mat;
    };

    const mainArmorMat = createArmorMat(0x172336, 0.4, 0.8);
    const darkArmorMat = createArmorMat(0x0c1420, 0.3, 0.9);
    const cyanAccentMat = createArmorMat(0x00f0ff, 0.2, 0.9);
    const orangeAccentMat = createArmorMat(0xf59e0b, 0.3, 0.7);

    // 1. Lower Chassis Hull
    const hullGeo = new THREE.BoxGeometry(2.4, 0.6, 3.8);
    const hullMesh = new THREE.Mesh(hullGeo, mainArmorMat);
    hullMesh.position.y = -0.2;
    vehicleGroup.add(hullMesh);

    // 2. Sloped Upper Glacis Armor
    const glacisGeo = new THREE.CylinderGeometry(1.0, 1.3, 3.2, 4);
    const glacisMesh = new THREE.Mesh(glacisGeo, darkArmorMat);
    glacisMesh.rotation.y = Math.PI / 4;
    glacisMesh.rotation.x = Math.PI / 2;
    glacisMesh.position.set(0, 0.2, 0.2);
    glacisMesh.scale.set(0.9, 1, 0.5);
    vehicleGroup.add(glacisMesh);

    // 3. Rotating Turret
    const turretGeo = new THREE.BoxGeometry(1.6, 0.5, 1.8);
    const turretMesh = new THREE.Mesh(turretGeo, mainArmorMat);
    turretMesh.position.set(0, 0.65, 0);
    vehicleGroup.add(turretMesh);

    // 4. Heavy Spindle / Main Cannon Assembly
    const cannonBreech = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    const breechMesh = new THREE.Mesh(cannonBreech, darkArmorMat);
    breechMesh.position.set(0, 0.65, 1.1);
    vehicleGroup.add(breechMesh);

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.6, 16);
    const barrelMesh = new THREE.Mesh(barrelGeo, cyanAccentMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.65, 2.5);
    vehicleGroup.add(barrelMesh);

    const muzzleBreak = new THREE.CylinderGeometry(0.14, 0.14, 0.4, 8);
    const muzzleMesh = new THREE.Mesh(muzzleBreak, darkArmorMat);
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.set(0, 0.65, 3.7);
    vehicleGroup.add(muzzleMesh);

    // 5. Dual Track Assemblies (Left and Right)
    [-1.3, 1.3].forEach((xPos) => {
      // Track Skirt
      const skirtGeo = new THREE.BoxGeometry(0.3, 0.5, 4.0);
      const skirtMesh = new THREE.Mesh(skirtGeo, mainArmorMat);
      skirtMesh.position.set(xPos, -0.2, 0);
      vehicleGroup.add(skirtMesh);

      // Road Wheels / Bogies
      for (let z = -1.5; z <= 1.5; z += 0.6) {
        const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.25, 16);
        const wheelMesh = new THREE.Mesh(wheelGeo, darkArmorMat);
        wheelMesh.rotation.z = Math.PI / 2;
        wheelMesh.position.set(xPos, -0.55, z);
        vehicleGroup.add(wheelMesh);
      }
    });

    // 6. Engine Exhaust & Radiator Block
    const exhaustGeo = new THREE.BoxGeometry(1.4, 0.35, 0.8);
    const exhaustMesh = new THREE.Mesh(exhaustGeo, orangeAccentMat);
    exhaustMesh.position.set(0, 0.4, -1.4);
    vehicleGroup.add(exhaustMesh);

    // Subsystem Interactive Markers (Pulsing Glowing Spheres)
    const markerGroup = new THREE.Group();
    vehicleGroup.add(markerGroup);

    SUBSYSTEMS.forEach((sub) => {
      let markerColor = 0x10b981; // Green
      if (sub.status === 'warning') markerColor = 0xf59e0b;
      if (sub.status === 'critical') markerColor = 0xef4444;

      const markerSphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: markerColor,
        wireframe: false,
      });
      const markerMesh = new THREE.Mesh(markerSphereGeo, markerMat);
      markerMesh.position.set(...sub.position);
      markerMesh.userData = { id: sub.id };
      markerGroup.add(markerMesh);

      // Pulsing outer halo
      const haloGeo = new THREE.RingGeometry(0.2, 0.26, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: markerColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(...sub.position);
      haloMesh.rotation.x = Math.PI / 2;
      markerGroup.add(haloMesh);
    });

    // Mouse Interaction / Drag Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      vehicleGroup.rotation.y += deltaX * 0.01;
      vehicleGroup.rotation.x = Math.max(-0.4, Math.min(0.6, vehicleGroup.rotation.x + deltaY * 0.005));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        vehicleGroup.rotation.y += 0.004;
      }

      // Pulse the markers
      const scale = 1 + 0.15 * Math.sin(elapsedTime * 3);
      markerGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          child.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Sync wireframe mode change
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      mat.wireframe = wireframeMode;
    });
  }, [wireframeMode]);

  return (
    <div className="hud-panel rounded-xl overflow-hidden border border-slate-800 relative flex flex-col h-[480px] lg:h-[520px]">
      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full flex-1 relative cursor-grab active:cursor-grabbing bg-radial from-[#0e1726] to-[#070b12]"
      >
        {/* HUD Top Bar Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30">
              3D DIGITAL TWIN • ARMORED VEHICLE IFV-8
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`px-2.5 py-1 text-xs font-mono-code rounded border transition-colors flex items-center gap-1 ${
                wireframeMode
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle HUD Wireframe telemetry mode"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{wireframeMode ? 'SOLID' : 'WIREFRAME'}</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded border transition-colors ${
                autoRotate
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto Rotation"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tactical Crosshair watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <div className="w-48 h-48 rounded-full border border-cyan-400 border-dashed" />
          <div className="w-72 h-72 rounded-full border border-cyan-400" />
        </div>
      </div>

      {/* Subsystems Telemetry Drawer / Selector */}
      <div className="bg-[#0b111c] border-t border-slate-800 p-3 lg:p-4 select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono-code uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Telemetry Sensor Nodes ({SUBSYSTEMS.length})
          </span>
          <span className="text-[11px] font-mono-code text-slate-500">
            Click node to view diagnostics
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SUBSYSTEMS.map((sub) => {
            const isSelected = selectedSubsystem?.id === sub.id;
            let statusBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (sub.status === 'warning') statusBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            if (sub.status === 'critical') statusBadge = 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubsystem(sub)}
                className={`p-2 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] uppercase font-mono-code px-1.5 py-0.2 rounded border ${statusBadge}`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {sub.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono-code truncate mt-0.5">
                  {sub.telemetry}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Sensor Node Detail Strip */}
        {selectedSubsystem && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-300 font-mono-code uppercase">
                [{selectedSubsystem.name}]:
              </span>
              <span className="text-slate-300 font-mono-code">
                {selectedSubsystem.telemetry}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Diagnosis:</span>
              <span className={`font-mono-code font-bold uppercase ${
                selectedSubsystem.status === 'critical' ? 'text-red-400' :
                selectedSubsystem.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {selectedSubsystem.metric}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
