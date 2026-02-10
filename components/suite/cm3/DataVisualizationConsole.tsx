import React, { useState, useEffect, useRef } from 'react';
import { MOCK_CHART_DATA } from '../../../constants';
import { ChartData } from '../../../types';

declare const Plotly: any;

export const DataVisualizationConsole: React.FC = () => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [selectedChart, setSelectedChart] = useState<ChartData>(MOCK_CHART_DATA[0]);

    useEffect(() => {
        if (chartRef.current && selectedChart) {
            let data: any;
            let layout: any;

            const commonLayout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: '#1f2937', // gray-800
                font: { color: '#e2e8f0' },
                xaxis: { gridcolor: '#4b5563' },
                yaxis: { gridcolor: '#4b5563' },
                margin: { l: 60, r: 20, t: 60, b: 60 },
            };

            switch (selectedChart.type) {
                case 'bode':
                    data = [
                        { x: selectedChart.data.freq, y: selectedChart.data.magnitude, type: 'scatter', mode: 'lines', name: 'Magnitude', line: { color: '#06b6d4' } },
                        { x: selectedChart.data.freq, y: selectedChart.data.phase, type: 'scatter', mode: 'lines', name: 'Phase', yaxis: 'y2', line: { color: '#a78bfa'} }
                    ];
                    layout = { 
                        ...commonLayout, 
                        title: selectedChart.name, 
                        xaxis: { type: 'log', title: 'Frequency (Hz)', gridcolor: '#4b5563' }, 
                        yaxis: { title: 'Magnitude (dB)', gridcolor: '#4b5563'}, 
                        yaxis2: { title: 'Phase (deg)', overlaying: 'y', side: 'right', gridcolor: '#4b5563' },
                        legend: { orientation: 'h', y: -0.2 }
                    };
                    break;
                case 'gantt':
                    data = [{
                        type: 'gantt',
                        tasks: selectedChart.data.map((d: any) => ({ ...d, 'Task': `<b>${d.Task}</b><br><i>${d.Resource}</i>` })),
                        showlegend: false,
                        hoverinfo: 'x',
                        marker: {
                            color: '#06b6d4'
                        }
                    }];
                    layout = { ...commonLayout, title: selectedChart.name, xaxis: { type: 'date', gridcolor: '#4b5563' } };
                    break;
                case 'stress-strain':
                    data = [{ x: selectedChart.data.strain, y: selectedChart.data.stress, type: 'scatter', mode: 'lines', line: { color: '#06b6d4' } }];
                    layout = { ...commonLayout, title: selectedChart.name, xaxis: { title: 'Strain (in/in)', gridcolor: '#4b5563' }, yaxis: { title: 'Stress (MPa)', gridcolor: '#4b5563' } };
                    break;
                default:
                    data = [];
                    layout = {};
            }
            Plotly.newPlot(chartRef.current, data, layout, {responsive: true, displaylogo: false});
        }
    }, [selectedChart]);

    const handleExport = () => {
        if (chartRef.current) {
            Plotly.downloadImage(chartRef.current, {
                format: 'png',
                width: 1200,
                height: 700,
                filename: selectedChart.name.replace(/ /g, '_')
            });
        }
    };

    return (
         <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-brand-light mb-4">Data Visualization Console</h1>
            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select Chart Dataset</label>
                         <select
                            value={selectedChart.id}
                            onChange={(e) => setSelectedChart(MOCK_CHART_DATA.find(c => c.id === e.target.value)!)}
                            className="w-full max-w-md p-2 bg-gray-700 border border-gray-600 rounded-lg"
                         >
                             {MOCK_CHART_DATA.map(chart => <option key={chart.id} value={chart.id}>{chart.name}</option>)}
                         </select>
                     </div>
                     <button
                        onClick={handleExport}
                        className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg border border-gray-500 hover:bg-gray-500 transition active:scale-95 text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Export as PNG
                    </button>
                </div>
                 <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg min-h-[500px]">
                    <div ref={chartRef} className="w-full h-full" />
                </div>
            </div>
        </div>
    );
};