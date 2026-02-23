import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, ZoomIn, ZoomOut, RotateCcw, Move, Ruler } from 'lucide-react';
import { CadData } from '../../types';

interface CadViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    cadData: CadData;
}

export const CadViewerModal: React.FC<CadViewerModalProps> = ({ isOpen, onClose, cadData }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    const threeRef = useRef<{
        scene?: THREE.Scene,
        camera?: THREE.PerspectiveCamera,
        renderer?: THREE.WebGLRenderer,
        controls?: OrbitControls,
        animationFrameId?: number,
        group?: THREE.Group,
        selectedMeshes: THREE.Mesh[],
        line?: THREE.Line
    }>({ selectedMeshes: [] });

    useEffect(() => {
        if (!isOpen || !mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0f172a'); // slate-900

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(5, 5, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        // Grid & Axes
        const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
        scene.add(gridHelper);
        
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Build CAD Geometry
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x06b6d4, // brand-cyan
            metalness: 0.7,
            roughness: 0.2,
            wireframe: false
        });

        const group = new THREE.Group();
        
        cadData.features.forEach(feature => {
            let geometry;
            if (feature.type === 'EXTRUDE') {
                geometry = new THREE.BoxGeometry(
                    feature.parameters.width || 2,
                    feature.parameters.depth || 2,
                    feature.parameters.height || 2
                );
            } else if (feature.type === 'REVOLVE') {
                geometry = new THREE.CylinderGeometry(
                    feature.parameters.radius || 1,
                    feature.parameters.radius || 1,
                    feature.parameters.height || 2,
                    32
                );
            } else {
                geometry = new THREE.SphereGeometry(1, 32, 32);
            }

            const mesh = new THREE.Mesh(geometry, material.clone());
            
            // Simple positioning based on ID or index for demo purposes
            // In a real app, you'd use actual transformation matrices
            mesh.position.y = (feature.parameters.height || 2) / 2;
            
            // Add edges for better visibility
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
            mesh.add(line);
            
            group.add(mesh);
        });

        // Center the group
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);
        scene.add(group);

        // Adjust camera to fit object
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // zoom out a little
        camera.position.set(cameraZ, cameraZ, cameraZ);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);

        threeRef.current = { scene, camera, renderer, controls, group, selectedMeshes: [] };

        const animate = () => {
            const id = requestAnimationFrame(animate);
            threeRef.current.animationFrameId = id;
            controls.update();
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
            if (threeRef.current.animationFrameId) {
                cancelAnimationFrame(threeRef.current.animationFrameId);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            material.dispose();
        };
    }, [isOpen, cadData]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!isMeasuring || !mountRef.current || !threeRef.current.camera || !threeRef.current.scene || !threeRef.current.group) return;

            const rect = mountRef.current.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, threeRef.current.camera);

            const intersects = raycaster.intersectObjects(threeRef.current.group.children, false);

            if (intersects.length > 0) {
                const object = intersects[0].object as THREE.Mesh;
                const mat = object.material as THREE.MeshStandardMaterial;

                const { selectedMeshes } = threeRef.current;

                if (selectedMeshes.includes(object)) {
                    // Deselect
                    mat.emissive.setHex(0x000000);
                    threeRef.current.selectedMeshes = selectedMeshes.filter(m => m !== object);
                } else {
                    if (selectedMeshes.length >= 2) {
                        // Deselect first
                        const first = selectedMeshes[0];
                        (first.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                        threeRef.current.selectedMeshes = [selectedMeshes[1], object];
                    } else {
                        threeRef.current.selectedMeshes.push(object);
                    }
                    mat.emissive.setHex(0x4ade80); // green emissive
                }

                // Update line and distance
                if (threeRef.current.line) {
                    threeRef.current.scene.remove(threeRef.current.line);
                    threeRef.current.line = undefined;
                }

                if (threeRef.current.selectedMeshes.length === 2) {
                    const [m1, m2] = threeRef.current.selectedMeshes;
                    const p1 = new THREE.Vector3();
                    m1.getWorldPosition(p1);
                    const p2 = new THREE.Vector3();
                    m2.getWorldPosition(p2);

                    const dist = p1.distanceTo(p2);
                    setDistance(dist);

                    const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                    const lineMat = new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 });
                    const line = new THREE.Line(lineGeo, lineMat);
                    threeRef.current.scene.add(line);
                    threeRef.current.line = line;
                } else {
                    setDistance(null);
                }
            }
        };

        const domElement = mountRef.current;
        if (domElement) {
            domElement.addEventListener('click', handleClick);
        }

        return () => {
            if (domElement) {
                domElement.removeEventListener('click', handleClick);
            }
        };
    }, [isMeasuring]);

    useEffect(() => {
        if (!isMeasuring) {
            // Clear selections
            threeRef.current.selectedMeshes?.forEach(m => {
                (m.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            });
            threeRef.current.selectedMeshes = [];
            if (threeRef.current.line && threeRef.current.scene) {
                threeRef.current.scene.remove(threeRef.current.line);
                threeRef.current.line = undefined;
            }
            setDistance(null);
        }
    }, [isMeasuring]);

    if (!isOpen) return null;

    const handleZoomIn = () => {
        if (threeRef.current.camera) {
            threeRef.current.camera.position.multiplyScalar(0.8);
        }
    };

    const handleZoomOut = () => {
        if (threeRef.current.camera) {
            threeRef.current.camera.position.multiplyScalar(1.2);
        }
    };

    const handleReset = () => {
        if (threeRef.current.camera && threeRef.current.controls) {
            threeRef.current.camera.position.set(5, 5, 5);
            threeRef.current.controls.target.set(0, 0, 0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Move className="w-5 h-5 text-brand-cyan" />
                        CAD Model Viewer
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 relative bg-slate-950">
                    <div ref={mountRef} className="absolute inset-0" />
                    
                    {/* Measurement Display */}
                    {isMeasuring && (
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl pointer-events-none">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Measurement Tool</h3>
                            {distance !== null ? (
                                <p className="text-2xl font-black text-brand-cyan">
                                    {distance.toFixed(2)} <span className="text-sm text-slate-500">units</span>
                                </p>
                            ) : (
                                <p className="text-sm text-slate-300">Select two components to measure distance.</p>
                            )}
                        </div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-xl">
                        <button 
                            onClick={() => setIsMeasuring(!isMeasuring)} 
                            className={`p-3 rounded-xl transition-all ${isMeasuring ? 'bg-brand-cyan text-slate-900' : 'text-slate-400 hover:text-brand-cyan hover:bg-slate-800'}`} 
                            title="Measure Distance"
                        >
                            <Ruler className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1"></div>
                        <button onClick={handleZoomIn} className="p-3 text-slate-400 hover:text-brand-cyan hover:bg-slate-800 rounded-xl transition-all" title="Zoom In">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button onClick={handleZoomOut} className="p-3 text-slate-400 hover:text-brand-cyan hover:bg-slate-800 rounded-xl transition-all" title="Zoom Out">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1"></div>
                        <button onClick={handleReset} className="p-3 text-slate-400 hover:text-brand-cyan hover:bg-slate-800 rounded-xl transition-all" title="Reset View">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
