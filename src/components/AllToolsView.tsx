import React, { useState } from 'react';
import { 
  FileText, Search, Type, List, Tag, CheckCircle2, 
  AlertCircle, ArrowRight, Settings2, Sparkles, FileDown, 
  Wand2, Image as ImageIcon, BarChart, ShieldCheck, Lock
} from 'lucide-react';

interface AllToolsViewProps {
  isSubscriptionActive?: boolean;
  onOpenLocked?: () => void;
}

interface ToolCard {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const TOOLS: ToolCard[] = [
  // Keyword Tools
  { id: 'kw-cluster', category: 'Keyword Tools', title: 'Keyword Cluster Generator', description: 'Group semantically related keywords into high-ranking clusters.', icon: List, color: 'text-indigo-400' },
  { id: 'kw-translator', category: 'Keyword Tools', title: 'Keyword Translator', description: 'Translate keywords into 15+ languages for global marketplaces.', icon: Type, color: 'text-indigo-400' },
  { id: 'kw-density', category: 'Keyword Tools', title: 'Keyword Density Checker', description: 'Analyze keyword frequency to prevent spam penalties.', icon: BarChart, color: 'text-indigo-400' },
  { id: 'kw-duplicate', category: 'Keyword Tools', title: 'Duplicate Checker', description: 'Find and remove redundant tags from your metadata.', icon: Tag, color: 'text-indigo-400' },

  // Title/Description Tools
  { id: 'title-opt', category: 'Title & Description', title: 'Title Optimizer', description: 'Rewrite titles to maximize CTR and search relevance.', icon: Type, color: 'text-emerald-400' },
  { id: 'desc-opt', category: 'Title & Description', title: 'Description Optimizer', description: 'Generate engaging descriptions that convert browsers to buyers.', icon: FileText, color: 'text-emerald-400' },
  { id: 'meta-val', category: 'Title & Description', title: 'Metadata Validator', description: 'Ensure metadata meets strict agency character limits.', icon: ShieldCheck, color: 'text-emerald-400' },

  // CSV Tools
  { id: 'csv-val', category: 'CSV & Export', title: 'CSV Validator', description: 'Pre-flight check your CSV for formatting errors before uploading.', icon: CheckCircle2, color: 'text-amber-400' },
  { id: 'csv-prev', category: 'CSV & Export', title: 'CSV Preview', description: 'Visualize how your metadata will look in a spreadsheet.', icon: FileDown, color: 'text-amber-400' },
  { id: 'csv-repair', category: 'CSV & Export', title: 'CSV Repair Tool', description: 'Auto-fix common delimiter and encoding issues in CSVs.', icon: Settings2, color: 'text-amber-400' },

  // File Tools
  { id: 'file-clean', category: 'File Management', title: 'Filename Cleaner', description: 'Remove special characters and spaces for agency compliance.', icon: ImageIcon, color: 'text-blue-400' },
  { id: 'file-gen', category: 'File Management', title: 'Filename Generator', description: 'Auto-generate descriptive SEO filenames from titles.', icon: ImageIcon, color: 'text-blue-400' },
  { id: 'file-batch', category: 'File Management', title: 'Batch Rename', description: 'Rename thousands of files sequentially in one click.', icon: List, color: 'text-blue-400' },

  // SEO Tools
  { id: 'seo-score', category: 'SEO Intelligence', title: 'SEO Score Analyzer', description: 'Get a 1-100 score predicting commercial performance.', icon: Search, color: 'text-purple-400' },
  { id: 'seo-intent', category: 'SEO Intelligence', title: 'Commercial Intent Checker', description: 'Analyze if tags attract buyers or just browsers.', icon: BarChart, color: 'text-purple-400' },
  { id: 'seo-cat', category: 'SEO Intelligence', title: 'Category Recommender', description: 'AI suggests the best primary/secondary categories.', icon: List, color: 'text-purple-400' },

  // AI Prompt Tools
  { id: 'ai-opt', category: 'AI Generation', title: 'AI Prompt Optimizer', description: 'Enhance Midjourney/DALL-E prompts for stock photography.', icon: Sparkles, color: 'text-pink-400' },
  { id: 'ai-lib', category: 'AI Generation', title: 'Prompt Library', description: 'Save and organize your best performing AI prompts.', icon: FileText, color: 'text-pink-400' },
  
  // Compliance
  { id: 'comp-check', category: 'Agency Compliance', title: 'Marketplace Compliance', description: 'Verify terms against Adobe, Shutterstock, and Getty rules.', icon: ShieldCheck, color: 'text-teal-400' },
];

export const AllToolsView: React.FC<AllToolsViewProps> = ({ isSubscriptionActive = false, onOpenLocked }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...Array.from(new Set(TOOLS.map(t => t.category)))];

  const filteredTools = TOOLS.filter(tool => {
    const matchesCat = activeCategory === 'All' || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToolClick = () => {
    if (!isSubscriptionActive && onOpenLocked) {
      onOpenLocked();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded">
            <Wand2 className="w-3.5 h-3.5" /> Contributor Utilities
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StockAI Tools</h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            A comprehensive suite of 15+ enterprise tools to clean, optimize, and validate your microstock metadata before uploading to agencies.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer ${
              activeCategory === cat 
                ? 'bg-zinc-100 text-black shadow-sm' 
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => {
          const Icon = tool.icon;
          return (
            <div 
              key={tool.id}
              onClick={handleToolClick}
              className="group relative bg-[#121214] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 shadow-sm hover:shadow-lg overflow-hidden"
            >
              {!isSubscriptionActive && (
                <div className="absolute top-3 right-3 text-amber-500/50 group-hover:text-amber-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-start gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div className="space-y-1 pt-0.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{tool.category}</div>
                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{tool.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    {tool.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredTools.length === 0 && (
        <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-zinc-600" />
          <p>No tools found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
