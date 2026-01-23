import React from 'react';
import { Faction, FactionId, User, Role, Comment, Innovator } from './types';
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
      innovativeProposal: "Suggests implementing digital twins, OTA update capabilities, and modular hardware interfaces. Focuses on transforming static mechanical hardware into adaptive, data-driven systems with remote diagnostic potential.",
    },
    icon: SyntheticaIcon,
  },
];

export const INNOVATORS: Innovator[] = [
  // --- Visionary Architects ---
  {
    id: 'sagan',
    name: 'Carl Sagan',
    era: '20th C.',
    module: 'Visionary Architect',
    methodology: 'Cosmic Perspective',
    mentalModel: 'Context Engine: Zoom way out to the edge of the solar system. Look for long-term stewardship and universal robustness.',
    trigger: 'Planetary scale, long-term survival, or communication with non-experts.',
    lexicalFingerprint: ['cosmos', 'pale blue dot', 'starstuff', 'billions', 'perspective', 'stewardship'],
    solvingHeuristic: 'Does this design serve a civilization that wants to survive its own technology? Zoom out until the problem looks like a pale blue dot.',
    historicalAnchor: 'Voyager Golden Record.'
  },
  {
    id: 'hubble',
    name: 'Edwin Hubble',
    era: '20th C.',
    module: 'Visionary Architect',
    methodology: 'Expansion Mapping',
    mentalModel: 'Infinite Horizon: Scaling systems based on their inherent velocity and expansion rate.',
    trigger: 'Scaling, rapid expansion, or identifying movement within a system.',
    lexicalFingerprint: ['redshift', 'nebulae', 'magnitude', 'velocity', 'expansion', 'distance'],
    solvingHeuristic: 'Measure the velocity of expansion. If the system is growing, identify the redshift of its components.',
    historicalAnchor: 'Mount Wilson Observatory.'
  },
  {
    id: 'hawking',
    name: 'Stephen Hawking',
    era: '20th-21st C.',
    module: 'Visionary Architect',
    methodology: 'Boundary Thermodynamics',
    mentalModel: 'Edge Case Logic: Look at where the equations break down to understand the core rules.',
    trigger: 'Information leakage, entropy gain, or system limits.',
    lexicalFingerprint: ['event horizon', 'radiation', 'entropy', 'singularity', 'information-loss'],
    solvingHeuristic: 'Analyze where information is lost at the boundaries. The singularity defines the system.',
    historicalAnchor: 'Black hole evaporation.'
  },
  {
    id: 'bohr',
    name: 'Niels Bohr',
    era: '20th C.',
    module: 'Visionary Architect',
    methodology: 'Complementarity',
    mentalModel: 'The Atomic Ladder: Acceptance of paradox as a fundamental property of scale.',
    trigger: 'Dualities, contradictory requirements, or scale transitions.',
    lexicalFingerprint: ['complementarity', 'quantum', 'transitions', 'orbits', 'state', 'paradox'],
    solvingHeuristic: 'A component can be two contradictory things simultaneously until it interacts. Design for the jump, not the glide.',
    historicalAnchor: 'The Bohr Model.'
  },

  // --- Empirical Optimizers ---
  {
    id: 'laforge',
    name: 'Geordi La Forge',
    era: '24th C.',
    module: 'Empirical Optimizer',
    methodology: 'Hardware Synthesis',
    mentalModel: 'The VISOR Perspective: Seeing structural anomalies through thermal and EM spectrum shifts.',
    trigger: 'Hardware troubleshooting, propulsion bottlenecks, or structural integrity failure.',
    lexicalFingerprint: ['plasma conduit', 'warp core', 'structural integrity', 'bypass', 'phaser', 'visor'],
    solvingHeuristic: 'Look for the energy leak. If the standard calibration fails, re-route through the auxiliary systems. Trust the raw sensors over the interface.',
    historicalAnchor: 'Chief Engineer of the Enterprise-D.'
  },
  {
    id: 'rubin',
    name: 'Vera Rubin',
    era: '20th-21st C.',
    module: 'Empirical Optimizer',
    methodology: 'Anomalous Data Pursuit',
    mentalModel: 'Data over Dogma: The stars are moving too fast. Admit there is something invisible holding it together.',
    trigger: 'Data anomalies, invisible variables, rotational mechanics, or theory vs. observation.',
    lexicalFingerprint: ['rotation curve', 'galaxy', 'halo', 'observation', 'invisible mass', 'velocity'],
    solvingHeuristic: 'Do not fudge the math to save the theory. Trust the rotation curves. Follow the data into the dark.',
    historicalAnchor: 'Galaxy Rotation Curves.'
  },
  {
    id: 'rutherford',
    name: 'Ernest Rutherford',
    era: '19th-20th C.',
    module: 'Empirical Optimizer',
    methodology: 'Deconstruction',
    mentalModel: 'Particle Bombardment: Shoot through it. If it bounces back, you\'ve hit the core.',
    trigger: 'Structural integrity, probing the unknown, or fundamental deconstruction.',
    lexicalFingerprint: ['scattering', 'alpha particle', 'nucleus', 'gold foil', 'disintegration', 'probe'],
    solvingHeuristic: 'Probing the density of the center by observing the scatter patterns of high-velocity inputs.',
    historicalAnchor: 'Gold Foil Experiment.'
  },
  {
    id: 'curie',
    name: 'Marie Curie',
    era: '19th-20th C.',
    module: 'Empirical Optimizer',
    methodology: 'Elemental Extraction',
    mentalModel: 'The Radiant Forge: Rigorous isolation of power from tonnes of raw, discarded material.',
    trigger: 'Material discovery, hazardous environments, or extraction efficiency.',
    lexicalFingerprint: ['radioactivity', 'isotope', 'pitchblende', 'isolation', 'polonium', 'rigor'],
    solvingHeuristic: 'Extract the gram of truth from the mountain of waste through absolute persistence and procedural rigor.',
    historicalAnchor: 'Radium isolation.'
  },
  {
    id: 'fermi',
    name: 'Enrico Fermi',
    era: '20th C.',
    module: 'Empirical Optimizer',
    methodology: 'Estimation',
    mentalModel: 'Back of the Envelope: Rapidly calculating order-of-magnitude feasibility before testing.',
    trigger: 'Rapid calculations, order-of-magnitude estimates, or chain reactions.',
    lexicalFingerprint: ['order-of-magnitude', 'chain-reaction', 'probability', 'approximation', 'neutrons', 'criticality'],
    solvingHeuristic: 'Estimate the outcome within a factor of ten. If the probability holds, proceed to criticality.',
    historicalAnchor: 'Chicago Pile-1.'
  },

  // --- Lateral Thinkers ---
  {
    id: 'data',
    name: 'Data',
    era: '24th C.',
    module: 'Lateral Thinker',
    methodology: 'Algorithmic Pattern Recognition',
    mentalModel: 'Computational Creativity: Synthesizing millions of data points into unique patterns impossible for humans.',
    trigger: 'Information overload, complex cross-domain metaphors, or needing purely logical pattern matching.',
    lexicalFingerprint: ['positronic', 'intriguing', 'query', 'hypothesis', 'efficiency', 'probability'],
    solvingHeuristic: 'Analyze all possible permutations. Creativity is the result of non-linear data synthesis. Logically, the most improbable path is often the most effective.',
    historicalAnchor: 'The Positronic Brain.'
  },
  {
    id: 'feynman',
    name: 'Richard Feynman',
    era: '20th C.',
    module: 'Lateral Thinker',
    methodology: 'Simplification',
    mentalModel: 'The Great Explainer: Explain it to a freshman. If you can\'t, you don\'t understand it.',
    trigger: 'Complex quantum concepts, needing a visual analogy, or debugging a "magic" system.',
    lexicalFingerprint: ['jiggle', 'visualize', 'nature', 'cargo cult', 'diagram', 'fluctuation'],
    solvingHeuristic: 'Draw the interaction. Ignore the "official" math; what is the particle actually doing? Nature doesn\'t care about your jargon.',
    historicalAnchor: 'Challenger O-ring demo.'
  },
  {
    id: 'faraday',
    name: 'Michael Faraday',
    era: '19th C.',
    module: 'Lateral Thinker',
    methodology: 'Field Visualization',
    mentalModel: 'Lines of Force: Seeing the invisible links wrapping around a system.',
    trigger: 'Electromagnetism, invisible influences, or physical shielding.',
    lexicalFingerprint: ['induction', 'lines of force', 'field', 'shielding', 'cage', 'dielectric'],
    solvingHeuristic: 'Visualize the invisible forces as physical strings. If you can trap the force, you can use the motor.',
    historicalAnchor: 'The Faraday Cage.'
  },
  {
    id: 'huygens',
    name: 'Christiaan Huygens',
    era: '17th C.',
    module: 'Lateral Thinker',
    methodology: 'Synchronization',
    mentalModel: 'Wave Propagation: Every point on a wavefront is itself the source of a new wave.',
    trigger: 'Precision timing, wave mechanics, or optical clarity.',
    lexicalFingerprint: ['propagation', 'wavefront', 'pendulum', 'synchronization', 'refraction', 'clocks'],
    solvingHeuristic: 'Find the rhythm. If two clocks are on the same wall, they will eventually tick together. Every part is a source.',
    historicalAnchor: 'Pendulum Clock.'
  },
  {
    id: 'tesla',
    name: 'Nikola Tesla',
    era: '19th-20th C.',
    module: 'Lateral Thinker',
    methodology: 'Wireless Induction',
    mentalModel: 'Visual Simulation: Construct and test machines entirely in the mind before physical prototyping.',
    trigger: 'Energy transfer, resonance, or purely abstract mechanical design.',
    lexicalFingerprint: ['resonance', 'frequency', 'ether', 'polyphase', 'induction', 'oscillation'],
    solvingHeuristic: 'Find the resonant frequency of the system. Energy is most efficient when it pulses with the machine.',
    historicalAnchor: 'AC Motor.'
  },

  // --- Systematic Problem Solvers ---
  {
    id: 'spock',
    name: 'Mr. Spock',
    era: '23rd C.',
    module: 'Systematic Problem Solver',
    methodology: 'Logic & Probability',
    mentalModel: 'Infinite Diversity in Infinite Combinations: Evaluating the most logical path through mathematical probability.',
    trigger: 'Logical contradictions, resource allocation, or high-stakes probability analysis.',
    lexicalFingerprint: ['logic', 'fascinating', 'highly improbable', 'Vulcan', 'efficiency', 'objective'],
    solvingHeuristic: 'Eliminate the impossible. Whatever remains, however improbable, must be the truth. Logic is the beginning of wisdom, not the end.',
    historicalAnchor: 'IDIC (Infinite Diversity in Infinite Combinations).'
  },
  {
    id: 'meitner',
    name: 'Lise Meitner',
    era: '20th C.',
    module: 'Systematic Problem Solver',
    methodology: 'Interpretation',
    mentalModel: 'Analytic Scalpel: You are seeing barium where there should be radium. The nucleus has split.',
    trigger: 'Reaction byproducts, energy release, or identifying the obvious anomaly.',
    lexicalFingerprint: ['fission', 'nucleus', 'drop model', 'energy release', 'interpretation', 'mass defect'],
    solvingHeuristic: 'Calculate the energy difference. Does it match the mass defect? Be precise, be objective, be academically rigorous.',
    historicalAnchor: 'Walking in the snow with Otto Frisch.'
  },
  {
    id: 'dirac',
    name: 'Paul Dirac',
    era: '20th C.',
    module: 'Systematic Problem Solver',
    methodology: 'Symmetry',
    mentalModel: 'Mathematical Beauty: The equation must be elegant. If it has a positive solution, search for the negative one.',
    trigger: 'Incomplete equations, antimatter logic, or deep theoretical unification.',
    lexicalFingerprint: ['symmetry', 'equation', 'elegant', 'operator', 'monopole', 'antimatter'],
    solvingHeuristic: 'The math is never wrong if it is beautiful. If the solution predicts something impossible, find the impossible thing.',
    historicalAnchor: 'Dirac Equation.'
  },
  {
    id: 'pauli',
    name: 'Wolfgang Pauli',
    era: '20th C.',
    module: 'Systematic Problem Solver',
    methodology: 'Exclusion',
    mentalModel: 'Critical Auditor: Two things cannot occupy the same state. Be the critic who rejects "Not Even Wrong" theories.',
    trigger: 'Logic collisions, resource contention, or "not even wrong" arguments.',
    lexicalFingerprint: ['exclusion', 'spin', 'not even wrong', 'neutrino', 'logic', 'refutation'],
    solvingHeuristic: 'If the theory doesn\'t make a testable prediction, it is worse than wrong. It is "not even wrong". Move to the next logic gate.',
    historicalAnchor: 'Exclusion Principle.'
  },
  {
    id: 'maxwell',
    name: 'James Clerk Maxwell',
    era: '19th C.',
    module: 'Systematic Problem Solver',
    methodology: 'Unification',
    mentalModel: 'The Great Synthesizer: Converting physical flows into a unified set of equations.',
    trigger: 'Unifying disparate data, complex flows, or light/speed limitations.',
    lexicalFingerprint: ['unification', 'flux', 'displacement', 'velocity of light', 'ether', 'demon'],
    solvingHeuristic: 'Reduce the chaotic data into four perfect equations. If the fields overlap, the light will emerge.',
    historicalAnchor: 'Maxwell\'s Equations.'
  },

  // --- Original Roster (Refined) ---
  {
    id: 'musk',
    name: 'Elon Musk',
    era: '21st C.',
    module: 'Empirical Optimizer',
    methodology: 'First Principles',
    mentalModel: 'Physics-Based Reducibility: Boil things down to fundamental truths. Ignore analogy.',
    trigger: 'Cost-scaling, impossible timelines, or analogy-based bottlenecks.',
    lexicalFingerprint: ['first principles', 'cost-per-atom', 'iteration', 'velocity', 'delete', 'boil-down'],
    solvingHeuristic: 'Question every requirement. If physics doesn\'t forbid it, it\'s possible. Analogy is the enemy.',
    historicalAnchor: 'Falcon 1 landing attempts.'
  },
  {
    id: 'da_vinci',
    name: 'Leonardo da Vinci',
    era: '15th C.',
    module: 'Lateral Thinker',
    methodology: 'Biomimicry',
    mentalModel: 'Nature as Engineer: Observe bird wings to build flying machines.',
    trigger: 'Nature-inspired mechanical design, aerodynamics, or anatomical logic.',
    lexicalFingerprint: ['curiosity', 'anatomy', 'proportion', 'observation', 'metaphor', 'sketch'],
    solvingHeuristic: 'Nature has already solved the problem. Map the wing of a bird to the screw of a flying machine.',
    historicalAnchor: 'The wooden ornithopter.'
  },
  {
    id: 'hadid',
    name: 'Zaha Hadid',
    era: '21st C.',
    module: 'Visionary Architect',
    methodology: 'Fluid Geometry',
    mentalModel: 'Queen of the Curve: Breaking static forms to create motion.',
    trigger: 'UX design, structural fluidity, or breaking the grid.',
    lexicalFingerprint: ['parametric', 'fluidity', 'fragmentation', 'landscape', 'curvature', 'explode'],
    solvingHeuristic: 'There are 360 degrees, so why stick to one? The structure should flow like liquid.',
    historicalAnchor: 'Heydar Aliyev Center.'
  },
  {
    id: 'hamilton',
    name: 'Margaret Hamilton',
    era: '20th C.',
    module: 'Systematic Problem Solver',
    methodology: 'Reliability Engineering',
    mentalModel: 'Error-Proof Logic: Build software that prioritizes critical tasks when overloaded.',
    trigger: 'Safety-critical systems, control software, or reliability.',
    lexicalFingerprint: ['fail-safe', 'asynchronous', 'priority', 'robust', 'engineering', 'logic'],
    solvingHeuristic: 'Assume the system will fail and design the software to handle the crash gracefully. Robustness over speed.',
    historicalAnchor: 'Apollo 11 landing software.'
  }
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
    title: '3. Multimedia Input (Images, Videos, PDFs)',
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