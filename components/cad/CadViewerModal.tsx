
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CadData, CadViewerTool, CadMeasurement, FoundryState, FoundryCadResult } from '../../types';
import { CadViewerSidebar } from './CadComponentList';
import { CadViewerToolbar } from './CadViewerToolbar';
import { FoundryParamPanel } from '../foundry/FoundryParamPanel';
import { MATERIAL_LIBRARY } from '../../constants/materialLibrary';
import { useWebXR } from '../../hooks/useWebXR';
import { AetheriumIcon } from '../icons/AetheriumIcon';

interface CadViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadData: CadData;
  isViewer: boolean;
  foundryResult?: FoundryCadResult | null;
  onAddSnapshot?: (dataUrl: string, viewName: string) => void;
  physicsResult?: any | null;
  runPhysicsValidation?: (cadData: CadData, envId: string) => Promise<void>;
  isPhysicsActive?: boolean;
}

/**
 * Maps a stress magnitude to a heatmap color range.
 * 0.0 = Cyber Cyan (Safe)
 * 1.0 = Breach Red (Failure)
 */
const getStressColor = (stress: number) => {
    const color = new THREE.Color();
    color.setHSL((180 - (Math.min(1, stress) * 180)) / 360, 1, 0.5);
    return color;
};

export const CadViewerModal: React.FC<CadViewerModalProps> = ({ 
    isOpen, onClose, cadData, isViewer, foundryResult, onAddSnapshot, 
    physicsResult, runPhysicsValidation, isPhysicsActive 
}) => {
    const [activeTool, setActiveTool] = useState<CadViewerTool>('select');
    const onToolChange = useCallback((tool: CadViewerTool) => setActiveTool(tool), []);

    const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(cadData.components.map(c => c.name)));
    const [selectedComponentName, setSelectedComponentName] = useState<string | null>(null);

    const [isExploded, setIsExploded] = useState(false);
    const [explodeFactor, setExplodeFactor] = useState(0.5);
    const [isSectionEnabled, setIsSectionEnabled] = useState(false);
    const [sectionPlaneConfig, setSectionPlaneConfig] = useState({ axis: 'x', constant: 0, inverted: false });
    const [isAutoRotate, setIsAutoRotate] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    
    const [foundryState, setFoundryState] = useState<FoundryState>({
        selectedMaterial: MATERIAL_LIBRARY.find(m => m.name === foundryResult?.metadata.material) || MATERIAL_LIBRARY[0],
        parameters: foundryResult?.scad_params.parameters || { Length: 100, Width: 50, Thickness: 10 },
        scadString: foundryResult?.scad_params.raw_scad || "// NAL v12.1 Auto-Generated SCAD\ncube([100, 50, 10]);",
        safetyFactor: 3.2,
        isLocked: false,
        jurisdiction: 'USPTO'
    });

    const mountRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<{
        scene?: THREE.Scene,
        camera?: THREE.PerspectiveCamera,
        renderer?: THREE.WebGLRenderer,
        controls?: OrbitControls,
        meshMap: Map<string, THREE.Mesh>,
        gridHelper?: THREE.GridHelper,
        animationFrameId?: number,
    }>({ meshMap: new Map() });

    const { isXRSupported, isXRSessionActive, enterImmersiveFoundry } = useWebXR(null);

    /**
     * HOLODECK: Step 4 - High-Fidelity Physics Heat Map
     * Recolors the vertex buffer based on Genesis MPM telemetry.
     */
    useEffect(() => {
        const t = threeRef.current;
        if (!t.scene) return;

        t.meshMap.forEach((mesh) => {
            const geometry = mesh.geometry as THREE.BufferGeometry;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            
            if (physicsResult && physicsResult.failure_coordinates) {
                const posAttr = geometry.getAttribute('position');
                const colors = [];
                const vertexPos = new THREE.Vector3();
                
                for (let i = 0; i < posAttr.count; i++) {
                    vertexPos.fromBufferAttribute(posAttr, i);
                    mesh.localToWorld(vertexPos);
                    
                    let maxInfluence = 0;
                    physicsResult.failure_coordinates.forEach((fp: any) => {
                        const failPoint = new THREE.Vector3(fp.x, fp.y, fp.z);
                        const dist = vertexPos.distanceTo(failPoint);
                        // Radius of influence for failure visualization
                        const influence = Math.max(0, 1 - (dist / 120));
                        if (influence > maxInfluence) maxInfluence = influence;
                    });
                    
                    const stressColor = getStressColor(maxInfluence);
                    colors.push(stressColor.r, stressColor.g, stressColor.b);
                }
                
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                mat.vertexColors = true;
                mat.color.setHex(0xffffff); // Neutral base
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.needsUpdate = true;
            } else {
                geometry.deleteAttribute('color');
                mat.vertexColors = false;
                mat.color.setHex(0x06b6d4);
                mat.opacity = 0.9;
                mat.transparent = true;
                mat.needsUpdate = true;
            }
        });
    }, [physicsResult, cadData.components]);

    const handleCaptureView = useCallback((view: 'Top' | 'Front' | 'Side' | 'Isometric') => {
        const t = threeRef.current;
        if (!t.renderer || !t.camera || !t.scene || !onAddSnapshot) return;

        const distance = 400;
        switch(view) {
            case 'Top': t.camera.position.set(0, distance, 0); break;
            case 'Front': t.camera.position.set(0, 0, distance); break;
            case 'Side': t.camera.position.set(distance, 0, 0); break;
            case 'Isometric': t.camera.position.set(distance*0.7, distance*0.7, distance*0.7); break;
        }
        t.camera.lookAt(0,0,0);
        t.controls?.update();

        t.renderer.render(t.scene, t.camera);
        const dataUrl = t.renderer.domElement.toDataURL("image/png");
        onAddSnapshot(dataUrl, `${view} View Capture`);
    }, [onAddSnapshot]);

    useEffect(() => {
        if (!isOpen || !mountRef.current) return;
        const currentMount = mountRef.current;
        const t = threeRef.current;

        t.scene = new THREE.Scene();
        t.scene.background = new THREE.Color(0x030712); 
        t.camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
        t.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        t.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        t.renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(t.renderer.domElement);
        
        t.controls = new OrbitControls(t.camera, t.renderer.domElement);
        t.controls.enableDamping = true;

        t.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 100);
        t.scene.add(dirLight);

        const group = new THREE.Group();
        t.meshMap.clear();
        
        cadData.components.forEach((comp) => {
            // High segment count for high-fidelity vertex gradients
            const geometry = new THREE.BoxGeometry(comp.dimensions.x, comp.dimensions.y, comp.dimensions.z, 16, 16, 16);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x06b6d4, 
                transparent: true, 
                opacity: 0.9,
                metalness: 0.8,
                roughness: 0.2
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
            mesh.name = comp.name;
            group.add(mesh);
            t.meshMap.set(comp.name, mesh);
        });
        
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);
        t.camera.position.set(300, 300, 300);
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
            if (currentMount && t.renderer) currentMount.removeChild(t.renderer.domElement);
        };
    }, [isOpen, cadData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/95 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-[98vw] h-[95vh] flex flex-col border border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-cyan/20 rounded-xl flex items-center justify-center text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-brand-light uppercase tracking-tighter italic leading-none">Engineering Foundry: {cadData.assemblyName}</h2>
                            {physicsResult ? (
                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] mt-1 animate-pulse">
                                    Reality Mode: 4D Stress Heat Map Active
                                </p>
                            ) : (
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
                                    Status: Analytical Standby // Engine: Genesis v2.4 Fork
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {runPhysicsValidation && (
                            <button 
                                onClick={() => runPhysicsValidation(cadData, 'SAA_LEO_ORBIT')}
                                disabled={isPhysicsActive || isViewer}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${isPhysicsActive ? 'bg-yellow-900/20 text-yellow-500 border-yellow-500/50 cursor-wait' : 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan hover:text-gray-900'}`}
                            >
                                <svg className={`w-4 h-4 ${isPhysicsActive ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                </svg>
                                {isPhysicsActive ? 'Simulating...' : 'Verify Physics'}
                            </button>
                        )}
                        <div className="h-8 w-px bg-gray-800 mx-2" />
                        {isXRSupported && (
                             <button 
                                onClick={() => enterImmersiveFoundry(threeRef.current.renderer || null)}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 ${isXRSessionActive ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white text-gray-900 border-white hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.25)]'}`}
                            >
                                <AetheriumIcon className="w-5 h-5" />
                                {isXRSessionActive ? 'Immersed' : 'Enter Holodeck'}
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-all transform hover:rotate-90 text-4xl font-bold leading-none ml-4">&times;</button>
                    </div>
                </header>
                
                <main className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 relative">
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
                         
                         <div className="absolute bottom-8 right-8 flex flex-col gap-3">
                             <button onClick={() => handleCaptureView('Top')} className="px-5 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-xl text-[10px] font-black uppercase text-gray-300 hover:bg-brand-cyan hover:text-gray-900 transition-all shadow-xl">Snap Top View</button>
                             <button onClick={() => handleCaptureView('Isometric')} className="px-5 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-xl text-[10px] font-black uppercase text-gray-300 hover:bg-brand-cyan hover:text-gray-900 transition-all shadow-xl">Snap Isometric</button>
                         </div>
                    </div>
                    
                    <div className="flex flex-col border-l border-gray-800 w-96 bg-gray-900/30 backdrop-blur-xl overflow-y-auto shadow-2xl">
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
                            onClearMeasurements={() => {}} 
                            units={cadData.units} 
                            activeTool={activeTool} 
                            isMeasuring={false} 
                        />
                        <FoundryParamPanel state={foundryState} onUpdate={(u) => setFoundryState(s => ({ ...s, ...u }))} isViewer={isViewer} />
                    </div>
                </main>
            </div>
        </div>
    );
};
