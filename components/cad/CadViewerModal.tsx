
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CadData, CadViewerTool, CadMeasurement, FoundryState, FoundryCadResult } from '../../types';
import { CadViewerSidebar } from './CadComponentList';
import { CadViewerToolbar } from './CadViewerToolbar';
import { FoundryParamPanel } from '../foundry/FoundryParamPanel';
import { MaterialComparisonModal } from '../foundry/MaterialComparisonModal';
import { MATERIAL_LIBRARY } from '../../constants/materialLibrary';
import { useDebounce } from '../../hooks/useDebounce';

interface CadViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadData: CadData;
  isViewer: boolean;
  foundryResult?: FoundryCadResult | null;
  onAddSnapshot?: (dataUrl: string, viewName: string) => void;
}

const SNAP_RADIUS = 5;

const getStressColor = (stress: number) => {
    const color = new THREE.Color();
    color.setHSL(0.7 * (1 - stress), 1, 0.5);
    return color;
};

export const CadViewerModal: React.FC<CadViewerModalProps> = ({ isOpen, onClose, cadData, isViewer, foundryResult, onAddSnapshot }) => {
    const [activeTool, setActiveTool] = useState<CadViewerTool>('select');
    const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(cadData.components.map(c => c.name)));
    const [selectedComponentName, setSelectedComponentName] = useState<string | null>(null);
    const [showScad, setShowScad] = useState(false);

    const [isExploded, setIsExploded] = useState(false);
    const [explodeFactor, setExplodeFactor] = useState(0.5);
    const [isSectionEnabled, setIsSectionEnabled] = useState(false);
    const [sectionPlaneConfig, setSectionPlaneConfig] = useState({ axis: 'x', constant: 0, inverted: false });
    const [isAutoRotate, setIsAutoRotate] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);
    
    const [foundryState, setFoundryState] = useState<FoundryState>({
        selectedMaterial: MATERIAL_LIBRARY.find(m => m.name === foundryResult?.metadata.material) || MATERIAL_LIBRARY[0],
        parameters: foundryResult?.scad_params.parameters || { Length: 100, Width: 50, Thickness: 10 },
        scadString: foundryResult?.scad_params.raw_scad || "// NAL v12.1 Auto-Generated SCAD\ncube([100, 50, 10]);",
        safetyFactor: 3.2,
        isLocked: false,
        jurisdiction: 'USPTO'
    });

    const debouncedParameters = useDebounce(foundryState.parameters, 500);

    const [measurements, setMeasurements] = useState<(CadMeasurement & { line: THREE.Line; label: HTMLDivElement })[]>([]);
    const isMeasuringRef = useRef(false);
    const startPointRef = useRef<{ point: THREE.Vector3; type: 'vertex' | 'surface' } | null>(null);
    const tempLabelRef = useRef<HTMLDivElement | null>(null);

    const mountRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<{
        scene?: THREE.Scene,
        camera?: THREE.PerspectiveCamera,
        renderer?: THREE.WebGLRenderer,
        controls?: OrbitControls,
        meshMap: Map<string, THREE.Mesh>,
        originalPositions: Map<string, THREE.Vector3>,
        clippingPlanes: THREE.Plane[],
        planeHelper?: THREE.PlaneHelper,
        gridHelper?: THREE.GridHelper,
        snapIndicator?: THREE.Mesh,
        previewLine?: THREE.Line,
        animationFrameId?: number,
    }>({ meshMap: new Map(), originalPositions: new Map(), clippingPlanes: [] });

    const handleResetMeasurements = useCallback(() => {
        measurements.forEach(m => {
            threeRef.current.scene?.remove(m.line);
            m.line.geometry.dispose();
            (m.line.material as THREE.Material).dispose();
            if (m.label.parentElement) {
                m.label.parentElement.removeChild(m.label);
            }
        });
        setMeasurements([]);
        startPointRef.current = null;
        isMeasuringRef.current = false;
        if (threeRef.current.previewLine) threeRef.current.previewLine.visible = false;
        if (tempLabelRef.current) tempLabelRef.current.style.display = 'none';
    }, [measurements]);

    const onToolChange = (tool: CadViewerTool) => {
        if (activeTool === 'measure' && tool !== 'measure') {
            handleResetMeasurements(); 
        }
        setActiveTool(tool);
    };

    /**
     * SOVEREIGN DRAWING ENGINE: Local Snapshot Trigger
     * Captures the WebGL buffer for a specific orthographic view.
     */
    const handleCaptureView = useCallback((view: 'Top' | 'Front' | 'Side' | 'Isometric') => {
        const t = threeRef.current;
        if (!t.renderer || !t.camera || !t.scene || !onAddSnapshot) return;

        // 1. Temporarily disable helpers for clean drawing
        const gridPrev = t.gridHelper?.visible;
        if (t.gridHelper) t.gridHelper.visible = false;

        // 2. Position camera for the requested view
        const distance = 400; // Calibrated for typical assemblies
        switch(view) {
            case 'Top': t.camera.position.set(0, distance, 0); break;
            case 'Front': t.camera.position.set(0, 0, distance); break;
            case 'Side': t.camera.position.set(distance, 0, 0); break;
            case 'Isometric': t.camera.position.set(distance*0.7, distance*0.7, distance*0.7); break;
        }
        t.camera.lookAt(0,0,0);
        t.controls?.update();

        // 3. Render and Snap
        t.renderer.render(t.scene, t.camera);
        const dataUrl = t.renderer.domElement.toDataURL("image/png");

        // 4. Restore state
        if (t.gridHelper) t.gridHelper.visible = !!gridPrev;
        
        // 5. Emit to IP Ledger/Visual folder
        onAddSnapshot(dataUrl, `${view} Orthographic View`);
        
        window.dispatchEvent(new CustomEvent('forge-log', { detail: `[VIS_DOC]: Captured ${view} view from local buffer.` }));
    }, [onAddSnapshot]);

    useEffect(() => {
        const handleOpenComparison = () => setIsComparisonOpen(true);
        window.addEventListener('material-comparison', handleOpenComparison);
        return () => window.removeEventListener('material-comparison', handleOpenComparison);
    }, []);

    useEffect(() => {
        const t = threeRef.current;
        if (!t.scene) return;

        const mainMesh = t.meshMap.get(cadData.components[0]?.name);
        if (mainMesh) {
            const { Length = 100, Width = 50, Thickness = 10 } = foundryState.parameters;
            mainMesh.scale.set(Length / 100, Width / 50, Thickness / 10);
        }
    }, [foundryState.parameters, cadData.components]);

    useEffect(() => {
        const t = threeRef.current;
        if (!t.scene) return;

        const mainMesh = t.meshMap.get(cadData.components[0]?.name);
        if (mainMesh) {
            const { Width = 50, Thickness = 10 } = debouncedParameters;
            const crossSection = (Width || 1) * (Thickness || 1);
            const mockStress = 15000 / (crossSection || 1); 
            const sf = foundryState.selectedMaterial.tensileStrength / mockStress;
            
            setFoundryState(prev => ({ ...prev, safetyFactor: sf }));
            
            const stressRatio = Math.min(1, 1 / sf);
            const stressColor = getStressColor(stressRatio);
            (mainMesh.material as THREE.MeshStandardMaterial).color.copy(stressColor);
            (mainMesh.material as THREE.MeshStandardMaterial).emissive.copy(stressColor).multiplyScalar(0.1);
        }
    }, [debouncedParameters, foundryState.selectedMaterial, cadData.components]);

    useEffect(() => {
        if (!isOpen || !mountRef.current || !labelsRef.current) return;

        const currentMount = mountRef.current;
        const t = threeRef.current;

        t.scene = new THREE.Scene();
        t.scene.background = new THREE.Color(0x0f172a);
        t.scene.fog = new THREE.FogExp2(0x0f172a, 0.001);

        t.camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
        
        t.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        t.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        t.renderer.setPixelRatio(window.devicePixelRatio);
        t.renderer.localClippingEnabled = true;
        t.renderer.shadowMap.enabled = true;
        currentMount.appendChild(t.renderer.domElement);
        
        t.controls = new OrbitControls(t.camera, t.renderer.domElement);
        t.controls.enableDamping = true;
        t.controls.dampingFactor = 0.05;

        t.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(50, 100, 50);
        t.scene.add(dirLight);

        const gridHelper = new THREE.GridHelper(2000, 50, 0x4b5563, 0x1f2937);
        t.gridHelper = gridHelper;
        t.scene.add(gridHelper);

        const group = new THREE.Group();
        t.meshMap.clear();
        t.originalPositions.clear();
        
        cadData.components.forEach((comp, index) => {
            let geometry = new THREE.BoxGeometry(comp.dimensions.x, comp.dimensions.y, comp.dimensions.z);
            const material = new THREE.MeshStandardMaterial({
                color: 0x06b6d4, 
                transparent: true, 
                opacity: 0.9, 
                metalness: 0.2, 
                roughness: 0.5,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
            mesh.name = comp.name;
            
            group.add(mesh);
            t.meshMap.set(comp.name, mesh);
            t.originalPositions.set(comp.name, mesh.position.clone());
        });
        
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const cameraZ = Math.max(maxDim * 2, 100);
        
        t.camera.position.set(cameraZ, cameraZ * 0.8, cameraZ);
        t.controls.target.set(0, 0, 0);
        t.scene.add(group);

        const animate = () => {
            t.animationFrameId = requestAnimationFrame(animate);
            t.controls?.update();
            t.renderer?.render(t.scene!, t.camera!);
        };
        animate();

        return () => {
            if (t.animationFrameId) cancelAnimationFrame(t.animationFrameId);
            t.controls?.dispose();
            t.renderer?.dispose();
            if (currentMount && t.renderer) {
                currentMount.removeChild(t.renderer.domElement);
            }
        };
    }, [isOpen, cadData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 animate-fade-in" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-gray-900 rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col border-2 border-gray-600" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-brand-cyan" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <div>
                            <h2 className="text-xl font-bold text-brand-light leading-none">Engineering Foundry: {cadData.assemblyName}</h2>
                            {foundryResult && <p className="text-[10px] text-brand-cyan uppercase tracking-widest mt-1 font-black">Foundry-Core AI Plugin Active</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowScad(!showScad)}
                            className={`px-3 py-1 text-xs font-black uppercase rounded border transition-all ${showScad ? 'bg-brand-cyan text-gray-900 border-brand-cyan' : 'text-gray-400 border-gray-700 hover:text-brand-light'}`}
                        >
                            {showScad ? 'View Render' : 'View SCAD Source'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold leading-none">&times;</button>
                    </div>
                </header>
                <main className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative">
                        {showScad ? (
                             <div className="absolute inset-0 bg-gray-950 p-6 font-mono text-cyan-500 overflow-auto z-30">
                                 <div className="flex justify-between items-center mb-4 border-b border-cyan-900 pb-2">
                                     <span className="text-xs uppercase font-black tracking-[0.2em]">Deterministic OpenSCAD Ledger</span>
                                     <span className="text-[10px] opacity-50">SHA-256::Verified_Lattice</span>
                                 </div>
                                 <pre className="text-sm leading-relaxed">
                                     <code>{foundryState.scadString}</code>
                                 </pre>
                             </div>
                        ) : null}
                        
                        <CadViewerToolbar
                            activeTool={activeTool}
                            onToolChange={onToolChange}
                            onResetView={() => threeRef.current.controls?.reset()}
                            isExploded={isExploded}
                            onToggleExplode={() => setIsExploded(!isExploded)}
                            isSectionEnabled={isSectionEnabled}
                            onToggleSection={() => setIsSectionEnabled(!isSectionEnabled)}
                            isAutoRotate={isAutoRotate}
                            onToggleAutoRotate={() => setIsAutoRotate(!isAutoRotate)}
                            showGrid={showGrid}
                            onToggleGrid={() => setShowGrid(!showGrid)}
                        />
                         <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                         <div ref={labelsRef} className="absolute top-0 left-0 pointer-events-none" />
                    </div>
                    
                    <div className="flex flex-col border-l border-gray-700 w-80 bg-gray-800/30 overflow-y-auto overflow-x-hidden">
                        <CadViewerSidebar
                            components={cadData.components}
                            visibleIds={visibleIds}
                            selectedComponentName={selectedComponentName}
                            onToggleVisibility={(name) => setVisibleIds(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; })}
                            onSelectComponent={setSelectedComponentName}
                            onToggleAll={(v) => setVisibleIds(v ? new Set(cadData.components.map(c => c.name)) : new Set())}
                            onToggleGroup={(names, v) => setVisibleIds(p => { const n = new Set(p); names.forEach(name => v ? n.add(name) : n.delete(name)); return n; })}
                            isExploded={isExploded}
                            onToggleExplode={() => setIsExploded(!isExploded)}
                            explodeFactor={explodeFactor}
                            onExplodeFactorChange={setExplodeFactor}
                            isSectionEnabled={isSectionEnabled}
                            onToggleSection={() => setIsSectionEnabled(!isSectionEnabled)}
                            sectionPlaneConfig={sectionPlaneConfig}
                            onSectionPlaneConfigChange={setSectionPlaneConfig}
                            measurements={[]}
                            onClearMeasurements={handleResetMeasurements}
                            units={cadData.units}
                            activeTool={activeTool}
                            isMeasuring={isMeasuringRef.current}
                        />

                        {/* Sovereign Drawing Engine Integration */}
                        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                            <h4 className="text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-3">Sovereign Drawing Engine</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => handleCaptureView('Top')}
                                    className="p-2 bg-gray-700 hover:bg-brand-cyan hover:text-gray-900 transition-all rounded text-[9px] font-black uppercase tracking-tighter"
                                >
                                    Snap Top View
                                </button>
                                <button 
                                    onClick={() => handleCaptureView('Front')}
                                    className="p-2 bg-gray-700 hover:bg-brand-cyan hover:text-gray-900 transition-all rounded text-[9px] font-black uppercase tracking-tighter"
                                >
                                    Snap Front View
                                </button>
                                <button 
                                    onClick={() => handleCaptureView('Side')}
                                    className="p-2 bg-gray-700 hover:bg-brand-cyan hover:text-gray-900 transition-all rounded text-[9px] font-black uppercase tracking-tighter"
                                >
                                    Snap Side View
                                </button>
                                <button 
                                    onClick={() => handleCaptureView('Isometric')}
                                    className="p-2 bg-gray-700 hover:bg-brand-cyan hover:text-gray-900 transition-all rounded text-[9px] font-black uppercase tracking-tighter"
                                >
                                    Snap Isometric
                                </button>
                            </div>
                            <p className="text-[8px] text-gray-500 mt-2 text-center uppercase tracking-widest">Maps directly to project visuals</p>
                        </div>
                    </div>

                    <FoundryParamPanel 
                        state={foundryState}
                        onUpdate={(u) => setFoundryState(s => ({ ...s, ...u }))}
                        isViewer={isViewer}
                    />
                </main>
            </div>

            <MaterialComparisonModal 
                isOpen={isComparisonOpen} 
                onClose={() => setIsComparisonOpen(false)} 
                foundryState={foundryState}
            />
        </div>
    );
};
