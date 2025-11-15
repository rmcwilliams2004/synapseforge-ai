import React from 'react';
import { Faction, FactionId, User, Role, Comment } from './types';
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
    { id: 'user-1', name: 'Alex (Admin)', email: 'alex@example.com', picture: `https://i.pravatar.cc/150?u=alex@example.com`, role: Role.Admin, analysesRun: 12, lastActive: now.toISOString() },
    { id: 'user-5', name: 'Devin (Manager)', email: 'devin@example.com', picture: `https://i.pravatar.cc/150?u=devin@example.com`, role: Role.Manager, analysesRun: 18, lastActive: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'user-2', name: 'Blake (Demo User)', email: 'blake@example.com', picture: `https://i.pravatar.cc/150?u=blake@example.com`, role: Role.Editor, analysesRun: 25, lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'user-4', name: 'Dana (Editor)', email: 'dana@example.com', picture: `https://i.pravatar.cc/150?u=dana@example.com`, role: Role.Editor, analysesRun: 8, lastActive: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'user-3', name: 'Casey (Viewer)', email: 'casey@example.com', picture: `https://i.pravatar.cc/150?u=casey@example.com`, role: Role.Viewer, analysesRun: 3, lastActive: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
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