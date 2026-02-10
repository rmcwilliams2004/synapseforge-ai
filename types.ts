import React from 'react';

export enum FactionId {
  ADVANCED_MATERIALS = 'advanced_materials',
  PRAGMATIC_PRODUCTION = 'pragmatic_production',
  SYSTEMS_AUTOMATION = 'systems_automation',
}

export enum EngineeringBranch {
  CHEMICAL = 'Chemical',
  CIVIL = 'Civil',
  ELECTRICAL = 'Electrical',
  MECHANICAL = 'Mechanical',
  AEROSPACE = 'Aerospace',
  NUCLEAR = 'Nuclear',
  BIO_MEDICAL = 'Biomedical',
  GENERAL = 'General Engineering'
}

export enum Role {
  Admin = 'Admin',
  Manager = 'Manager',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

export enum SubscriptionStatus {
  FREE = 'FREE',
  PRO_TRIAL = 'PRO_TRIAL',
  PRO_ACTIVE = 'PRO_ACTIVE',
  ENTERPRISE = 'ENTERPRISE',
  EXPIRED = 'EXPIRED'
}

export type ProtectionTypePref = 'PATENT' | 'COPYRIGHT' | 'TRADEMARK' | 'AI_RECOMMENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: Role;
  analysesRun: number;
  lastActive: string;
  company_name?: string;
  legal_identity?: string;
  use_company_attribution?: boolean;
  default_protection_pref?: ProtectionTypePref;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  certificatesGenerated?: number;
  branch?: EngineeringBranch;
  hasAcceptedLegal?: boolean;
  lastAcceptedLegal?: string;
  hasSignedPartnerProtocol?: boolean;
}

export interface InnovationCertificate {
    id: string;
    projectId: string;
    versionId: string;
    timestamp: string;
    hash: string;
    legalOwner: string;
    innovationType: 'SOFTWARE' | 'HARDWARE' | 'MATERIAL' | 'PROCESS' | 'PATENT' | 'COPYRIGHT' | 'TRADEMARK';
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPicture: string;
    text: string;
    createdAt: string;
    sectionId: string;
}

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
    verified?: boolean;
    confidence?: number;
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

export interface IndependentClaim {
  text: string;
  rationale: string;
}

export interface PatentApplication {
  title: string;
  abstract: string;
  background: string;
  summary: string;
  independent_claims: IndependentClaim[];
  dependent_claims: string[];
  novelty_points: string[];
  inventive_step_rationale: string;
  owner_of_record?: string;
  protection_type?: ProtectionTypePref;
  legal_hash?: string;
}

export interface SafetyAuditFinding {
    protocol: string;
    status: 'Pass' | 'Warn' | 'Fail';
    message: string;
}

export interface AnalysisResult {
  product_name: string;
  executive_summary: string;
  branch?: EngineeringBranch;
  faction_rationale: FactionRationale;
  material_suggestions: MaterialSuggestion[];
  manufacturing_analysis: ManufacturingProcess[];
  comparative_analysis: ComparativeAnalysis[];
  suggested_systems: SystemSuggestion[];
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
  patentApplication?: PatentApplication;
  safety_audit?: SafetyAuditFinding[];
}

export type SimulationType = 'FEA' | 'CFD' | 'THERMAL';

export interface SimulationResult {
    type: SimulationType;
    componentName: string;
    summary: string;
    keyFindings: string[];
    imageUrl: string | null;
    imagePrompt: string;
    isLoading: boolean;
    error: string | null;
}

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
    E: number;
    G_s: number;
    rho: number;
}

export interface RotorShaftElement {
    id: string;
    n: number;
    L: number;
    idl: number;
    odl: number;
    material: RotorMaterial;
}

export interface RotorDiskElement {
    id: string;
    n: number;
    m: number;
    Id: number;
    Ip: number;
}

export interface RotorBearingElement {
    id: string;
    n: number;
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

export interface PhdMetadata {
  governing_physics: string[];
  critical_constants: Record<string, string>;
  industry_standards: string[];
  peer_review_context?: string;
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: string;
  branch: EngineeringBranch;
  phd_metadata: PhdMetadata;
  content: string;
  summary: string;
  timestamp: string;
  embedding?: number[];
  isLoading?: boolean;
}

export interface ProjectVersion {
  versionId: string;
  createdAt: string;
  commitMessage: string;
  prompt: string;
  factionId: FactionId;
  result: AnalysisResult | null;
  fileUrls: string[];
  drawings?: GeneratedDrawing[];
  inspirationalImages?: GeneratedImage[];
  incorporatedSuggestions?: string[];
  rotorModel?: RotorModel;
}

export interface ProjectIndexEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  searchKeywords?: string;
}

export interface Project extends ProjectIndexEntry {
  history: ProjectVersion[];
  inspirationalImageHistory?: GeneratedImage[];
  knowledgeBase?: IngestedDocument[];
}

export interface EditorState {
  prompt: string;
  selectedFaction: Faction | null;
  tags: string[];
}

export type DeVinciState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error' | 'paused' | 'reconnecting' | 'reconnect_failed';

export interface TranscriptEntry {
    source: 'user' | 'devinci';
    text: string;
    isFinal: boolean;
    speakerName?: string;
}

export type DeVinciVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
export type VoiceCommanderState = 'idle' | 'listening' | 'thinking' | 'error';
export type AiChatState = 'idle' | 'thinking' | 'error';
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    user?: string;
    context?: string;
}

export interface CadComponent {
    name: string;
    shape: 'cube' | 'cylinder' | 'sphere' | 'complex';
    dimensions: { x: number; y: number; z: number; };
    position: { x: number; y: number; z: number; };
    children?: CadComponent[];
}

export interface CadData {
    assemblyName: string;
    units: 'mm' | 'inches';
    components: CadComponent[];
}

export type CadViewerTool = 'select' | 'measure' | 'section';

export interface CadAnnotation {
  id: string;
  x: number; y: number;
  text: string;
}

export interface CadMeasurement {
  id: string;
  type: string;
  distance: number;
  units: string;
}

export interface CadModification {
    name: string;
    changes: string[];
}
export interface CadComparisonResult {
    additions: string[];
    deletions: string[];
    modifications: CadModification[];
}

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

export interface SetupSuggestions {
  recommendedFactionId: FactionId;
  suggested_tags: string[];
}

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
        data: string;
    };
}

export interface ImageIdentificationResult {
  summary: string;
  sources: any[];
  imageUrl: string;
}

export interface ExplorationResult {
  suggestionText: string;
  explanation: string;
  imageUrl: string;
}

export interface PromptValidationResult {
  isClear: boolean;
  suggestion: string | null;
}

export interface NextStepSuggestion {
  title: string;
  rationale: string;
  actionId: string;
  icon: 'beaker' | 'cube' | 'bolt' | 'ruler' | 'chart' | 'dollar' | 'conversation' | 'play';
}

export interface InProgressState {
  projectName: string;
  prompt: string;
  tags: string[];
  factionId: FactionId;
  result: AnalysisResult;
  drawings: GeneratedDrawing[];
  inspirationalImages: GeneratedImage[];
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

/**
 * Interface representing a material entry in the tool suite.
 */
export interface Material {
    id: string;
    name: string;
    category: string;
    properties: Record<string, string>;
}

/**
 * Interface representing a standard component (like a screw or bearing).
 */
export interface StandardComponent {
    id: string;
    name: string;
    category: string;
    partNumber: string;
    specifications: Record<string, string>;
}

/**
 * Interface representing an engineering standard.
 */
export interface Standard {
    id: string;
    name: string;
    organization: string;
    publicationYear: number;
    description: string;
    status: 'Active' | 'Withdrawn';
}

/**
 * Interface representing a project artifact in revision control.
 */
export interface ProjectArtifact {
    id: string;
    name: string;
    type: string;
    version: string;
    modifiedBy: string;
    modifiedAt: string;
}

/**
 * Interface for an item in a Failure Mode and Effects Analysis (FMEA).
 */
export interface FmeaItem {
    id: number;
    processStep: string;
    failureMode: string;
    failureEffects: string;
    severity: number;
    potentialCauses: string;
    occurrence: number;
    currentControls: string;
    detection: number;
    rpn: number;
    recommendedAction: string;
    actionStatus: 'Pending' | 'In Progress' | 'Complete';
}

/**
 * A data point for Statistical Process Control (SPC) charts.
 */
export interface SpcDataPoint {
    sample: number;
    value: number;
}

/**
 * Status of an individual design or safety requirement.
 */
export enum RequirementStatus {
    Draft = 'Draft',
    Approved = 'Approved',
    Tested = 'Tested',
    Obsolete = 'Obsolete'
}

/**
 * Interface for a specific design requirement.
 */
export interface Requirement {
    id: string;
    text: string;
    status: RequirementStatus;
    linkedTo: string[];
}

/**
 * Data structure for Root Cause Analysis (RCA) including 5 Whys and Fishbone.
 */
export interface RcaData {
    problem: string;
    fiveWhys: string[];
    fishbone: {
        Manpower: string[];
        Methods: string[];
        Machines: string[];
        Materials: string[];
        Measurements: string[];
        Environment: string[];
    };
}

/**
 * Represents a single run of a simulation (e.g., FEA or CFD results).
 */
export interface SimulationRun {
    id: string;
    name: string;
    description: string;
    plotData: any;
}

/**
 * A script that can be executed in the automation engine.
 */
export interface Script {
    id: string;
    name: string;
    description: string;
    code: string;
}

/**
 * Data format for various engineering charts in the viz console.
 */
export interface ChartData {
    id: string;
    name: string;
    type: 'bode' | 'gantt' | 'stress-strain';
    data: any;
}