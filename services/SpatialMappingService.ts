export const mapClickToFeature = (points: {x: number, y: number}[]) => {
    if (!points || points.length === 0) return "Unknown Feature";
    
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    if (centerX < 300) return "Port Side Hull Extrusion";
    if (centerX > 600) return "Starboard Engine Mount";
    if (centerY < 200) return "Upper Geodesic Dome";
    return "Central Buoyant Core";
};

export const runPartialRebuild = async (targetFeature: string, instruction: string) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                status: 'success',
                feature: targetFeature,
                appliedInstruction: instruction,
                message: `Rebuilt ${targetFeature} with parameters: ${instruction}`
            });
        }, 3000);
    });
};
