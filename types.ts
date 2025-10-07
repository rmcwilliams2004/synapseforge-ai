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
  Editor = 'Editor',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  password?: string; // Added for authentication simulation
  role: Role;
  analysesRun: number;
  lastActive: string; // ISO string
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
export interface TechnicalSpecification {
    introduction: string;
    functional_requirements: string[];
    performance_targets: string[];
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

export interface Risk {
    risk: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    mitigation: string;
}
export interface RiskAssessment {
    overview: string;
    risks: Risk[];
}

export interface BillOfMaterialsItem {
    part_number: number;
    name: string;
    quantity: number;
    material: string;
    description: string;
}

export interface DrawingSpecification {
    standard: string;
    required_views: string[];
    key_dimensions_tolerances: string[];
    general_notes: string;
    bill_of_materials: BillOfMaterialsItem[];
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

export interface AnalysisResult {
  product_name: string;
  executive_summary: string;
  faction_rationale: FactionRationale;
  material_suggestions: MaterialSuggestion[];
  manufacturing_analysis: ManufacturingProcess[];
  comparative_analysis: ComparativeAnalysis[];
  suggested_systems: SystemSuggestion[];
  // Documentation
  technicalSpecification: TechnicalSpecification;
  assemblyInstructions: AssemblyInstructions;
  riskAssessment: RiskAssessment;
  drawingSpecification: DrawingSpecification;
  preliminaryCostEstimate: PreliminaryCostEstimate;
}

// --- PROJECT & VERSION CONTROL STRUCTURES ---

export interface GeneratedDrawing {
  id: string;
  prompt: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
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
}

export interface Project {
  id: string; // Stable ID for the project
  name: string; // The primary name of the project
  description: string;
  tags: string[];
  history: ProjectVersion[]; // Newest version is at index 0
  createdAt: string; // Initial creation date
  updatedAt: string; // Date of the latest version
}

// FIX: Add ProjectIndexEntry type for use across the application.
// This type is used for project listings to avoid loading the full 'history' for every project.
export type ProjectIndexEntry = Omit<Project, 'history'> & { searchKeywords?: string };

// --- DEVINCI CONVERSATIONAL AI ---
export type DeVinciState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error';

export interface TranscriptEntry {
    source: 'user' | 'devinci';
    text: string;
    isFinal: boolean;
}

export type DeVinciVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

// --- ADMIN DASHBOARD ---
export interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}