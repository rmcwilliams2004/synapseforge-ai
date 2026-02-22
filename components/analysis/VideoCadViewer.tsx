import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Square, FastForward, CheckCircle2, Sliders } from 'lucide-react';

export interface CadOperation {
    type: string;
    parameters: any;
}

interface VideoCadViewerProps {
    operations: CadOperation[];
    onComplete?: () => void;
}

export const VideoCadViewer: React.FC<VideoCadViewerProps> = ({ operations: initialOperations, onComplete }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [operations, setOperations] = useState<CadOperation[]>(initialOperations);
    const [showControls, setShowControls] = useState(false);
    
    const threeRef = useRef<{
        scene?: THREE.Scene,
        camera?: THREE.PerspectiveCamera,
        renderer?: THREE.WebGLRenderer,
        controls?: OrbitControls,
        animationFrameId?: number,
        meshGroup?: THREE.Group
    }>({});

    useEffect(() => {
        setOperations(initialOperations);
    }, [initialOperations]);

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;
        const t = threeRef.current;

        t.scene = new THREE.Scene();
        t.scene.background = new THREE.Color(0x020617);
        
        t.camera = new THREE.PerspectiveCamera(65, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
        t.camera.position.set(400, 300, 400);

        t.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        t.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        t.renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(t.renderer.domElement);

        t.controls = new OrbitControls(t.camera, t.renderer.domElement);
        t.controls.enableDamping = true;

        t.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dl = new THREE.DirectionalLight(0xffffff, 1.2);
        dl.position.set(200, 500, 300);
        t.scene.add(dl);

        t.meshGroup = new THREE.Group();
        t.scene.add(t.meshGroup);

        // Add a grid helper
        const gridHelper = new THREE.GridHelper(1000, 20, 0x06b6d4, 0x333333);
        gridHelper.position.y = -150;
        t.scene.add(gridHelper);

        const animate = () => {
            t.animationFrameId = requestAnimationFrame(animate);
            t.controls?.update();
            t.renderer?.render(t.scene!, t.camera!);
        };
        animate();

        return () => {
            if (t.animationFrameId) cancelAnimationFrame(t.animationFrameId);
            t.renderer?.dispose();
            if (currentMount && t.renderer) {
                currentMount.removeChild(t.renderer.domElement);
            }
        };
    }, []);

    // Handle operations animation
    useEffect(() => {
        const t = threeRef.current;
        if (!t.scene || !t.meshGroup) return;

        // Clear existing meshes
        while(t.meshGroup.children.length > 0){ 
            t.meshGroup.remove(t.meshGroup.children[0]); 
        }

        // Rebuild up to current step
        for (let i = 0; i <= currentStep; i++) {
            const op = operations[i];
            if (!op) continue;

            if (op.type === 'sketch_circle') {
                const radius = op.parameters.radius || 150;
                const geometry = new THREE.RingGeometry(Math.max(1, radius - 2), Math.max(2, radius), 64);
                const material = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.x = Math.PI / 2;
                mesh.position.y = -150;
                t.meshGroup.add(mesh);
            } 
            else if (op.type === 'extrude_hull') {
                const depth = op.parameters.depth || 300;
                const radius = operations.find(o => o.type === 'sketch_circle')?.parameters.radius || 150;
                const wallThickness = op.parameters.wall_thickness || 2.5;
                
                const geometry = new THREE.CylinderGeometry(radius, radius, depth, 64);
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0x06b6d4, 
                    transparent: true, 
                    opacity: 0.6,
                    wireframe: false
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = -150 + (depth / 2);
                t.meshGroup.add(mesh);

                // Add lattice structure inside
                const innerRadius = Math.max(1, radius - wallThickness * 4);
                const latticeGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, depth, 16, 10, true);
                const latticeMat = new THREE.MeshStandardMaterial({
                    color: 0x8b5cf6,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8
                });
                const latticeMesh = new THREE.Mesh(latticeGeo, latticeMat);
                latticeMesh.position.y = -150 + (depth / 2);
                t.meshGroup.add(latticeMesh);
            }
        }

    }, [currentStep, operations]);

    // Playback logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && currentStep < operations.length - 1) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= operations.length - 1) {
                        setIsPlaying(false);
                        if (onComplete) onComplete();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1500); // 1.5 seconds per operation
        } else if (currentStep >= operations.length - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, operations.length, onComplete]);

    const handleParameterChange = (opIndex: number, paramName: string, value: number) => {
        setOperations(prev => {
            const newOps = [...prev];
            newOps[opIndex] = {
                ...newOps[opIndex],
                parameters: {
                    ...newOps[opIndex].parameters,
                    [paramName]: value
                }
            };
            return newOps;
        });
    };

    return (
        <div className="relative w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex">
            <div ref={mountRef} className="flex-1 h-full cursor-move" />
            
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl pointer-events-auto">
                <h4 className="text-xs font-black text-brand-cyan uppercase tracking-widest mb-2">VideoCAD Synthesis</h4>
                <div className="space-y-2">
                    {operations.map((op, idx) => (
                        <div key={idx} className={`flex items-center gap-2 text-[10px] font-mono ${idx <= currentStep ? 'text-white' : 'text-slate-600'}`}>
                            {idx < currentStep ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : idx === currentStep ? (
                                <div className="w-3 h-3 rounded-full bg-brand-cyan animate-pulse" />
                            ) : (
                                <div className="w-3 h-3 rounded-full border border-slate-600" />
                            )}
                            <span className="uppercase">{op.type.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Playback Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-full flex items-center gap-2 pointer-events-auto">
                <button 
                    onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Square className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-brand-cyan text-slate-900 rounded-full hover:bg-cyan-400 transition-colors"
                >
                    <Play className={`w-5 h-5 ${isPlaying ? 'hidden' : 'block'}`} />
                    <Square className={`w-5 h-5 ${!isPlaying ? 'hidden' : 'block'}`} />
                </button>
                <button 
                    onClick={() => setCurrentStep(operations.length - 1)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <FastForward className="w-4 h-4" />
                </button>
            </div>
            
            {/* Material Properties Overlay / Controls */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
                <button 
                    onClick={() => setShowControls(!showControls)}
                    className={`p-2 rounded-lg border transition-colors ${showControls ? 'bg-brand-cyan text-slate-900 border-brand-cyan' : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'}`}
                >
                    <Sliders className="w-4 h-4" />
                </button>

                {showControls && currentStep >= 0 && (
                    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl text-right animate-fade-in w-64">
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Live Parameters</h4>
                        <div className="space-y-4">
                            {operations.map((op, idx) => {
                                if (idx > currentStep) return null;
                                
                                if (op.type === 'sketch_circle') {
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                <span>Radius</span>
                                                <span className="text-brand-cyan">{op.parameters.radius}mm</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="50" max="300" 
                                                value={op.parameters.radius} 
                                                onChange={(e) => handleParameterChange(idx, 'radius', parseFloat(e.target.value))}
                                                className="w-full accent-brand-cyan"
                                            />
                                        </div>
                                    );
                                }
                                if (op.type === 'extrude_hull') {
                                    return (
                                        <div key={idx} className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                    <span>Depth</span>
                                                    <span className="text-brand-cyan">{op.parameters.depth}mm</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="100" max="600" 
                                                    value={op.parameters.depth} 
                                                    onChange={(e) => handleParameterChange(idx, 'depth', parseFloat(e.target.value))}
                                                    className="w-full accent-brand-cyan"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                    <span>Wall Thickness</span>
                                                    <span className="text-brand-cyan">{op.parameters.wall_thickness}mm</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="1" max="10" step="0.5"
                                                    value={op.parameters.wall_thickness} 
                                                    onChange={(e) => handleParameterChange(idx, 'wall_thickness', parseFloat(e.target.value))}
                                                    className="w-full accent-brand-cyan"
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
