import { AnalysisResult, GeneratedDrawing, Project } from '../types';

// This is a global variable from the script tag in index.html
declare const jspdf: any;

const { jsPDF } = jspdf;

const addHeaderFooter = (doc: any, projectName: string, pageNumber: number, totalPages: number) => {
    const header = `SynapseForge AI: Reverse Engineering Report - ${projectName}`;
    const footer = `Page ${pageNumber} of ${totalPages}`;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(header, 15, 10);
    doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });
};

export const exportFullReportPDF = (project: Project, drawings: GeneratedDrawing[]) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const latestVersion = project.history[0];
    const projectName = project.name;
    const result = latestVersion.result;
    
    if (!result) {
        alert("Cannot generate a report for a project with no analysis results.");
        return;
    }

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (requiredHeight = 10) => {
        if (y + requiredHeight > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
    };

    const addText = (text: string | string[], options: any = {}, addHeight = 4) => {
        checkPageBreak();
        const splitText = doc.splitTextToSize(text, maxLineWidth);
        doc.text(splitText, margin, y, options);
        const textHeight = doc.getTextDimensions(splitText).h;
        y += textHeight + addHeight;
    };
    
    const addSectionTitle = (title: string) => {
        y += y > 25 ? 12 : 0;
        checkPageBreak(20);
        doc.setFontSize(16);
        doc.setTextColor(6, 182, 212); // brand-cyan
        addText(title, {}, 0);
        y+= 2;
        doc.setDrawColor(100);
        doc.line(margin, y - 1, pageWidth - margin, y - 1);
        doc.setFontSize(11);
        doc.setTextColor(40);
        y += 5;
    };
    
    const addSubTitle = (title: string) => {
        y += 6;
        checkPageBreak(10);
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80);
        addText(title);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40);
        y -= 2;
    };

    // --- Title Page ---
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text('Reverse Engineering & Product Analysis Report', pageWidth / 2, 120, { align: 'center' });
    
    doc.setFontSize(22);
    const projectTitleLines = doc.splitTextToSize(projectName, 180);
    doc.text(projectTitleLines, pageWidth / 2, 140, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 160 + (projectTitleLines.length * 10), { align: 'center' });


    // --- Start Content ---
    doc.addPage();
    y = 20;

    addSectionTitle('Executive Summary');
    addText(result.executive_summary);

    addSectionTitle('Faction Rationale');
    addSubTitle('Pros');
    addText(result.faction_rationale.pros.map(p => `- ${p}`));
    addSubTitle('Cons');
    addText(result.faction_rationale.cons.map(c => `- ${c}`));
    addSubTitle('Summary');
    addText(result.faction_rationale.summary);
    
    addSectionTitle('Material Suggestions');
    result.material_suggestions.forEach(mat => {
        addSubTitle(mat.name);
        addText(`Rationale: ${mat.rationale}`);
        (doc as any).autoTable({
            startY: y,
            head: [['Property', 'Value']],
            body: [
                ['Density', mat.properties.density],
                ['Tensile Strength', mat.properties.tensile_strength],
                ['Melting Point', mat.properties.melting_point],
                ['Conductivity', mat.properties.conductivity],
            ],
            theme: 'striped',
            headStyles: { fillColor: [80, 80, 80] },
            styles: { fontSize: 9, cellPadding: 2 },
            tableWidth: 'auto',
            margin: { left: margin }
        });
        y = (doc as any).autoTable.previous.finalY + 8;
    });

    addSectionTitle('Manufacturing Analysis');
    result.manufacturing_analysis.forEach(proc => {
        addSubTitle(proc.name);
        addText(proc.description);
    });

    addSectionTitle('Comparative Analysis');
    (doc as any).autoTable({
        startY: y,
        head: [['Alternative', 'Advantages', 'Disadvantages']],
        body: result.comparative_analysis.map(c => [
            c.alternative, c.advantages, c.disadvantages
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
         styles: { fontSize: 9 }
    });
    y = (doc as any).autoTable.previous.finalY + 10;
    
    addSectionTitle('AI System Suggestions');
     result.suggested_systems.forEach(sys => {
        addSubTitle(sys.name);
        addText(`Description: ${sys.description}`);
        addText(`Rationale: ${sys.rationale}`);
    });

    // --- All other documentation sections ---
    // This could be made more modular in a real app
    
    addSectionTitle('Technical Specification');
    addSubTitle('Introduction');
    addText(result.technicalSpecification.introduction);
    addSubTitle('Functional Requirements');
    addText(result.technicalSpecification.functional_requirements.map(r => `- ${r}`));
    addSubTitle('Performance Targets');
    addText(result.technicalSpecification.performance_targets.map(t => `- ${t}`));

    addSectionTitle('Risk Assessment');
    (doc as any).autoTable({
        startY: y,
        head: [['Risk', 'Likelihood', 'Impact', 'Mitigation']],
        body: result.riskAssessment.risks.map(r => [
            r.risk, r.likelihood, r.impact, r.mitigation
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
    });
    y = (doc as any).autoTable.previous.finalY + 10;
    
    if (drawings && drawings.length > 0) {
        const successfulDrawings = drawings.filter(d => d.url);
        if (successfulDrawings.length > 0) {
            checkPageBreak(20);
            addSectionTitle('Generated 2D Technical Drawings');
            successfulDrawings.forEach((drawing, index) => {
                // Each drawing gets its own page to ensure it fits well
                if (index > 0) { // Add a page before the second drawing onwards
                   doc.addPage();
                   y = 20;
                }
                addSubTitle(`Drawing ${index + 1}: ${drawing.prompt}`);
                try {
                    const imgWidth = maxLineWidth;
                    const imgHeight = (imgWidth / 16) * 9;
                    checkPageBreak(imgHeight + 10);
                    doc.addImage(drawing.url, 'PNG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 10;
                } catch (e) {
                    console.error("Failed to add image to PDF:", e);
                    addText(`Error: The drawing for "${drawing.prompt}" could not be embedded.`, { color: 'red' });
                }
            });
        }
    }
    
    addSectionTitle('2D Drawing Specification');
    addSubTitle('General Specifications');
    addText(`Drawing Standard: ${result.drawingSpecification.standard || 'Not Specified'}`);

    addSubTitle('Required Views');
    addText(result.drawingSpecification.required_views.length > 0 ? result.drawingSpecification.required_views.map(v => `- ${v}`) : 'No specific views requested.');

    addSubTitle('Key Dimensions & Tolerances');
    addText(result.drawingSpecification.key_dimensions_tolerances.length > 0 ? result.drawingSpecification.key_dimensions_tolerances.map(d => `- ${d}`) : 'No key dimensions or tolerances specified.');

    addSubTitle('General Notes');
    addText(result.drawingSpecification.general_notes || 'No general notes provided.');

    addSubTitle('Bill of Materials (BOM)');
    (doc as any).autoTable({
        startY: y,
        head: [['#', 'Name', 'Qty', 'Material', 'Description']],
        body: result.drawingSpecification.bill_of_materials.map(b => [
            b.part_number, b.name, b.quantity, b.material, b.description
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
    });
    y = (doc as any).autoTable.previous.finalY + 10;


    // Add headers and footers to all content pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        addHeaderFooter(doc, projectName, i - 1, pageCount - 1);
    }
    
    doc.save(`${projectName.replace(/\s/g, '_')}_Analysis_Report.pdf`);
};

// Placeholder for individual exports if they are re-added
export const exportCostEstimatePDF = (result: AnalysisResult, projectName: string) => { /* ... */ };
export const exportRiskAssessmentPDF = (result: AnalysisResult, projectName: string) => { /* ... */ };
export const exportDrawingSpecPDF = (result: AnalysisResult, projectName: string) => { /* ... */ };