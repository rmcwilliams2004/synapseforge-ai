import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal } from './Modal';

type Box = { id: number; x: number; y: number; w: number; h: number };

interface RoiEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    onCropComplete: (croppedFiles: File[]) => void;
}

export const RoiEditorModal: React.FC<RoiEditorModalProps> = ({ isOpen, onClose, file, onCropComplete }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [currentBox, setCurrentBox] = useState<Box | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [selectedBoxIds, setSelectedBoxIds] = useState<Set<number>>(new Set());
    
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw saved boxes
        boxes.forEach(box => {
            ctx.strokeStyle = selectedBoxIds.has(box.id) ? '#06b6d4' : '#6b7280'; // brand-cyan or gray-500
            ctx.lineWidth = selectedBoxIds.has(box.id) ? 3 : 2;
            ctx.setLineDash([]);
            ctx.strokeRect(box.x, box.y, box.w, box.h);
        });
        
        // Draw the box currently being drawn
        if (currentBox) {
            ctx.strokeStyle = '#a5f3fc'; // light-cyan
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
        }
    }, [boxes, currentBox, selectedBoxIds]);

    const initializeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;
    
        const setup = () => {
            const rect = image.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            redrawCanvas();
        };

        if (image.complete) {
            setup();
        } else {
            image.onload = setup;
        }
    }, [redrawCanvas]);

    useEffect(() => {
        if (isOpen && file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
            setBoxes([]);
            setCurrentBox(null);
            setStartPoint(null);
            setIsDrawing(false);
            setSelectedBoxIds(new Set());
        }
    }, [isOpen, file]);
    
    useEffect(() => {
      if (imagePreview) {
        const timer = setTimeout(initializeCanvas, 50);
        window.addEventListener('resize', initializeCanvas);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('resize', initializeCanvas);
        }
      }
    }, [imagePreview, initializeCanvas]);

    useEffect(() => {
        redrawCanvas();
    }, [boxes, currentBox, redrawCanvas]);
    
    const getRelativeCoords = (e: React.MouseEvent | MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent) => {
        const coords = getRelativeCoords(e);
        if (coords) {
            setIsDrawing(true);
            setStartPoint(coords);
            setCurrentBox(null);
        }
    };
    
    const draw = (e: MouseEvent) => {
        if (!isDrawing || !startPoint) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;

        const x = Math.min(startPoint.x, coords.x);
        const y = Math.min(startPoint.y, coords.y);
        const w = Math.abs(startPoint.x - coords.x);
        const h = Math.abs(startPoint.y - coords.y);
        setCurrentBox({ id: 0, x, y, w, h }); // id is temporary
    };

    const finishDrawing = () => {
        if (isDrawing && currentBox && currentBox.w > 10 && currentBox.h > 10) {
            const newBox = { ...currentBox, id: Date.now() };
            setBoxes(prev => [...prev, newBox]);
            setSelectedBoxIds(prev => new Set(prev).add(newBox.id)); // Auto-select new box
        }
        setIsDrawing(false);
        setCurrentBox(null);
    };

    useEffect(() => {
        const handleDraw = (e: MouseEvent) => draw(e);
        const handleFinish = () => finishDrawing();
        if (isDrawing) {
            window.addEventListener('mousemove', handleDraw);
            window.addEventListener('mouseup', handleFinish);
        }
        return () => {
            window.removeEventListener('mousemove', handleDraw);
            window.removeEventListener('mouseup', handleFinish);
        };
    // eslint-disable-next-line react-hooks-exhaustive-deps
    }, [isDrawing, startPoint]);
    
    const handleCrop = async () => {
        if (selectedBoxIds.size === 0 || !file || !imageRef.current) return;

        const boxesToCrop = boxes.filter(box => selectedBoxIds.has(box.id));
        if (boxesToCrop.length === 0) return;

        const img = imageRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const cropPromises = boxesToCrop.map((box, index) => {
            return new Promise<File>((resolve, reject) => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = box.w * scaleX;
                tempCanvas.height = box.h * scaleY;
                const ctx = tempCanvas.getContext('2d');
                if (!ctx) return reject(new Error("Failed to get canvas context"));

                ctx.drawImage(img, box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY, 0, 0, tempCanvas.width, tempCanvas.height);
                
                tempCanvas.toBlob((blob) => {
                    if (blob) {
                        const croppedFile = new File([blob], `roi_${index + 1}_${file.name}`, { type: file.type });
                        resolve(croppedFile);
                    } else {
                        reject(new Error("Failed to create blob from canvas"));
                    }
                }, file.type);
            });
        });

        const croppedFiles = await Promise.all(cropPromises);
        onCropComplete(croppedFiles);
    };

    const deleteBox = (id: number) => {
        setBoxes(prev => prev.filter(box => box.id !== id));
        setSelectedBoxIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedBoxIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Region(s) of Interest (ROI)" confirmText={`Analyze ${selectedBoxIds.size} Selected Region(s)`} onConfirm={handleCrop}>
            <p className="text-sm text-gray-400 mb-4">Click and drag on the image to select one or more areas. Use the checkboxes to choose which regions to analyze.</p>
            <div onMouseDown={startDrawing} className="relative w-full cursor-crosshair border-2 border-gray-600 rounded-lg overflow-hidden">
                {imagePreview && <img ref={imageRef} src={imagePreview} alt="ROI Preview" className="w-full h-auto max-h-[50vh] object-contain block" draggable="false" />}
                <canvas ref={canvasRef} className="absolute top-0 left-0" />
            </div>
            {boxes.length > 0 && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-gray-300">Selected Regions:</h4>
                        <div className="flex gap-2 text-xs">
                            <button onClick={() => setSelectedBoxIds(new Set(boxes.map(b => b.id)))} className="text-cyan-400 hover:text-cyan-300">All</button>
                            <button onClick={() => setSelectedBoxIds(new Set())} className="text-cyan-400 hover:text-cyan-300">None</button>
                        </div>
                    </div>
                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-2 border-t border-b border-gray-700 py-2">
                        {boxes.map((box, index) => (
                            <li key={box.id} className={`flex justify-between items-center bg-gray-700/50 p-2 rounded-md text-xs transition-colors ${selectedBoxIds.has(box.id) ? 'bg-cyan-900/40' : ''}`}>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedBoxIds.has(box.id)}
                                        onChange={() => toggleSelection(box.id)}
                                        className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-800"
                                    />
                                    <span>Region {index + 1} (w: {Math.round(box.w)}, h: {Math.round(box.h)})</span>
                                </label>
                                <button onClick={() => deleteBox(box.id)} className="text-red-400 hover:text-red-300 font-bold text-lg px-1">&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Modal>
    );
};