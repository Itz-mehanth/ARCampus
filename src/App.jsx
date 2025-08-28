import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

/**
 * College WebAR Starter - Fixed Version
 * - Tech: React, @react-three/fiber, @react-three/drei
 * - Goals: No-install WebAR simulation, useful campus modules, runs on all devices
 *
 * Features in this starter:
 * 1) Landing UI with module cards
 * 2) 3D Scene with click-to-place objects (WebAR simulation)
 * 3) Simple module presets (Campus Nav Arrow, Notice Card, Virtual Tree)
 * 4) In-memory persistence (placed items saved during session)
 * 5) Graceful fallback with OrbitControls for interaction
 */

// ---------- In-memory storage (replacing localStorage) ----------
const sessionStorage = {};
const saveState = (key, data) => sessionStorage[key] = data;
const loadState = (key, fallback) => sessionStorage[key] ?? fallback;

// ---------- Basic 3D Primitives for Modules ----------
function CampusArrow(props) {
  // Simple nav arrow: cone on a box base
  return (
    <group {...props}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.1, 0.25]} />
        <meshStandardMaterial color="#c4b5fd" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.12, 0.3, 24]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
    </group>
  );
}

function NoticeCard({ title = "Event", subtitle = "Tap for details", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.22, 0.02]} />
        <meshStandardMaterial color="#7dd3fc" />
      </mesh>
      <Html center distanceFactor={6} transform position={[0, 0, 0.015]}
        style={{ width: 220, textAlign: "center", fontFamily: "Inter, system-ui" }}>
        <div className="rounded-2xl shadow p-2 bg-white/90 border">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-600">{subtitle}</div>
        </div>
      </Html>
    </group>
  );
}

function VirtualTree(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 12]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>
    </group>
  );
}

// ---------- Click-to-place behavior ----------
function ClickToPlace({ onPlace, moduleType, children }) {
  const handleClick = (event) => {
    event.stopPropagation();
    if (event.point) {
      onPlace(event.point);
    }
  };

  return (
    <mesh 
      position={[0, -0.1, 0]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial transparent opacity={0} />
      {children}
    </mesh>
  );
}

// ---------- Ground Plane ----------
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#f5f5f5" />
    </mesh>
  );
}

// ---------- Scene Shell ----------
function ARScene({ moduleKey, moduleType, setPlaced, placed }) {
  const handlePlace = (position) => {
    const item = { 
      id: crypto.randomUUID(), 
      type: moduleType, 
      x: position.x, 
      y: position.y + 0.1, // Slight elevation
      z: position.z 
    };
    const next = [...placed, item];
    setPlaced(next);
    saveState(moduleKey, next);
  };

  return (
    <div className="relative h-[70vh] rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-b from-sky-50 to-blue-100">
      <div className="absolute z-10 right-3 top-3 rounded-2xl px-4 py-2 bg-black text-white text-sm shadow">
        WebAR Simulation
      </div>
      
      <Canvas shadows camera={{ fov: 60, position: [3, 2, 3] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        
        <Ground />
        <ClickToPlace onPlace={handlePlace} moduleType={moduleType} />
        
        {/* Placed items */}
        {placed.map((p) => {
          const pos = [p.x, p.y, p.z];
          const common = { position: pos };
          if (p.type === "arrow") return <CampusArrow key={p.id} {...common} />;
          if (p.type === "notice") return <NoticeCard key={p.id} title="Club Meet" subtitle="5 PM, CSE Block" {...common} />;
          if (p.type === "tree") return <VirtualTree key={p.id} {...common} />;
          return null;
        })}

        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>

      {/* Instructions */}
      <div className="absolute left-3 bottom-3 z-10">
        <div className="rounded-2xl px-3 py-2 text-xs bg-white/90 shadow border border-gray-200">
          <div className="font-semibold text-gray-900">Click ground to place</div>
          <div className="text-gray-600">Module: {moduleType}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- UI Components ----------
const MODULES = [
  { key: "module_arrow", type: "arrow", title: "AR Campus Nav", desc: "Place navigation arrows to guide students." },
  { key: "module_notice", type: "notice", title: "AR Notice Board", desc: "Pin floating announcements anywhere." },
  { key: "module_tree", type: "tree", title: "Virtual Garden", desc: "Plant virtual trees tied to achievements." },
];

function Header() {
  return (
    <header className="max-w-6xl mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center">
          <span className="text-white font-bold text-lg">AR</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus AR</h1>
          <p className="text-sm text-gray-600">Bring AR to every student — no app required.</p>
        </div>
      </div>
    </header>
  );
}

function ModuleCard({ m, active, onSelect, onClear }) {
  return (
    <button 
      onClick={onSelect} 
      className={`text-left rounded-2xl p-4 border shadow-sm w-full transition-all ${
        active 
          ? "ring-2 ring-black bg-gray-50" 
          : "hover:shadow-md hover:border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{m.title}</div>
          <div className="text-sm text-gray-600">{m.desc}</div>
        </div>
        {active && (
          <div 
            onClick={(e) => { e.stopPropagation(); onClear?.(); }} 
            className="text-xs border rounded-xl px-2 py-1 hover:bg-gray-100 text-gray-700 cursor-pointer select-none"
          >
            Clear
          </div>
        )}
      </div>
    </button>
  );
}

export default function App() {
  const [selected, setSelected] = useState(MODULES[0]);
  const [placed, setPlaced] = useState(() => loadState(selected.key, []));

  useEffect(() => {
    setPlaced(loadState(selected.key, []));
  }, [selected?.key]);

  const onClear = () => { 
    setPlaced([]); 
    saveState(selected.key, []); 
  };

  const handleExport = () => {
    const data = JSON.stringify(placed, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      alert("Placement data copied to clipboard!");
    }).catch(() => {
      prompt("Copy this placement data:", data);
    });
  };

  const handleImport = () => {
    const text = prompt("Paste placement JSON:");
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      setPlaced(parsed);
      saveState(selected.key, parsed);
      alert("Placements imported successfully!");
    } catch {
      alert("Invalid JSON format");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <section className="grid md:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <ModuleCard 
              key={m.key} 
              m={m} 
              active={m.key === selected.key} 
              onSelect={() => setSelected(m)} 
              onClear={onClear} 
            />
          ))}
        </section>

        <section className="mt-6">
          <div className="rounded-3xl p-4 md:p-6 bg-white border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600">Active Module</div>
                <div className="text-xl font-semibold text-gray-900">{selected.title}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="border rounded-xl px-3 py-2 text-sm hover:bg-gray-50 text-gray-700" 
                  onClick={handleExport}
                >
                  Export
                </button>
                <button 
                  className="border rounded-xl px-3 py-2 text-sm hover:bg-gray-50 text-gray-700" 
                  onClick={handleImport}
                >
                  Import
                </button>
              </div>
            </div>
            
            <ARScene 
              moduleKey={selected.key} 
              moduleType={selected.type} 
              placed={placed} 
              setPlaced={setPlaced} 
            />
            
            <p className="text-xs text-gray-600 mt-3">
              Click anywhere on the ground plane to place items. Use mouse to orbit around the scene.
            </p>
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 bg-white border">
            <h3 className="font-semibold mb-1 text-gray-900">QR Triggers (next step)</h3>
            <p className="text-sm text-gray-600">Generate QR codes for each module route, stick them across campus to launch specific AR flows instantly.</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border">
            <h3 className="font-semibold mb-1 text-gray-900">Content Uploads</h3>
            <p className="text-sm text-gray-600">Swap primitives for GLB models via a simple uploader and useGLTF. Compress with meshopt/DRACO.</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border">
            <h3 className="font-semibold mb-1 text-gray-900">PWA + Offline</h3>
            <p className="text-sm text-gray-600">Add a service worker and manifest to make it installable and cache core assets for spotty campus Wi‑Fi.</p>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 pb-4">
        Built with React • R3F • drei
      </footer>
    </div>
  );
}