import React, { useState, useEffect } from 'react';
import {
  Users,
  Play,
  Pause,
  Repeat,
} from 'lucide-react';

export const PrototypeCCharacters: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const [rigelFrame, setRigelFrame] = useState<number>(0);
  const [facing, setFacing] = useState<'down' | 'side' | 'up'>('down');
  const [animationMode, setAnimationMode] = useState<'idle' | 'walk'>('idle');
  const [rigelScale, setRigelScale] = useState<number>(1.5);
  const [testScenario, setTestScenario] = useState<'anchor' | 'desk-behind' | 'desk-front' | 'scale'>('desk-behind');

  // Animation ticker for walk frames (8 frames) & RigelRiv idle frames (2 frames)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWalkFrame((prev) => (prev + 1) % 8);
      setRigelFrame((prev) => (prev + 1) % 2);
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const framePadded = walkFrame.toString().padStart(2, '0');

  // Modern Citizens asset paths
  const mcPlannerSprite =
    animationMode === 'walk'
      ? `/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_office_m_b/walk_${facing}_${framePadded}.png`
      : `/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_office_m_b/stand_${facing}.png`;

  // RigelRiv asset paths (2-frame idle)
  const rigelFrameA = `/assets/virtual-office/b343/characters/rigelriv/frame_0_${rigelFrame}.png`;

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-950/40 text-xs font-mono font-medium text-violet-300 mb-2">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>Prototype C — Human Character Compatibility & Depth Sorting</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-100">
            RigelRiv (Candidate B1) vs Modern Citizens (Baseline)
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Empirical evaluation of sprite scale, ground anchor grounding, 4-direction facing, walk cycle fluidity, and desk occlusion depth sorting.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950 p-2 rounded-2xl border border-stone-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
            }`}
            title={isPlaying ? 'Pause Animation' : 'Play Animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setAnimationMode(animationMode === 'idle' ? 'walk' : 'idle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              animationMode === 'walk'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Mode: {animationMode.toUpperCase()}</span>
          </button>

          {/* Facing Direction Controls */}
          <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
            {(['down', 'side', 'up'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFacing(dir)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all capitalize ${
                  facing === dir
                    ? 'bg-violet-600 text-white font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Testing Scenarios Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTestScenario('desk-behind')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            testScenario === 'desk-behind'
              ? 'bg-violet-600/30 text-violet-200 border border-violet-500/60 shadow-md'
              : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 border border-transparent'
          }`}
        >
          Scenario 1: Sitting Behind Desk (Occlusion Test)
        </button>
        <button
          onClick={() => setTestScenario('desk-front')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            testScenario === 'desk-front'
              ? 'bg-violet-600/30 text-violet-200 border border-violet-500/60 shadow-md'
              : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 border border-transparent'
          }`}
        >
          Scenario 2: Standing in Front of Desk
        </button>
        <button
          onClick={() => setTestScenario('anchor')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            testScenario === 'anchor'
              ? 'bg-violet-600/30 text-violet-200 border border-violet-500/60 shadow-md'
              : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 border border-transparent'
          }`}
        >
          Scenario 3: Ground Anchor Foot Placement
        </button>
        <button
          onClick={() => setTestScenario('scale')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            testScenario === 'scale'
              ? 'bg-violet-600/30 text-violet-200 border border-violet-500/60 shadow-md'
              : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 border border-transparent'
          }`}
        >
          Scenario 4: Multi-Scale Proportions (1x vs 1.5x vs 2x)
        </button>
      </div>

      {/* 3. Side-by-Side Live Visual Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate B1: RigelRiv */}
        <div className="p-6 rounded-3xl border border-stone-800 bg-stone-900/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">CANDIDATE B1</span>
              <h4 className="text-lg font-bold text-stone-100">RigelRiv — Isometric Modern</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-stone-400">Scale:</span>
              <button
                onClick={() => setRigelScale(1.0)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  rigelScale === 1.0 ? 'bg-cyan-500 text-black font-bold' : 'bg-stone-800 text-stone-300'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setRigelScale(1.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  rigelScale === 1.5 ? 'bg-cyan-500 text-black font-bold' : 'bg-stone-800 text-stone-300'
                }`}
              >
                1.5x
              </button>
              <button
                onClick={() => setRigelScale(2.0)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  rigelScale === 2.0 ? 'bg-cyan-500 text-black font-bold' : 'bg-stone-800 text-stone-300'
                }`}
              >
                2x
              </button>
            </div>
          </div>

          {/* Interactive Test Chamber */}
          <div className="h-64 bg-stone-950 rounded-2xl border border-stone-800/80 relative overflow-hidden flex items-center justify-center [image-rendering:pixelated]">
            {/* 64x32 Floor Tile */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -20%)',
                width: '64px',
                height: '64px',
                zIndex: 10,
              }}
            >
              <img
                src="/assets/virtual-office/b343/environment/floor_office_carpet_tile.png"
                alt="carpet"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Test Desk & Occlusion Layering */}
            {testScenario !== 'anchor' && (
              <>
                {/* Office Chair (behind character) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -36px)',
                    width: '64px',
                    height: '64px',
                    zIndex: 20,
                  }}
                >
                  <img
                    src="/assets/virtual-office/b343/environment/ergonomic_office_chair.png"
                    alt="chair"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Desk (in front of or behind character depending on scenario) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -26px)',
                    width: '64px',
                    height: '64px',
                    zIndex: testScenario === 'desk-behind' ? 40 : 25,
                  }}
                >
                  <img
                    src="/assets/virtual-office/b343/furniture/office_desk.png"
                    alt="desk"
                    className="w-full h-full object-contain"
                  />
                  <img
                    src="/assets/virtual-office/b343/furniture/office_monitor.png"
                    alt="monitor"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ transform: 'translateY(-14px)' }}
                  />
                </div>
              </>
            )}

            {/* RigelRiv Character Sprite */}
            <div
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, ${testScenario === 'desk-front' ? '0px' : '-28px'}) scale(${rigelScale})`,
                transformOrigin: 'bottom center',
                zIndex: testScenario === 'desk-front' ? 50 : 30,
              }}
            >
              <img
                src={rigelFrameA}
                alt="rigelriv"
                className="w-[22px] h-[40px] object-contain [image-rendering:pixelated]"
              />
            </div>

            {/* Ground line indicator in anchor mode */}
            {testScenario === 'anchor' && (
              <div
                className="absolute w-24 h-0.5 bg-amber-400 z-50 pointer-events-none"
                style={{ top: 'calc(50% + 20px)' }}
              />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-stone-400 font-mono">
              <span>Resolution: 22x40px</span>
              <span>Frames: 2-Frame Idle</span>
              <span>Facing: SE Only</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              <strong>Evaluation:</strong> True isometric angle and compact footprint. At 1.5x scale, fits comfortably behind 64x64 desks. However, it lacks native 4-direction walking and only offers SE facing.
            </p>
          </div>
        </div>

        {/* Benchmark Baseline: Modern Citizens */}
        <div className="p-6 rounded-3xl border border-stone-800 bg-stone-900/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <span className="text-xs font-mono text-violet-400 font-semibold">BENCHMARK BASELINE</span>
              <h4 className="text-lg font-bold text-stone-100">Modern Citizens (nacl1234)</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                100% Adult Humans
              </span>
            </div>
          </div>

          {/* Interactive Test Chamber */}
          <div className="h-64 bg-stone-950 rounded-2xl border border-stone-800/80 relative overflow-hidden flex items-center justify-center [image-rendering:pixelated]">
            {/* 64x32 Floor Tile */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -20%)',
                width: '64px',
                height: '64px',
                zIndex: 10,
              }}
            >
              <img
                src="/assets/virtual-office/b343/environment/floor_office_carpet_tile.png"
                alt="carpet"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Test Desk & Occlusion Layering */}
            {testScenario !== 'anchor' && (
              <>
                {/* Office Chair (behind character) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -36px)',
                    width: '64px',
                    height: '64px',
                    zIndex: 20,
                  }}
                >
                  <img
                    src="/assets/virtual-office/b343/environment/ergonomic_office_chair.png"
                    alt="chair"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Desk (in front of or behind character depending on scenario) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -26px)',
                    width: '64px',
                    height: '64px',
                    zIndex: testScenario === 'desk-behind' ? 40 : 25,
                  }}
                >
                  <img
                    src="/assets/virtual-office/b343/furniture/office_desk.png"
                    alt="desk"
                    className="w-full h-full object-contain"
                  />
                  <img
                    src="/assets/virtual-office/b343/furniture/office_monitor.png"
                    alt="monitor"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ transform: 'translateY(-14px)' }}
                  />
                </div>
              </>
            )}

            {/* Modern Citizens Character Sprite */}
            <div
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, ${testScenario === 'desk-front' ? '-68px' : '-94px'})`,
                width: '128px',
                height: '128px',
                zIndex: testScenario === 'desk-front' ? 50 : 30,
              }}
            >
              <img
                src={mcPlannerSprite}
                alt="modern-citizens"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>

            {/* Ground line indicator in anchor mode */}
            {testScenario === 'anchor' && (
              <div
                className="absolute w-24 h-0.5 bg-amber-400 z-50 pointer-events-none"
                style={{ top: 'calc(50% + 20px)' }}
              />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-stone-400 font-mono">
              <span>Resolution: 48x48 (128x128)</span>
              <span>Frames: 8-Frame Walk</span>
              <span>Facing: 4 Directions</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              <strong>Evaluation:</strong> Superior animation fidelity with full 4-direction walking and idle cycles. Anchor at y=124 sits flush with ThirdAngle 2:1 tile bottom edge. Natural torso/head proportions seated behind desk.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Comparative Synthesis Table */}
      <div className="p-6 rounded-3xl border border-stone-800 bg-stone-900/60 overflow-x-auto">
        <h4 className="text-sm font-bold text-stone-200 mb-4 font-mono uppercase">
          Character Compatibility Verdict Matrix
        </h4>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-mono">
              <th className="pb-3 font-semibold">Evaluation Criteria</th>
              <th className="pb-3 font-semibold">RigelRiv (Candidate B1)</th>
              <th className="pb-3 font-semibold">Modern Citizens (Approved Baseline)</th>
              <th className="pb-3 font-semibold">Integration Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 text-stone-300">
            <tr>
              <td className="py-2.5 font-medium text-stone-200">Grid & Perspective</td>
              <td>Isometric 2:1 SE angle</td>
              <td>High-angle axonometric 3/4 bird's-eye</td>
              <td className="text-emerald-400 font-semibold">Both visually compatible</td>
            </tr>
            <tr>
              <td className="py-2.5 font-medium text-stone-200">Directional Navigation</td>
              <td className="text-amber-400">Fixed single direction (SE)</td>
              <td className="text-emerald-400 font-semibold">4 Directions (Down, Side, Up)</td>
              <td className="text-emerald-400 font-semibold">Modern Citizens enables real corridors</td>
            </tr>
            <tr>
              <td className="py-2.5 font-medium text-stone-200">Animation Cycles</td>
              <td>2-frame idle loop</td>
              <td>8-frame walk + standing idle</td>
              <td className="text-emerald-400 font-semibold">Modern Citizens allows active walking</td>
            </tr>
            <tr>
              <td className="py-2.5 font-medium text-stone-200">Demographic Appropriateness</td>
              <td>Adult office workers</td>
              <td>100% Adult software engineers</td>
              <td className="text-emerald-400 font-semibold">Both satisfy adult criteria</td>
            </tr>
            <tr>
              <td className="py-2.5 font-medium text-stone-200">Depth Occlusion (Desks)</td>
              <td>Clean with 1.5x scaling</td>
              <td>Clean at native 128x128 bounds</td>
              <td className="text-emerald-400 font-semibold">Both pass depth sorting</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
