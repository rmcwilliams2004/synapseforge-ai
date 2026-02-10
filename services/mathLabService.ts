
import { unitService, TypedValue } from './unitService';

// --- Low-Level Library Simulation (MathLab02) ---
// This simulates the external library code that strictly operates on base SI units (floats/doubles).
const MathLab02 = {
    /**
     * Calculates the maximum deflection of a cantilever beam with a point load at the end.
     * Formula: delta = (F * L^3) / (3 * E * I)
     * All inputs must be in base SI units: N, m, Pa, m^4
     */
    calculateCantileverDeflection: (force: number, length: number, elasticity: number, inertia: number): number => {
        if (elasticity <= 0 || inertia <= 0) {
            throw new Error("Elasticity and Inertia must be positive non-zero values.");
        }
        return (force * Math.pow(length, 3)) / (3 * elasticity * inertia);
    },

    /**
     * Solves a simple linear system Ax = B using Gaussian elimination.
     * A must be square.
     */
    solveLinearSystem: (A: number[][], B: number[]): number[] => {
        const n = B.length;
        // Simple validation
        if (A.length !== n || A[0].length !== n) {
            throw new Error("Matrix A must be square and match dimension of vector B.");
        }
        
        // Deep copy to avoid mutating inputs
        const M = A.map(row => [...row]);
        const x = new Array(n).fill(0);
        const b = [...B];

        // Forward elimination
        for (let k = 0; k < n - 1; k++) {
            for (let i = k + 1; i < n; i++) {
                const factor = M[i][k] / M[k][k];
                for (let j = k; j < n; j++) {
                    M[i][j] -= factor * M[k][j];
                }
                b[i] -= factor * b[k];
            }
        }

        // Backward substitution
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += M[i][j] * x[j];
            }
            x[i] = (b[i] - sum) / M[i][i];
        }

        return x;
    }
};

// --- Tier 2: Numerical Abstraction Layer (NAL) ---
// Wraps MathLab02 and handles Unit Management Layer (UML) interoperability.

export class SynapseForgeAnalysis {
    
    /**
     * Calculates Cantilever Beam Deflection with unit-aware inputs.
     * 
     * @param load Force applied (e.g., in kN)
     * @param length Beam length (e.g., in m)
     * @param elasticity Young's Modulus (e.g., in GPa)
     * @param inertia Moment of Inertia (e.g., in cm^4)
     * @param targetUnitId The desired unit for the deflection result (e.g., 'mm')
     * @returns The deflection value in the target unit, plus metadata.
     */
    static calculateBeamDeflection(
        load: TypedValue, 
        length: TypedValue, 
        elasticity: TypedValue, 
        inertia: TypedValue,
        targetUnitId: string = 'mm'
    ) {
        try {
            // 1. UML: Convert all inputs to Base SI Units expected by MathLab02
            const forceSI = unitService.convert(load.value, load.unitId, 'N');
            const lengthSI = unitService.convert(length.value, length.unitId, 'm');
            const elasticitySI = unitService.convert(elasticity.value, elasticity.unitId, 'Pa');
            const inertiaSI = unitService.convert(inertia.value, inertia.unitId, 'm4');

            // 2. NAL: Call Low-Level Calculation
            const deflectionSI = MathLab02.calculateCantileverDeflection(forceSI, lengthSI, elasticitySI, inertiaSI);

            // 3. UML: Convert Output to Target Unit
            const resultValue = unitService.convert(deflectionSI, 'm', targetUnitId);

            return {
                value: resultValue,
                unit: targetUnitId,
                metadata: {
                    unitSystem: 'Derived',
                    source: 'SF-NAL-MathLab02',
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error: any) {
            console.error("NAL Calculation Error:", error);
            throw new Error(`Analysis Failed: ${error.message}`);
        }
    }
}
