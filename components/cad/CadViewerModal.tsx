import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CadData, CadViewerTool, CadMeasurement } from '../../types';
import { CadViewerSidebar } from './CadComponentList';
import { CadViewerToolbar } from './CadViewerToolbar';

interface CadViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadData: CadData;
}

const SNAP_RADIUS = 5; // in world units

// Helper to find the closest vertex on a mesh to a given point
const findClosestVertex = (intersect: THREE.Intersection): { point: THREE.Vector3, distance: number } | null => {
    if (!intersect) return null;

    const geometry = intersect.object.geometry;
    const positionAttribute = geometry.attributes.position;
    if (!positionAttribute) return null;

    let closestVertex = new THREE.Vector3();
    let minDistanceSq = Infinity;

    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);
        vertex.applyMatrix4(intersect.object.matrixWorld);

        const distanceSq = vertex.distanceToSquared(intersect.point);
        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            closestVertex.copy(vertex);
        }
    }
    return { point: closestVertex, distance: Math.sqrt(minDistanceSq) };
};

export const CadViewerModal: React.FC<CadViewerModalProps> = ({ isOpen, onClose, cadData }) => {
    const [activeTool, setActiveTool] = useState<CadViewerTool>('select');
    const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(cadData.components.map(c => c.name)));
    const [selectedComponentName, setSelectedComponentName] = useState<string | null>(null);

    // New state for interactive features
    const [isExploded, setIsExploded] = useState(false);
    const [explodeFactor, setExplodeFactor] = useState(0.5);
    const [isSectionEnabled, setIsSectionEnabled] = useState(false);
    const [sectionPlaneConfig, setSectionPlaneConfig] = useState({ axis: 'x', constant: 0, inverted: false });
    
    // State for click-and-drag measurement
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
        // New helpers for measurement
        snapIndicator?: THREE.Mesh,
        previewLine?: THREE.Line,
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

    const getIntersect = useCallback((event: MouseEvent): THREE.Intersection | null => {
        const t = threeRef.current;
        if (!t.renderer || !t.camera) return null;
        const rect = t.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, t.camera);
        const intersects = raycaster.intersectObjects(Array.from(t.meshMap.values()).filter(m => m.visible));
        return intersects.length > 0 ? intersects[0] : null;
    }, []);

    // Main Three.js setup effect
    useEffect(() => {
        if (!isOpen || !mountRef.current || !labelsRef.current) return;

        const currentMount = mountRef.current;
        const t = threeRef.current;

        t.scene = new THREE.Scene();
        t.scene.background = new THREE.Color(0x0f172a);
        t.camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
        t.renderer = new THREE.WebGLRenderer({ antialias: true });
        t.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        t.renderer.setPixelRatio(window.devicePixelRatio);
        t.renderer.localClippingEnabled = true;
        currentMount.appendChild(t.renderer.domElement);
        
        t.controls = new OrbitControls(t.camera, t.renderer.domElement);
        t.controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        t.scene.add(ambientLight);
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight1.position.set(1, 1, 1).normalize();
        t.scene.add(dirLight1);

        t.snapIndicator = new THREE.Mesh(new THREE.SphereGeometry(2), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
        // FIX: Corrected assignment in `if` condition to a property check to prevent runtime errors and correctly narrow the type.
        if (t.snapIndicator) {
            t.snapIndicator.visible = false;
            t.scene.add(t.snapIndicator);
        }
        
        const previewLineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        t.previewLine = new THREE.Line(previewLineGeom, new THREE.LineDashedMaterial({ color: 0xffeb3b, dashSize: 3, gapSize: 1 }));
        // FIX: The 'visible' property was being accessed on a potentially un-narrowed type. This check ensures the type is correctly inferred as THREE.Line before access.
        if (t.previewLine) {
            t.previewLine.computeLineDistances();
            t.previewLine.visible = false;
            t.scene.add(t.previewLine);
        }

        const group = new THREE.Group();
        t.meshMap.clear();
        t.originalPositions.clear();
        cadData.components.forEach(comp => {
            const geometry = comp.shape === 'cylinder' ? new THREE.CylinderGeometry(comp.dimensions.x / 2, comp.dimensions.x / 2, comp.dimensions.z, 32)
                             : comp.shape === 'sphere' ? new THREE.SphereGeometry(comp.dimensions.x / 2, 32, 16)
                             : new THREE.BoxGeometry(comp.dimensions.x, comp.dimensions.y, comp.dimensions.z);
            
            const material = new THREE.MeshStandardMaterial({
                color: 0x06b6d4, transparent: true, opacity: 0.8, metalness: 0.3, roughness: 0.4,
                clipping: true, clipIntersection: false,
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
        const fov = t.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        t.camera.position.set(cameraZ, cameraZ, cameraZ);
        t.controls.target.set(0, 0, 0);
        t.scene.add(group);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            t.controls?.update();
            measurements.forEach(m => {
                 if (t.camera && t.renderer) {
                    const positionAttribute = m.line.geometry.attributes.position as THREE.BufferAttribute;
                    const startVec = new THREE.Vector3().fromBufferAttribute(positionAttribute, 0);
                    const endVec = new THREE.Vector3().fromBufferAttribute(positionAttribute, 1);
                    const midPoint = new THREE.Vector3().lerpVectors(startVec, endVec, 0.5);
                    const screenPos = midPoint.clone().project(t.camera);
                    const x = (screenPos.x *  0.5 + 0.5) * t.renderer.domElement.clientWidth;
                    const y = (screenPos.y * -0.5 + 0.5) * t.renderer.domElement.clientHeight;
                    m.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                 }
            });
            t.renderer?.render(t.scene!, t.camera!);
        };
        animate();

        return () => { // Cleanup function
            cancelAnimationFrame(animationFrameId);
            t.controls?.dispose();
            t.scene?.traverse(o => {
                if (o instanceof THREE.Mesh) {
                    o.geometry.dispose();
                    if(Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                    else o.material.dispose();
                }
            });
            handleResetMeasurements();
            t.renderer?.dispose();
            if (currentMount && t.renderer) {
                currentMount.removeChild(t.renderer.domElement);
            }
        };
    }, [isOpen, cadData, handleResetMeasurements]);

    // This robust useEffect manages all event listeners, recreating them when dependencies change.
    useEffect(() => {
        const rendererEl = threeRef.current.renderer?.domElement;
        if (!rendererEl) return;

        const handleMouseDown = (event: MouseEvent) => {
            if (activeTool === 'measure' && event.button === 0) {
                const intersect = getIntersect(event);
                if (intersect) {
                    let point = intersect.point;
                    let type: 'vertex' | 'surface' = 'surface';
                    const closestVertex = findClosestVertex(intersect);
                    if (closestVertex && closestVertex.distance < SNAP_RADIUS) {
                        point = closestVertex.point;
                        type = 'vertex';
                    }
                    isMeasuringRef.current = true;
                    startPointRef.current = { point, type };
                    if (threeRef.current.previewLine) {
                        const positions = threeRef.current.previewLine.geometry.attributes.position as THREE.BufferAttribute;
                        positions.setXYZ(0, point.x, point.y, point.z);
                        positions.setXYZ(1, point.x, point.y, point.z);
                        positions.needsUpdate = true;
                        threeRef.current.previewLine.visible = true;
                    }
                    if (labelsRef.current && !tempLabelRef.current) {
                        const label = document.createElement('div');
                        label.className = 'p-1 bg-yellow-400 text-black text-xs font-bold rounded absolute pointer-events-none -translate-x-1/2 -translate-y-full';
                        labelsRef.current.appendChild(label);
                        tempLabelRef.current = label;
                    }
                    if (tempLabelRef.current) tempLabelRef.current.style.display = 'block';
                }
            }
        };

        const handleMouseMove = (event: MouseEvent) => {
            const t = threeRef.current;
            const intersect = getIntersect(event);
            if (!intersect || !t.scene) {
                if(t.snapIndicator) t.snapIndicator.visible = false;
                return;
            };

            let currentPoint = intersect.point;
            let isSnapped = false;
            const closestVertex = findClosestVertex(intersect);
            if (closestVertex && closestVertex.distance < SNAP_RADIUS) {
                currentPoint = closestVertex.point;
                isSnapped = true;
            }

            if (t.snapIndicator) {
                t.snapIndicator.position.copy(currentPoint);
                t.snapIndicator.visible = isSnapped;
            }

            if (isMeasuringRef.current && startPointRef.current && t.previewLine && t.renderer) {
                const positions = t.previewLine.geometry.attributes.position as THREE.BufferAttribute;
                positions.setXYZ(1, currentPoint.x, currentPoint.y, currentPoint.z);
                positions.needsUpdate = true;
                const distance = startPointRef.current.point.distanceTo(currentPoint);
                if (tempLabelRef.current) {
                    tempLabelRef.current.textContent = `${distance.toFixed(2)} ${cadData.units}`;
                    const rect = t.renderer.domElement.getBoundingClientRect();
                    const x = event.clientX - rect.left + 15;
                    const y = event.clientY - rect.top;
                    tempLabelRef.current.style.transform = `translate(${x}px, ${y}px)`;
                }
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            const t = threeRef.current;
            if (!isMeasuringRef.current || !startPointRef.current || !t.scene || !labelsRef.current) return;
            
            isMeasuringRef.current = false;
            if (t.previewLine) t.previewLine.visible = false;
            if (tempLabelRef.current) tempLabelRef.current.style.display = 'none';

            const intersect = getIntersect(event);
            if (!intersect) {
                startPointRef.current = null;
                return;
            };

            let endPoint = intersect.point;
            let endType: 'vertex' | 'surface' = 'surface';
            const closestVertex = findClosestVertex(intersect);
            if (closestVertex && closestVertex.distance < SNAP_RADIUS) {
                endPoint = closestVertex.point;
                endType = 'vertex';
            }

            const start = startPointRef.current.point;
            const distance = start.distanceTo(endPoint);
            if (distance < 0.1) return; // Ignore tiny measurements

            const lineGeom = new THREE.BufferGeometry().setFromPoints([start, endPoint]);
            const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xffeb3b, linewidth: 2, depthTest: false }));
            line.renderOrder = 999;
            t.scene.add(line);

            const label = document.createElement('div');
            label.className = 'p-1 bg-yellow-400 text-black text-xs font-bold rounded absolute pointer-events-none';
            labelsRef.current.appendChild(label);

            const typeString = `${startPointRef.current.type === 'vertex' ? 'V' : 'S'}-${endType === 'vertex' ? 'V' : 'S'}`;
            setMeasurements(prev => [...prev, { id: Date.now().toString(), line, label, distance, type: typeString, units: cadData.units }]);

            startPointRef.current = null;
        };

        const handleClick = (event: MouseEvent) => {
             if (activeTool === 'select') {
                const intersect = getIntersect(event);
                setSelectedComponentName(intersect ? intersect.object.name : null);
             }
        };

        rendererEl.addEventListener('mousedown', handleMouseDown);
        rendererEl.addEventListener('mousemove', handleMouseMove);
        rendererEl.addEventListener('mouseup', handleMouseUp);
        rendererEl.addEventListener('click', handleClick);
        
        return () => {
            rendererEl.removeEventListener('mousedown', handleMouseDown);
            rendererEl.removeEventListener('mousemove', handleMouseMove);
            rendererEl.removeEventListener('mouseup', handleMouseUp);
            rendererEl.removeEventListener('click', handleClick);
        };
    }, [isOpen, activeTool, getIntersect, cadData.units]); // Re-attach listeners if dependencies change
    
    useEffect(() => {
        if(threeRef.current.controls) threeRef.current.controls.enabled = activeTool === 'select';
        if(mountRef.current) mountRef.current.style.cursor = activeTool === 'measure' ? 'crosshair' : (activeTool === 'select' ? 'grab' : 'default');
    }, [activeTool]);

    useEffect(() => {
        threeRef.current.meshMap.forEach((mesh, name) => {
            const isSelected = name === selectedComponentName;
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.color.set(isSelected ? 0xfbbf24 : 0x06b6d4);
            material.emissive.set(isSelected ? 0xcc8400 : 0x000000);
        });
    }, [selectedComponentName]);

    useEffect(() => {
        threeRef.current.meshMap.forEach((mesh, name) => { mesh.visible = visibleIds.has(name); });
    }, [visibleIds]);

    useEffect(() => {
        const { meshMap, originalPositions } = threeRef.current;
        if (!meshMap.size || !originalPositions.size) return;
        meshMap.forEach((mesh, name) => {
            const originalPos = originalPositions.get(name);
            if (!originalPos) return;
            if (isExploded) {
                const dir = new THREE.Vector3().subVectors(originalPos, new THREE.Vector3(0,0,0)).normalize();
                mesh.position.copy(originalPos).addScaledVector(dir, 150 * explodeFactor);
            } else {
                mesh.position.copy(originalPos);
            }
        });
    }, [isExploded, explodeFactor]);

    useEffect(() => {
        const { scene, renderer, meshMap, clippingPlanes } = threeRef.current;
        if (!scene || !renderer) return;
        if (threeRef.current.planeHelper) {
            scene.remove(threeRef.current.planeHelper);
            threeRef.current.planeHelper.dispose();
        }
        clippingPlanes.length = 0;
        if (isSectionEnabled) {
            const plane = new THREE.Plane(new THREE.Vector3(), sectionPlaneConfig.constant);
            if (sectionPlaneConfig.axis === 'x') plane.normal.set(1, 0, 0);
            if (sectionPlaneConfig.axis === 'y') plane.normal.set(0, 1, 0);
            if (sectionPlaneConfig.axis === 'z') plane.normal.set(0, 0, 1);
            if (sectionPlaneConfig.inverted) plane.negate();
            clippingPlanes.push(plane);
            const helper = new THREE.PlaneHelper(plane, 500, 0x06b6d4);
            threeRef.current.planeHelper = helper;
            scene.add(helper);
        }
        meshMap.forEach(mesh => {
            (mesh.material as THREE.MeshStandardMaterial).clippingPlanes = isSectionEnabled ? clippingPlanes : null;
        });
    }, [isSectionEnabled, sectionPlaneConfig]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 animate-fade-in" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-gray-900 rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col border-2 border-gray-600" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-light">3D CAD Viewer: {cadData.assemblyName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </header>
                <main className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative">
                        <CadViewerToolbar
                            activeTool={activeTool}
                            onToolChange={onToolChange}
                            onResetView={() => threeRef.current.controls?.reset()}
                            isExploded={isExploded}
                            onToggleExplode={() => setIsExploded(!isExploded)}
                            isSectionEnabled={isSectionEnabled}
                            onToggleSection={() => setIsSectionEnabled(!isSectionEnabled)}
                        />
                         <div ref={mountRef} className="w-full h-full" />
                         <div ref={labelsRef} className="absolute top-0 left-0 pointer-events-none" />
                    </div>
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
                        measurements={measurements}
                        onClearMeasurements={handleResetMeasurements}
                        units={cadData.units}
                        activeTool={activeTool}
                        isMeasuring={isMeasuringRef.current}
                    />
                </main>
            </div>
        </div>
    );
};
