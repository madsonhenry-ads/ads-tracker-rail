import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Search, Code, Globe, Database, ExternalLink, Shield, Fingerprint } from 'lucide-react';

interface Phase {
    id: number;
    title: string;
    description: string;
    icon: any;
    steps: string[];
    tools: string[];
}

export default function CloakingResearchGuide() {
    const [activePhase, setActivePhase] = useState<number | null>(null);

    const phases: Phase[] = [
        {
            id: 1,
            title: "Research Planning & Scoping",
            description: "Define boundaries and identify information sources.",
            icon: Search,
            steps: [
                "Define primary topic (e.g., 'cloaking techniques', 'tool analysis')",
                "Identify target sources (YouTube, Reddit, BlackHatWorld)",
                "Create list of 5-10 key search queries"
            ],
            tools: ["Search Engine", "Notepad"]
        },
        {
            id: 2,
            title: "Multi-Source Research",
            description: "Gather comprehensive info from diverse sources.",
            icon: Globe,
            steps: [
                "General Web Search for overview",
                "YouTube for tutorials and demos",
                "Reddit (r/FacebookAds, r/blackhat) for discussions",
                "Forums (BlackHatWorld, affLIFT) for technical details"
            ],
            tools: ["Browser", "YouTube", "Reddit"]
        },
        {
            id: 3,
            title: "URL Analysis & Extraction",
            description: "Analyze competitor URLs and extract content.",
            icon: Code,
            steps: [
                "Navigate to target URLs (use Funnel Mapper)",
                "Extract features, pricing, and claims",
                "Document technical specs (headers, scripts)"
            ],
            tools: ["Funnel Mapper", "DevTools"]
        },
        {
            id: 4,
            title: "Data Structuring",
            description: "Organize raw data into queryable knowledge.",
            icon: Database,
            steps: [
                "Categorize by Tool, Technique, or Detection Method",
                "Deduplicate findings",
                "Cross-reference multiple sources"
            ],
            tools: ["Spreadsheet", "Airtable"]
        },
        {
            id: 5,
            title: "Web Documentation",
            description: "Build interactive documentation site.",
            icon: BookOpen,
            steps: [
                "Select design (Cyberpunk, Modern)",
                "Generate assets (charts, diagrams)",
                "Build site structure",
                "Deploy"
            ],
            tools: ["Web Dev Tools", "React"]
        },
        {
            id: 6,
            title: "Agent Development",
            description: "Create specialized agents for automation.",
            icon: Shield,
            steps: [
                "Define agent capabilities (URL Analysis, Detection)",
                "Specify workflows",
                "Integrate with external APIs (URLScan)"
            ],
            tools: ["IDE", "Python/Node.js"]
        },
        {
            id: 7,
            title: "ID Research & Expansion",
            description: "Use extracted IDs to map the entire fraud network.",
            icon: Fingerprint,
            steps: [
                "Analyze ConvertAI Account ID (find all videos/domains)",
                "Track Facebook Pixel ID (find other campaigns)",
                "Investigate WordPress Page ID (find hidden pages)",
                "Cross-reference Player IDs to link entities"
            ],
            tools: ["Meta Ad Library", "Archive.org", "Spokeo/Reverse IP"]
        }
    ];

    const togglePhase = (id: number) => {
        setActivePhase(activePhase === id ? null : id);
    };

    return (
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Cloaking Research Workflow
            </h2>
            <p className="text-dark-400 text-sm mb-6">
                A structured workflow for analyzing cloaking techniques, detecting money pages, and gathering intelligence.
            </p>

            <div className="space-y-4">
                {phases.map((phase) => (
                    <div
                        key={phase.id}
                        className={`border rounded-xl transition-all duration-200 ${activePhase === phase.id
                            ? 'bg-dark-900/50 border-purple-500/30'
                            : 'bg-dark-900/20 border-dark-700 hover:border-dark-600'
                            }`}
                    >
                        <button
                            onClick={() => togglePhase(phase.id)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activePhase === phase.id ? 'bg-purple-500/10 text-purple-400' : 'bg-dark-800 text-dark-400'
                                    }`}>
                                    <phase.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-medium ${activePhase === phase.id ? 'text-white' : 'text-dark-200'
                                        }`}>
                                        Step {phase.id}: {phase.title}
                                    </h3>
                                    <p className="text-xs text-dark-500 mt-0.5">{phase.description}</p>
                                </div>
                            </div>
                            {activePhase === phase.id ? (
                                <ChevronDown className="w-5 h-5 text-purple-400" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-dark-500" />
                            )}
                        </button>

                        {activePhase === phase.id && (
                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                <div className="h-px bg-dark-700/50 mb-4" />

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Actions</h4>
                                        <ul className="space-y-2">
                                            {phase.steps.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-dark-300">
                                                    <div className="min-w-[4px] h-[4px] rounded-full bg-purple-500 mt-2" />
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Tools</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {phase.tools.map((tool, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-dark-800 border border-dark-700 rounded text-xs text-dark-400"
                                                >
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Pro Tip
                </h4>
                <p className="text-xs text-purple-300/80">
                    Use the <strong>Funnel Mapper</strong> above to perform "Phase 3: URL Analysis". It simulates real devices to bypass cloakers and reveal true money pages.
                </p>
            </div>
        </div>
    );
}
