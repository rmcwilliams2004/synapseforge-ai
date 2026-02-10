import React from 'react';
import { Faction, FactionId, User, Role, Comment, Material, StandardComponent, Standard, ProjectArtifact, FmeaItem, SpcDataPoint, Requirement, RequirementStatus, RcaData, SimulationRun, Script, ChartData, SubscriptionStatus } from './types';
import { AetheriumIcon } from './components/icons/AetheriumIcon';
import { TerraFirmaIcon } from './components/icons/TerraFirmaIcon';
import { SyntheticaIcon } from './components/icons/SyntheticaIcon';

export const ENGINEERING_PHILOSOPHIES: Faction[] = [
  {
    id: FactionId.ADVANCED_MATERIALS,
    name: "Advanced Materials & Processes",
    focus: "High-Performance Materials, Cutting-Edge Manufacturing, Theoretical Limits",
    philosophy: "Focuses on leveraging the most advanced materials and manufacturing techniques available. Prioritizes performance, efficiency, and pushing the boundaries of what is physically possible, even if it incurs higher cost or complexity.",
    bias: {
      materials: "Emphasizes meta-materials, graphene composites, single-crystal alloys, advanced polymers, and materials with extreme thermal or electrical properties.",
      manufacturing: "Favors precision and novel techniques like atomic layer deposition, nano-imprinting, electron-beam welding, and additive manufacturing with exotic metals. The goal is ideal component geometry and material properties, regardless of scale.",
      innovativeProposal: "Proposes radical redesigns using next-generation materials to achieve step-changes in performance, longevity, or efficiency. Explores theoretical optimizations and future upgrade paths.",
    },
    icon: AetheriumIcon,
  },
  {
    id: FactionId.PRAGMATIC_PRODUCTION,
    name: "Pragmatic & Production-Oriented",
    focus: "Cost-Effectiveness, Scalability, Design for Manufacturing (DFM)",
    philosophy: "Grounded in proven engineering principles. Prioritizes durability, reliability, and cost-effective manufacturability using established, scalable technologies. Emphasizes solutions optimized for mass production and robust supply chains.",
    bias: {
      materials: "Focuses on standard high-strength steel alloys, aluminum, engineering plastics (ABS, Polycarbonate), and composites where cost is justified. Emphasizes material availability and ease of processing.",
      manufacturing: "Favors high-volume, established methods: injection molding, stamping, CNC machining, die casting. The primary challenge is minimizing cycle time, cost, and waste. Opportunities lie in process optimization and supply chain logistics.",
      innovativeProposal: "Suggests design modifications for cost reduction, improved assembly (e.g., part consolidation), or switching to more economical materials without sacrificing core function. Focuses on pragmatic, near-term improvements.",
    },
    icon: TerraFirmaIcon,
  },
  {
    id: FactionId.SYSTEMS_AUTOMATION,
    name: "Systems & Automation",
    focus: "Mechatronics, Control Systems, IoT Integration, Smart Design",
    philosophy: "Views products as integrated systems where electronics, software, and mechanics are intertwined. Prioritizes automation, smart features, data collection (IoT), and user interaction. Emphasizes modularity and system-level optimization.",
    bias: {
      materials: "Explores materials with integrated sensing capabilities, smart polymers, flexible electronics, and materials chosen for optimal sensor/actuator integration.",
      manufacturing: "Emphasizes automated assembly and testing, robotic calibration, and processes that allow for in-line customization or software flashing. Challenges lie in system integration and a software validation. Opportunities are in creating adaptive and self-diagnostic products.",
      innovativeProposal: "Focuses on integrating sensors for predictive maintenance, adding connectivity (IoT), improving control algorithms, or replacing mechanical components with mechatronic solutions for greater precision and flexibility.",
    },
    icon: SyntheticaIcon,
  },
];

const now = new Date();
export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Alex (Admin)', email: 'alex@example.com', picture: `https://i.pravatar.cc/150?u=alex@example.com`, role: Role.Admin, analysesRun: 12, lastActive: now.toISOString(), company_name: 'Forge Labs Global', legal_identity: 'Alex Forge', use_company_attribution: true, subscriptionStatus: SubscriptionStatus.ENTERPRISE },
    { id: 'user-5', name: 'Devin (Manager)', email: 'devin@example.com', picture: `https://i.pravatar.cc/150?u=devin@example.com`, role: Role.Manager, analysesRun: 18, lastActive: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), company_name: 'Aegis Engineering', legal_identity: 'Devin Vance', use_company_attribution: true, subscriptionStatus: SubscriptionStatus.PRO_ACTIVE },
    { id: 'user-2', name: 'Blake (Demo User)', email: 'blake@example.com', picture: `https://i.pravatar.cc/150?u=blake@example.com`, role: Role.Editor, analysesRun: 25, lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), company_name: 'Uniquity Tech', legal_identity: 'Blake Waters', use_company_attribution: false, subscriptionStatus: SubscriptionStatus.FREE },
    { id: 'user-4', name: 'Dana (Editor)', email: 'dana@example.com', picture: `https://i.pravatar.cc/150?u=dana@example.com`, role: Role.Editor, analysesRun: 8, lastActive: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), subscriptionStatus: SubscriptionStatus.FREE },
    { id: 'user-3', name: 'Casey (Viewer)', email: 'casey@example.com', picture: `https://i.pravatar.cc/150?u=casey@example.com`, role: Role.Viewer, analysesRun: 3, lastActive: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), subscriptionStatus: SubscriptionStatus.FREE },
];

export const MOCK_COMMENTS: Comment[] = [
    {
        id: 'c1',
        userId: 'user-4',
        userName: 'Dana (Editor)',
        userPicture: MOCK_USERS.find(u => u.id === 'user-4')?.picture || '',
        text: 'This looks promising, but have we considered the fatigue life of this material under cyclic loading?',
        createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        sectionId: 'ai_suggestions',
    },
    {
        id: 'c2',
        userId: 'user-2',
        userName: 'Blake (Demo User)',
        userPicture: MOCK_USERS.find(u => u.id === 'user-2')?.picture || '',
        text: 'Good point Dana. We should probably run an FEA simulation on the main housing to check stress concentrations.',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        sectionId: 'ai_suggestions',
    },
     {
        id: 'c3',
        userId: 'user-5',
        userName: 'Devin (Manager)',
        userPicture: MOCK_USERS.find(u => u.id === 'user-5')?.picture || '',
        text: 'Agreed. Let\'s prioritize that simulation. Also, what is the estimated cost impact of this material choice?',
        createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        sectionId: 'ai_suggestions',
    }
];


export const TOUR_STEPS = [
  {
    title: 'Welcome to SynapseForge AI!',
    content: 'This quick tour will guide you through the key features of the platform for reverse engineering and product analysis.',
    position: 'center',
  },
  {
    targetId: 'tour-step-1',
    title: '1. Select an Analytical Lens',
    content: "Start by choosing an 'Engineering Philosophy'. This lens determines the AI's perspective, influencing its suggestions on materials, manufacturing, and innovation.",
    position: 'bottom',
  },
  {
    targetId: 'tour-step-2',
    title: '2. Describe Your Concept',
    content: 'In this text area, describe the product or component you want to analyze. Be as detailed as possible for the best results.',
    position: 'bottom',
  },
  {
    targetId: 'tour-step-3',
    title: '3. Upload a File (Optional)',
    content: 'For a deeper analysis, you can upload a schematic, a photo of the product, or a PDF document containing technical details.',
    position: 'bottom',
  },
  {
    targetId: 'tour-step-4',
    title: '4. Engage the AI',
    content: "Once you've selected a lens and provided a description, click here to begin the analysis. The AI will generate a detailed report.",
    position: 'top',
  },
  {
    targetId: 'tour-step-5',
    title: '5. View the Analysis',
    content: 'Your comprehensive, AI-generated report will appear here, complete with rationale, material suggestions, manufacturing insights, and more.',
    position: 'bottom',
  },
  {
    title: "You're Ready to Go!",
    content: "That's it! You're now ready to use SynapseForge AI to deconstruct and innovate. Click 'Finish' to close this tour.",
    position: 'center',
  }
] as const;

// --- SYNAPSEFORGE TOOL SUITE CONSTANTS ---

export const SUITE_NAVIGATION = [
  {
    id: 'cm1',
    name: 'CM-1: Data & Resource Management',
    tools: [
      { id: 'cm1/material-selector', name: 'Material/Component Selector' },
      { id: 'cm1/standards-library', name: 'Standards & Code Library' },
      { id: 'cm1/drc', name: 'Document/Revision Control' },
      { id: 'cm1/unit-converter', name: 'Unit Converter & Calculator' },
    ],
  },
  {
    id: 'cm2',
    name: 'CM-2: Quality & Risk Analysis',
    tools: [
      { id: 'cm2/fmea', name: 'FMEA/Risk Analyzer' },
      { id: 'cm2/spc', name: 'Statistical Process Control (SPC)' },
      { id: 'cm2/req-mgmt', name: 'Requirements Management' },
      { id: 'cm2/rca', name: 'Root Cause Analysis (RCA) Tool' },
    ],
  },
  {
    id: 'cm3',
    name: 'CM-3: Modeling & Simulation',
    tools: [
      { id: 'cm3/pre-post', name: 'Universal Pre/Post-Processor' },
      { id: 'cm3/scripting', name: 'Scripting & Automation Engine' },
      { id: 'cm3/viz', name: 'Data Visualization Console' },
      { id: 'cm3/analysis', name: 'Structural Analysis (Beam)' },
    ],
  },
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'mat-1', name: 'Aluminum 6061-T6', category: 'Non-Ferrous Metal', properties: { 'Density': '2.7 g/cm³', 'Yield Strength': '276 MPa', 'Ultimate Tensile Strength': '310 MPa', 'Young\'s Modulus': '68.9 GPa', 'Thermal Conductivity': '167 W/m·K' } },
  { id: 'mat-2', name: 'Steel, AISI 1020', category: 'Ferrous Metal', properties: { 'Density': '7.87 g/cm³', 'Yield Strength': '350 MPa', 'Poisson\'s Ratio': '0.29', 'Melting Point': '1420-1500 °C' } },
  { id: 'mat-3', name: 'ABS Plastic', category: 'Polymer', properties: { 'Density': '1.06 g/cm³', 'Yield Strength': '40 MPa', 'Young\'s Modulus': '2 GPa' } },
  { id: 'mat-4', name: 'Carbon Fiber (Standard Modulus)', category: 'Composite', properties: { 'Density': '1.75 g/cm³', 'Ultimate Tensile Strength': '3.5 GPa', 'Young\'s Modulus': '230 GPa' } },
];

export const MOCK_COMPONENTS: StandardComponent[] = [
  { id: 'comp-1', name: 'M3x0.5 Socket Head Cap Screw', category: 'Fasteners', partNumber: '91292A109', specifications: { 'Length': '8mm', 'Material': 'Alloy Steel', 'Finish': 'Black Oxide' } },
  { id: 'comp-2', name: '608-2RS Deep Groove Ball Bearing', category: 'Bearings', partNumber: '608-2RS', specifications: { 'Bore': '8mm', 'OD': '22mm', 'Width': '7mm', 'Seals': '2 Rubber Seals' } },
  { id: 'comp-3', name: 'Arduino Nano', category: 'Electronics', partNumber: 'A000005', specifications: { 'Microcontroller': 'ATmega328P', 'Voltage': '5V', 'Clock Speed': '16 MHz' } },
];

export const MOCK_STANDARDS: Standard[] = [
  { id: 'std-1', name: 'D1.1/D1.1M:2020 - Structural Welding Code-Steel', organization: 'AISC', publicationYear: 2020, description: 'Specifies requirements for fabricating and erecting welded steel structures.', status: 'Active' },
  { id: 'std-2', name: '9001:2015 - Quality management systems', organization: 'ISO', publicationYear: 2015, description: 'Sets out the criteria for a quality management system.', status: 'Active' },
  { id: 'std-3', name: 'B1.1-2003 - Unified Inch Screw Threads', organization: 'ASTM', publicationYear: 2003, description: 'Defines the standard for inch-based screw threads.', status: 'Withdrawn' },
];

export const MOCK_ARTIFACTS: ProjectArtifact[] = [
  { id: 'art-1', name: 'Gearbox Housing Spec.docx', type: 'Specification', version: 'v2.1', modifiedBy: 'Dana (Editor)', modifiedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'art-2', name: 'Stress Analysis Report.pdf', type: 'Report', version: 'v1.0', modifiedBy: 'Blake (Demo User)', modifiedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'art-3', name: 'torque_calculation.py', type: 'Script', version: 'v1.2', modifiedBy: 'Alex (Admin)', modifiedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'art-4', name: 'Main Assembly.sldasm', type: 'CAD Link', version: 'v4.0', modifiedBy: 'Dana (Editor)', modifiedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
];

export const MOCK_FMEA_ITEMS: FmeaItem[] = [
  { id: 1, processStep: 'Torque Fastener', failureMode: 'Insufficient Torque', failureEffects: 'Vibrational loosening, component failure', severity: 8, potentialCauses: 'Operator error, tool malfunction', occurrence: 3, currentControls: 'Torque wrench calibration', detection: 4, rpn: 96, recommendedAction: 'Implement digital torque wrench with logging', actionStatus: 'Pending' },
  { id: 2, processStep: 'Adhesive Bonding', failureMode: 'Improper Curing', failureEffects: 'Weak bond, delamination', severity: 7, potentialCauses: 'Incorrect temperature, expired adhesive', occurrence: 2, currentControls: 'Visual inspection', detection: 6, rpn: 84, recommendedAction: 'Add temperature sensors to caring oven', actionStatus: 'In Progress' },
  { id: 3, processStep: 'PCB Soldering', failureMode: 'Solder Bridge', failureEffects: 'Electrical short, board failure', severity: 9, potentialCauses: 'Excess solder paste', occurrence: 4, currentControls: 'Automated Optical Inspection (AOI)', detection: 2, rpn: 72, recommendedAction: 'Refine solder paste stencil aperture', actionStatus: 'Complete' },
];

export const MOCK_SPC_DATA: SpcDataPoint[][] = Array.from({ length: 25 }, (_, i) =>
  Array.from({ length: 5 }, () => ({ sample: i + 1, value: 10 + (Math.random() - 0.5) * 1.5 + (i > 18 ? 0.8 : 0) })) 
);

export const MOCK_REQUIREMENTS: Requirement[] = [
  { id: 'REQ-001', text: 'The device shall operate continuously for 8 hours on a single charge.', status: RequirementStatus.Approved, linkedTo: ['TC-001', 'TC-002'] },
  { id: 'REQ-002', text: 'The device enclosure must withstand a 1-meter drop onto concrete.', status: RequirementStatus.Tested, linkedTo: ['TC-003'] },
  { id: 'REQ-003', text: 'The user interface shall be responsive within 200ms.', status: RequirementStatus.Draft, linkedTo: [] },
  { id: 'REQ-004', text: 'The device must comply with FCC Part 15 regulations.', status: RequirementStatus.Approved, linkedTo: ['TC-004'] },
];

export const MOCK_RCA_DATA: RcaData = {
  problem: 'Motor overheating during endurance testing.',
  fiveWhys: [
    'Why is the motor overheating? - Because it is drawing too much current.',
    'Why is it drawing too much current? - Because the load is higher than expected.',
    'Why is the load higher than expected? - Because of excessive friction in the gearbox.',
    'Why is there excessive friction? - Because the gear alignment is incorrect.',
    'Why is the alignment incorrect? - Because the housing tolerances are too loose.',
  ],
  fishbone: {
    Manpower: ['Inadequate training on assembly', 'Operator fatigue'],
    Methods: ['Incorrect assembly sequence', 'No verification step for alignment'],
    Machines: ['Worn tooling for housing', 'Calibration drift on press-fit machine'],
    Materials: ['Incorrect lubricant specified', 'Housing material warping under load'],
    Measurements: ['Gage not calibrated', 'Incorrect measurement technique'],
    Environment: ['High ambient temperature in test lab', 'Vibration from adjacent equipment'],
  },
};

const generateSurface = (peak: number, center: [number, number], width: number): number[][] => {
    const size = 50;
    const z = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const x = i - center[0];
            const y = j - center[1];
            const val = peak * Math.exp(-(x * x + y * y) / (2 * width * width));
            row.push(val);
        }
        z.push(row);
    }
    return z;
};

export const MOCK_SIMULATION_RUNS: SimulationRun[] = [
    {
        id: 'sim-1',
        name: 'Initial Analysis',
        description: 'FEA stress analysis of the main housing under a 500N load. Shows high stress concentration at mounting points.',
        plotData: {
            z: generateSurface(150, [25, 25], 5),
        }
    },
    {
        id: 'sim-2',
        name: 'Optimized Design',
        description: 'FEA stress analysis of the redesigned housing with added fillets. Stress is more evenly distributed, with a 30% reduction in peak stress.',
        plotData: {
            z: generateSurface(105, [25, 25], 8),
        }
    }
];

export const MOCK_SCRIPT: Script = {
    id: 'script-1',
    name: 'Material Strength Analysis',
    description: 'A Python script to analyze the yield strength of materials in the project database and identify the strongest one.',
    code: `
import json

# The 'project_data' variable is injected by the SynapseForge environment.
# It contains data like materials, components, etc.
materials_data = json.loads(project_data)

print("--- Material Strength Analysis ---")
print(f"Found {len(materials_data)} materials to analyze.\\n")

strongest_material = None
max_strength = 0

for material in materials_data:
    try:
        # Strength is a string like '276 MPa', we need to parse the number
        strength_str = material['properties'].get('Yield Strength', '0 MPa')
        strength_val = float(strength_str.split(' ')[0])
        
        print(f"Analyzing {material['name']}: {strength_val} MPa")
        
        if strength_val > max_strength:
            max_strength = strength_val
            strongest_material = material['name']
    except (ValueError, IndexError):
        print(f"Could not parse strength for {material['name']}")

print("\\n--- Analysis Complete ---")
if strongest_material:
    print(f"The strongest material is: {strongest_material} with a yield strength of {max_strength} MPa.")
else:
    print("No materials with valid strength data found.")
`
};

export const MOCK_CHART_DATA: ChartData[] = [
    {
        id: 'chart-1',
        name: 'Bode Plot (Frequency Response)',
        type: 'bode',
        data: {
            freq: Array.from({ length: 100 }, (_, i) => 10 ** (i / 20)),
            magnitude: Array.from({ length: 100 }, (_, i) => 20 * Math.log10(1 / Math.sqrt(1 + (10 ** (i / 20) / 100) ** 2))),
            phase: Array.from({ length: 100 }, (_, i) => -Math.atan(10 ** (i / 20) / 100) * (180 / Math.PI))
        }
    },
    {
        id: 'chart-2',
        name: 'Gantt Chart (Project Schedule)',
        type: 'gantt',
        data: [
            { Task: "Design Phase", Start: "2024-01-01", Finish: "2024-02-15", Resource: "Design Team" },
            { Task: "Prototype Build", Start: "2024-02-15", Finish: "2024-03-30", Resource: "Eng. Team" },
            { Task: "Testing & Validation", Start: "2024-04-01", Finish: "2024-05-15", Resource: "QA Team" },
            { Task: "Production Ramp-up", Start: "2024-05-15", Finish: "2024-07-01", Resource: "Mfg. Team" }
        ]
    },
    {
        id: 'chart-3',
        name: 'Stress-Strain Curve (AISI 1020 Steel)',
        type: 'stress-strain',
        data: {
            strain: [0, 0.001, 0.00175, 0.05, 0.1, 0.15, 0.2],
            stress: [0, 210, 350, 370, 400, 415, 420]
        }
    }
];
