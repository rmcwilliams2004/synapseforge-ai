
import React, { useEffect, useRef } from 'react';
import { AnalysisResult } from '../../types';

declare const Plotly: any;

interface ProjectDashboardProps {
  result: AnalysisResult;
}

const parseNumericValue = (str: string): number => {
  if (!str) return 0;
  // Handle scientific notation and common delimiters
  const cleanStr = str.replace(/,/g, '');
  const match = cleanStr.match(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/);
  return match ? parseFloat(match[0]) : 0;
};

const getRiskValue = (level: 'Low' | 'Medium' | 'High'): number => {
  switch (level) {
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': default: return 1;
  }
};

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ result }) => {
  const costChartRef = useRef<HTMLDivElement>(null);
  const materialChartRef = useRef<HTMLDivElement>(null);
  const riskChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || typeof Plotly === 'undefined') return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e2e8f0' : '#1f2937';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

    // 1. Cost Distribution (Donut)
    const costLabels = result.preliminaryCostEstimate.breakdown.map(item => item.item);
    const costValues = result.preliminaryCostEstimate.breakdown.map(item => parseNumericValue(item.cost_estimate));

    Plotly.newPlot(costChartRef.current, [{
      values: costValues,
      labels: costLabels,
      type: 'pie',
      hole: 0.6,
      marker: {
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e']
      },
      textinfo: 'label+percent',
      hoverinfo: 'label+value',
      automargin: true
    }], {
      title: { text: 'Cost Distribution', font: { color: textColor, size: 16, weight: 'bold' } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: false,
      height: 300,
      margin: { l: 20, r: 20, t: 40, b: 20 }
    }, { responsive: true, displayModeBar: false });

    // 2. Material Performance (Radar)
    const materials = result.material_suggestions.slice(0, 4);
    const materialData = materials.map(mat => ({
      type: 'scatterpolar',
      r: [
        parseNumericValue(mat.properties.tensile_strength),
        parseNumericValue(mat.properties.density) * 10,
        parseNumericValue(mat.properties.melting_point) / 10,
        parseNumericValue(mat.properties.conductivity) || 10
      ],
      theta: ['Strength', 'Density (x10)', 'Temp Res (/10)', 'Conductivity'],
      fill: 'toself',
      name: mat.name
    }));

    Plotly.newPlot(materialChartRef.current, materialData, {
      polar: {
        radialaxis: { visible: true, range: [0, 500], color: textColor, gridcolor: gridColor },
        angularaxis: { color: textColor, gridcolor: gridColor },
        bgcolor: isDarkMode ? '#1e293b' : '#f8fafc'
      },
      title: { text: 'Material Performance Matrix', font: { color: textColor, size: 16, weight: 'bold' } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: true,
      legend: { font: { color: textColor }, orientation: 'h', y: -0.3 },
      height: 350,
      margin: { l: 40, r: 40, t: 60, b: 80 }
    }, { responsive: true, displayModeBar: false });

    // 3. Risk Matrix (Bubble)
    const risks = result.complianceAndSafety.safety_risks;
    Plotly.newPlot(riskChartRef.current, [{
      x: risks.map(r => getRiskValue(r.likelihood)),
      y: risks.map(r => getRiskValue(r.impact)),
      text: risks.map(r => r.risk),
      mode: 'markers+text',
      type: 'scatter',
      textposition: 'top center',
      marker: {
        size: 24,
        color: risks.map(r => getRiskValue(r.impact) * getRiskValue(r.likelihood)),
        colorscale: [[0, '#22c55e'], [0.5, '#eab308'], [1, '#ef4444']],
        line: { color: isDarkMode ? '#0f172a' : '#ffffff', width: 2 }
      }
    }], {
      title: { text: 'Critical Risk Assessment', font: { color: textColor, size: 16, weight: 'bold' } },
      xaxis: { 
        title: 'Likelihood (1-3)', 
        range: [0.5, 3.5], 
        tickvals: [1, 2, 3], 
        gridcolor: gridColor, 
        color: textColor 
      },
      yaxis: { 
        title: 'Impact (1-3)', 
        range: [0.5, 3.5], 
        tickvals: [1, 2, 3], 
        gridcolor: gridColor, 
        color: textColor 
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      height: 300,
      margin: { l: 60, r: 20, t: 40, b: 60 }
    }, { responsive: true, displayModeBar: false });

  }, [result]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-colors duration-300">
        <div ref={costChartRef} />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-colors duration-300">
        <div ref={materialChartRef} />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-colors duration-300">
        <div ref={riskChartRef} />
      </div>
    </div>
  );
};
