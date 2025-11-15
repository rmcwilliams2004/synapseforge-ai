import React from 'react';

export enum FactionId {
  ADVANCED_MATERIALS = 'advanced_materials',
  PRAGMATIC_PRODUCTION = 'pragmatic_production',
  SYSTEMS_AUTOMATION = 'systems_automation',
}

export interface Faction {
  id: FactionId;
  name: string;
  focus: string;
  philosophy: string;
  bias: {
    materials: string;
    manufacturing: string;
    innovativeProposal: string;
  };
  icon: React.FC<{ className?: string }>;
}

// --- COLLABORATION ---
export enum Role {
  Admin = 'Admin',
  Manager = 'Manager',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: Role;
  analysesRun: number;
  lastActive: string; // ISO string
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPicture: string;
    text: string;
    createdAt: string; // ISO string
    sectionId: string; // To associate comment with a report section
}


// --- CORE ANALYSIS DATA STRUCTURES ---

export interface FactionRationale {
  pros: string[];
  cons: string[];
  summary: string;
}

export interface MaterialProperties {
    density: string;
    tensile_strength: string;
    melting_point: string;
    conductivity: string;
}

export interface MaterialSuggestion {
  name: string;
  rationale: string;
  properties: MaterialProperties;
}

export interface ManufacturingProcess {
  name: string;
  description: string;
}

export interface ComparativeAnalysis {
    alternative: string;
    advantages: string;
    disadvantages: string;
}

export interface SystemSuggestion {
  name: string;
  description: string;
  rationale: string;
}

// --- GENERATED DOCUMENTATION STRUCTURES ---
export interface RequirementSpecification {
    introduction: string;
    functional_requirements: string[];
    non_functional_requirements: string[];
    performance_criteria: string[];
    constraints: string[];
}

export interface DesignDocument {
    system_architecture: string;
    component_designs: {
        component_name: string;
        design_details: string;
    }[];
    design_rationale: string;
}

export interface TestPlan {
    overview: string;
    test_cases: {
        id: string;
        description: string;
        procedure: string;
        expected_results: string;
    }[];
}

export interface SoftwareDocumentation {
    architecture_overview: string;
    api_documentation: {
        endpoint: string;
        description: string;
        request: string;
        response: string;
    }[];
}

export interface SimulationAndAnalysisReport {
    simulation_type: string;
    methodology: string;
    results_summary: string;
    key_findings: string[];
}

export interface ComplianceAndSafety {
    overview: string;
    applicable_standards: string[];
    safety_risks: {
        risk: string;
        likelihood: 'Low' | 'Medium' | 'High';
        impact: 'Low' | 'Medium' | 'High';
        mitigation: string;
    }[];
}


export interface BillOfMaterialsItem {
    part_number: number;
    name: string;
    quantity: number;
    material: string;
    description: string;
}
export type BillOfMaterials = BillOfMaterialsItem[];

export interface ProcurementInfo {
    supplier: string;
    url: string;
    estimatedCost: string;
    leadTime: string;
}


export interface DrawingSpecification {
    standard: string;
    required_views: string[];
    key_dimensions_tolerances: string[];
    general_notes: string;
}

export interface CostComponent {
    item: string;
    cost_estimate: string;
    rationale: string;
}

export interface PreliminaryCostEstimate {
    total_estimate_range: string;
    confidence: 'Low' | 'Medium' | 'High';
    assumptions: string[];
    breakdown: CostComponent[];
}

export interface EngineeringChangeOrder {
    eco_id: string;
    change_title: string;
    description: string;
    reason_for_change: string;
    impact_analysis: string;
}

export interface AnalysisResult {
  product_name: string;
  executive_summary: string;
  faction_rationale: FactionRationale;
  material_suggestions: MaterialSuggestion[];
  manufacturing_analysis: ManufacturingProcess[];
  comparative_analysis: ComparativeAnalysis[];
  suggested_systems: SystemSuggestion[];
  // Documentation
  requirementSpecification: RequirementSpecification;
  designDocument: DesignDocument;
  drawingSpecification: DrawingSpecification;
  testPlan: TestPlan;
  softwareDocumentation?: SoftwareDocumentation;
  simulationAndAnalysisReport: SimulationAndAnalysisReport;
  assemblyInstructions: AssemblyInstructions;
  billOfMaterials: BillOfMaterials;
  preliminaryCostEstimate: PreliminaryCostEstimate;
  complianceAndSafety: ComplianceAndSafety;
  engineeringChangeOrders: EngineeringChangeOrder[];
}

// --- ADVANCED SIMULATION ---
export type SimulationType = 'FEA' | 'CFD' | 'THERMAL';

export interface SimulationResult {
    type: SimulationType;
    componentName: string;
    summary: string;
    keyFindings: string[];
    imageUrl: string | null;
    imagePrompt: string; // The prompt used to generate the image
    isLoading: boolean;
    error: string | null;
}


// --- PROJECT & VERSION CONTROL STRUCTURES ---

export interface GeneratedDrawing {
  id: string;
  prompt: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
  includeInReport: boolean;
  isCoverImage?: boolean;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
  aspectRatio?: string;
  includeInReport: boolean;
  isCoverImage?: boolean;
}


export interface AssemblyInstructionStep {
    step: number;
    action: string;
    parts_needed: string[];
}
export interface AssemblyInstructions {
    overview: string;
    steps: AssemblyInstructionStep[];
}

export interface RotorMaterial {
    name: string;
    E: number; // Young's Modulus
    G_s: number; // Shear Modulus
    rho: number; // Density
}

export interface RotorShaftElement {
    id: string;
    n: number;
    L: number; // Length
    idl: number; // Inner diameter
    odl: number; // Outer diameter
    material: RotorMaterial;
}

export interface RotorDiskElement {
    id: string;
    n: number; // Node position
    m: number; // Mass
    Id: number; // Diametral moment of inertia
    Ip: number; // Polar moment of inertia
}

export interface RotorBearingElement {
    id: string;
    n: number; // Node position
    kxx: number; kxy: number;
    kyx: number; kyy: number;
    cxx: number; cxy: number;
    cyx: number; cyy: number;
}

export interface RotorModel {
    shaft: RotorShaftElement[];
    disks: RotorDiskElement[];
    bearings: RotorBearingElement[];
}


export interface ProjectVersion {
  versionId: string;
  createdAt: string; // ISO string
  commitMessage: string; // e.g., "Initial analysis", "Incorporated material suggestions"
  prompt: string;
  factionId: FactionId;
  result: AnalysisResult | null;
  fileUrls: string[]; // data URLs
  drawings?: GeneratedDrawing[]; // Optional for backward compatibility
  inspirationalImages?: GeneratedImage[];
  incorporatedSuggestions?: string[]; // New field to track used suggestions
  rotorModel?: RotorModel;
}

export interface Project {
  id: string; // Stable ID for the project
  name: string; // The primary name of the project
  description: string;
  tags: string[];
  history: ProjectVersion[]; // Newest version is at index 0
  createdAt: string; // Initial creation date
  updatedAt: string; // Date of the latest version
  inspirationalImageHistory?: GeneratedImage[];
}

export interface EditorState {
  prompt: string;
  selectedFaction: Faction | null;
  tags: string[];
}


// FIX: Add ProjectIndexEntry type for use across the application.
// This type is used for project listings to avoid loading the full 'history' for every project.
export type ProjectIndexEntry = Omit<Project, 'history'> & { searchKeywords?: string };

// --- DEVINCI CONVERSATIONAL AI ---
export type DeVinciState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error' | 'paused' | 'reconnecting' | 'reconnect_failed';

export interface TranscriptEntry {
    source: 'user' | 'devinci';
    text: string;
    isFinal: boolean;
    speakerName?: string; // Add speakerName for multi-user simulation
}

export type DeVinciVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

// --- VOICE COMMANDER ---
export type VoiceCommanderState = 'idle' | 'listening' | 'thinking' | 'error';


// --- ADMIN DASHBOARD ---
export interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    user?: string; // Name of the user performing the action
    context?: string; // Name of the project or item affected
}

// --- CAD EXPORT SIMULATION ---
export interface CadComponent {
    name: string;
    shape: 'cube' | 'cylinder' | 'sphere' | 'complex';
    dimensions: {
        x: number;
        y: number;
        z: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
    children?: CadComponent[];
}

export interface CadData {
    assemblyName: string;
    units: 'mm' | 'inches';
    components: CadComponent[];
}

// --- CAD VIEWER ---
export type CadViewerTool = 'select' | 'measure' | 'section';

export interface CadAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface CadMeasurement {
  id: string;
  type: string; // e.g., 'V-V', 'V-S', 'S-S' for Vertex-Vertex, Vertex-Surface, etc.
  distance: number;
  units: string;
}

// --- CAD COMPARISON ---
export interface CadModification {
    name: string;
    changes: string[];
}
export interface CadComparisonResult {
    additions: string[];
    deletions: string[];
    modifications: CadModification[];
}


// --- GOOGLE EXPORT SIMULATION ---
export type GoogleDocContentItem = {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'bulletList' | 'table' | 'image';
  text?: string;
  items?: string[];
  headers?: string[];
  rows?: (string|number)[][];
  url?: string;
  caption?: string;
  isMuted?: boolean;
};
export type GoogleDocContent = GoogleDocContentItem[];


// --- SETUP ASSISTANT ---
export interface SetupSuggestions {
  recommendedFactionId: FactionId;
  suggestedTags: string[];
}

// FIX: Add Fabrication Planner types to resolve compilation errors.
// --- FABRICATION PLANNER ---
export type ManufacturingProcessType = 'CNC Machining' | '3D Printing' | 'Sheet Metal';

export interface GCodeSummary {
    summary: string;
    keyOperations: string[];
}

export interface DfmCheck {
    component: string;
    issue: string;
    recommendation: string;
}

export interface FabricationPlan {
    dfmChecks: DfmCheck[];
    tolerancingNotes: string[];
    processSpecificOutput: {
        title: string;
        data: string; // e.g., G-code for CNC, slicer settings for 3D printing
    };
}

// --- IMAGE IDENTIFICATION ---
export interface ImageIdentificationResult {
  summary: string;
  sources: any[]; // The structure from groundingChunks
  imageUrl: string; // The data URL of the uploaded image
}

// --- SUGGESTION EXPLORATION ---
export interface ExplorationResult {
  suggestionText: string;
  explanation: string;
  imageUrl: string;
}

// --- PROMPT VALIDATION ---
export interface PromptValidationResult {
  isClear: boolean;
  suggestion: string | null;
}

// --- NEXT STEP ASSISTANT ---
export interface NextStepSuggestion {
  title: string;
  rationale: string;
  actionId: string;
  icon: 'beaker' | 'cube' | 'bolt' | 'ruler' | 'chart' | 'dollar' | 'conversation' | 'play';
}

// --- IN-PROGRESS SESSION ---
export interface InProgressState {
  projectName: string;
  prompt: string;
  factionId: FactionId;
  result: AnalysisResult;
  drawings: GeneratedDrawing[];
  inspirationalImages: GeneratedImage[];
}