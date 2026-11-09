import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  DollarSign,
  Coffee,
  ArrowLeft,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { SubPrototypeTab } from './types';
import { AssetCandidateComparison } from './AssetCandidateComparison';
import { PrototypeAEnvironment } from './PrototypeAEnvironment';
import { PrototypeBSharedArea } from './PrototypeBSharedArea';
import { PrototypeCCharacters } from './PrototypeCCharacters';
import { PrototypeDDompetNalar } from './PrototypeDDompetNalar';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';

export const B343VisualPrototype: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubPrototypeTab>('comparison');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobileView ? 'max-w-[420px] border-x border-stone-800 bg-[#090b12] min-h-screen p-4' : 'max-w-7xl'
        }`}
      >
        {/* Top Breadcrumb & Zero-Cost Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-stone-400 hover:text-stone-100 bg-stone-900 border border-stone-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono font-medium text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
            </div>
          </div>

          {/* Mobile Preview Toggle Button */}
          <div className="flex items-center gap-2 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800">
            <button
              onClick={() => setIsMobileView(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                !isMobileView
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop View</span>
            </button>
            <button
              onClick={() => setIsMobileView(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                isMobileView
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Frame</span>
            </button>
          </div>
        </div>

        {/* Milestone Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-stone-800 bg-stone-900/90 backdrop-blur-md shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 text-xs font-mono text-cyan-400 font-semibold mb-2">
                <span>MILESTONE B3.4.3</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">100% FREE & PERMISSIVE LICENSED</span>
                <span>•</span>
                <span className="text-amber-300">ISOLATED PROTOTYPE</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
                Isometric Asset Acquisition & Visual Compatibility Prototype
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-3xl leading-relaxed">
                Verification laboratory for ThirdAngle, Antahonist, riekahq, RigelRiv, and Modern Citizens pixel-art assets on the 2:1 dimetric grid. Production Virtual HQ (B3.4.2) remains completely intact.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center gap-3 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono text-stone-400">Total Spend</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">$0.00 / Rp 0</div>
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center gap-3 shadow-inner">
                <Building2 className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono text-stone-400">Active Agents</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">30 Preserved</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Tabs Navigation */}
        <div className="flex flex-wrap gap-2.5 mb-8 border-b border-stone-800/80 pb-3">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'comparison'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Asset Matrix & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('environment')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'environment'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Prototype A: Environment (2:1 Grid)</span>
          </button>

          <button
            onClick={() => setActiveTab('shared-area')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'shared-area'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-lg'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <Coffee className="w-4 h-4 text-orange-400" />
            <span>Prototype B: Shared Reception & Lounge</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'characters'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-lg'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-violet-400" />
            <span>Prototype C: Human Characters</span>
          </button>

          <button
            onClick={() => setActiveTab('dompetnalar')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'dompetnalar'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Prototype D: DompetNalar Room</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="transition-opacity duration-200">
          {activeTab === 'comparison' && <AssetCandidateComparison />}
          {activeTab === 'environment' && <PrototypeAEnvironment />}
          {activeTab === 'shared-area' && <PrototypeBSharedArea />}
          {activeTab === 'characters' && <PrototypeCCharacters />}
          {activeTab === 'dompetnalar' && <PrototypeDDompetNalar />}
        </div>
      </div>
    </div>
  );
};
