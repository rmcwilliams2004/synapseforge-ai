
import React from 'react';
import { CadViewerTool } from '../../types';

interface CadViewerToolbarProps {
  activeTool: CadViewerTool;
  onToolChange: (tool: CadViewerTool) => void;
  onResetView: () => void;
  isExploded: boolean;
  onToggleExplode: () => void;
  isSectionEnabled: boolean;
  onToggleSection: () => void;
  isAutoRotate: boolean;
  onToggleAutoRotate: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

const ToolButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-brand-cyan text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-brand-cyan' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
    >
        {icon}
    </button>
);

const Icons = {
    Select: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>,
    Reset: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v4.992" /></svg>,
    Explode: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12.963,1.387 5,6.5 5,17.5 12.963,22.613 21,17.5 21,6.5 12.963,1.387 Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.46,15.1 5,17.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5,13 21,17.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12.96,1.39 12.96,12" /></svg>,
    Section: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M 5, 8.5 V 15.5 L 12, 19.5 V 12.5 Z M 12, 19.5 L 19, 15.5 V 8.5 L 12, 12.5 Z M 19, 8.5 L 12, 4.5 5, 8.5 Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M 5.5, 12 H 18.5" /></svg>,
    Measure: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m-5.175 6.35a.75.75 0 0 1-1.05-.02L2.05 13.05a.75.75 0 0 1 .02-1.05l1.635-1.636a.75.75 0 0 1 1.05.02l.175.175 1.05-1.05-.175-.175a.75.75 0 0 1-.02-1.05L7.364 6.5a.75.75 0 0 1 1.05-.02l1.425 1.425-3.1 3.1 3.1 3.1-1.425 1.425a.75.75 0 0 1-1.05-.02l-.175-.175-1.05 1.05.175.175Zm9.35-1.05a.75.75 0 0 1 1.05.02l.725.725a.75.75 0 0 1-.02 1.05l-1.636 1.635a.75.75 0 0 1-1.05-.02l-.175-.175-1.05 1.05.175.175a.75.75 0 0 1 .02 1.05l-1.635 1.636a.75.75 0 0 1-1.05-.02l-1.425-1.425 3.1-3.1-3.1-3.1 1.425-1.425a.75.75 0 0 1 1.05.02l.175.175 1.05-1.05-.175-.175a.75.75 0 0 1-.02-1.05L16.5 7.364a.75.75 0 0 1 1.05-.02l1.425 1.425Z" /></svg>,
    Rotate: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v4.992" /></svg>,
    Grid: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
};


export const CadViewerToolbar = ({ activeTool, onToolChange, onResetView, isExploded, onToggleExplode, isSectionEnabled, onToggleSection, isAutoRotate, onToggleAutoRotate, showGrid, onToggleGrid }: CadViewerToolbarProps) => {
    return (
        <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-2 flex flex-col gap-2 shadow-lg z-20">
            <ToolButton label="Select" icon={<Icons.Select />} isActive={activeTool === 'select'} onClick={() => onToolChange('select')} />
            
            <div className="border-t border-gray-600 my-1 mx-2" />

            <ToolButton label="Exploded View" icon={<Icons.Explode />} isActive={isExploded} onClick={onToggleExplode} />
            <ToolButton label="Section View" icon={<Icons.Section />} isActive={isSectionEnabled} onClick={onToggleSection} />
            <ToolButton label="Measure" icon={<Icons.Measure />} isActive={activeTool === 'measure'} onClick={() => onToolChange('measure')} />
            
            <div className="border-t border-gray-600 my-1 mx-2" />

            <ToolButton label="Auto Rotate" icon={<Icons.Rotate />} isActive={isAutoRotate} onClick={onToggleAutoRotate} />
            <ToolButton label="Show Grid" icon={<Icons.Grid />} isActive={showGrid} onClick={onToggleGrid} />

            <div className="border-t border-gray-600 my-1 mx-2" />
            
            <ToolButton label="Reset View" icon={<Icons.Reset />} isActive={false} onClick={onResetView} />
        </div>
    );
};
