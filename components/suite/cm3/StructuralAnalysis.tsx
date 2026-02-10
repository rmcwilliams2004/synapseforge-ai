
import React, { useState, useEffect, useCallback } from 'react';
import { SynapseForgeAnalysis } from '../../../services/mathLabService';
import { UNITS, unitService } from '../../../services/unitService';
import { CadViewerModal } from '../../cad/CadViewerModal';
import { CadData, Material } from '../../../types';

interface StructuralAnalysisProps {
    activeMaterial?: Material | null;
}

export const StructuralAnalysis: React.FC<StructuralAnalysisProps> = ({ activeMaterial }) => {
    // State for the Cantilever Beam Test Case
    const [load, setLoad] = useState(10); // Defaulting to 10kN to match expected visual output (~10mm)
    const [loadUnit, setLoadUnit] = useState('kN'); // kN

    const [length, setLength] = useState(5.0); // 5.0
    const [lengthUnit, setLengthUnit] = useState('m'); // m

    const [elasticity, setElasticity] = useState(200); // 200
    const [elasticityUnit, setElasticityUnit] = useState('GPa'); // GPa (Steel)

    const [inertia, setInertia] = useState(500); // 500
    const [inertiaUnit, setInertiaUnit] = useState('in4'); // in4

    const [targetUnit, setTargetUnit] = useState('mm'); // mm

    const [result, setResult] = useState<{ value: number, unit: string, metadata: any } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 3D Visualization State
    const [show3D, setShow3D] = useState(false);
    const [cadData, setCadData] = useState<CadData | null>(null);

    // Effect to ingest active material from MDM (Cross-Module Integration)
    useEffect(() => {
        if (activeMaterial && activeMaterial.properties["Young's Modulus"]) {
            const rawString = activeMaterial.properties["Young's Modulus"];
            const parsed = unitService.parseValueString(rawString);
            if (parsed) {
                setElasticity(parsed.value);
                setElasticityUnit(parsed.unitId);
            }
        }
    }, [activeMaterial]);

    const handleCalculate = useCallback(() => {
        try {
            setError(null);
            const output = SynapseForgeAnalysis.calculateBeamDeflection(
                { value: load, unitId: loadUnit },
                { value: length, unitId: lengthUnit },
                { value: elasticity, unitId: elasticityUnit },
                { value: inertia, unitId: inertiaUnit },
                targetUnit
            );
            setResult(output);
        } catch (err: any) {
            setError(err.message);
            setResult(null);
        }
    }, [load, loadUnit, length, lengthUnit, elasticity, elasticityUnit, inertia, inertiaUnit, targetUnit]);

    // Auto-calculate whenever inputs change
    useEffect(() => {
        handleCalculate();
    }, [handleCalculate]);

    const handleVisualize = () => {
        // Create a 3D representation based on the current parameters
        // We'll normalize dimensions to mm for the viewer to keep things visible
        const beamLengthMM = length * (lengthUnit === 'm' ? 1000 : (lengthUnit === 'ft' ? 304.8 : (lengthUnit === 'in' ? 25.4 : 1)));
        
        // Approximate beam cross-section width based on length for visualization scaling
        const beamWidthMM = beamLengthMM / 20; 

        const data: CadData = {
            assemblyName: "Cantilever Beam Setup",
            units: 'mm',
            components: [
                {
                    name: "Cantilever Beam",
                    shape: 'cube',
                    dimensions: { x: beamLengthMM, y: beamWidthMM, z: beamWidthMM },
                    position: { x: beamLengthMM / 2, y: 0, z: 0 }
                },
                {
                    name: "Fixed Support (Wall)",
                    shape: 'cube',
                    dimensions: { x: beamWidthMM / 2, y: beamWidthMM * 3, z: beamWidthMM * 3 },
                    position: { x: -beamWidthMM / 4, y: 0, z: 0 }
                },
                {
                    name: "Applied Load (Vector)",
                    shape: 'cylinder',
                    dimensions: { x: beamWidthMM / 4, y: beamWidthMM / 4, z: beamWidthMM * 1.5 }, // x/y are diameter/2, z is height
                    position: { x: beamLengthMM, y: beamWidthMM, z: 0 }
                }
            ]
        };
        setCadData(data);
        setShow3D(true);
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-brand-light mb-4">Structural Analysis (Integration Test)</h1>
            <p className="text-gray-400 mb-6 text-sm">
                This tool verifies the integration between the Unit Management Layer (SF-CM 1) and the MathLab Wrapper (NAL). 
                It demonstrates unit-aware calculation for a Cantilever Beam Deflection.
            </p>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-brand-cyan">Input Parameters</h3>
                        <button 
                            onClick={handleVisualize}
                            className="text-xs flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
                            Visualize Setup
                        </button>
                    </div>
                    
                    {/* Load */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-300 text-sm font-medium">Point Load (F)</label>
                        <input type="number" value={load} onChange={e => setLoad(parseFloat(e.target.value))} className="bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        <select value={loadUnit} onChange={e => setLoadUnit(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value="N">N</option>
                            <option value="kN">kN</option>
                            <option value="lbf">lbf</option>
                        </select>
                    </div>

                    {/* Length */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-300 text-sm font-medium">Beam Length (L)</label>
                        <input type="number" value={length} onChange={e => setLength(parseFloat(e.target.value))} className="bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        <select value={lengthUnit} onChange={e => setLengthUnit(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value="m">m</option>
                            <option value="mm">mm</option>
                            <option value="ft">ft</option>
                        </select>
                    </div>

                    {/* Elasticity (Linked) */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-300 text-sm font-medium">
                            Young's Modulus (E)
                            {activeMaterial && <span className="block text-[10px] text-purple-400 mt-0.5">Linked: {activeMaterial.name}</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={elasticity} 
                                onChange={e => setElasticity(parseFloat(e.target.value))} 
                                className={`bg-gray-900 border border-gray-600 rounded p-2 text-white w-full ${activeMaterial ? 'border-purple-500 ring-1 ring-purple-500' : ''}`}
                                disabled={!!activeMaterial} 
                            />
                            {activeMaterial && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-500 absolute right-2 top-3">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <select value={elasticityUnit} onChange={e => setElasticityUnit(e.target.value)} disabled={!!activeMaterial} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value="Pa">Pa</option>
                            <option value="MPa">MPa</option>
                            <option value="GPa">GPa</option>
                            <option value="psi">psi</option>
                        </select>
                    </div>

                    {/* Inertia */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-300 text-sm font-medium">Moment of Inertia (I)</label>
                        <input type="number" value={inertia} onChange={e => setInertia(parseFloat(e.target.value))} className="bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        <select value={inertiaUnit} onChange={e => setInertiaUnit(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value="m4">m⁴</option>
                            <option value="mm4">mm⁴</option>
                            <option value="cm4">cm⁴</option>
                            <option value="in4">in⁴</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="block text-gray-400 text-xs mb-2">Target Output Unit</label>
                        <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                            <option value="m">Meters (m)</option>
                            <option value="mm">Millimeters (mm)</option>
                            <option value="in">Inches (in)</option>
                        </select>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 flex flex-col justify-center items-center text-center">
                    {error ? (
                        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg">
                            <h4 className="font-bold mb-1">Calculation Error</h4>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : result ? (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider">Max Deflection</h3>
                            <div className="text-5xl font-mono font-bold text-white">
                                {result.value.toFixed(4)} <span className="text-brand-cyan text-3xl">{result.unit}</span>
                            </div>
                            
                            <div className="mt-8 bg-gray-800 p-4 rounded text-left text-xs font-mono text-gray-400 w-full overflow-auto">
                                <p className="text-gray-500 font-semibold mb-2">Traceability Metadata:</p>
                                <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" /></svg>
                            <p>Ready for calculation.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {cadData && (
                <CadViewerModal
                    isOpen={show3D}
                    onClose={() => setShow3D(false)}
                    cadData={cadData}
                />
            )}
        </div>
    );
};
