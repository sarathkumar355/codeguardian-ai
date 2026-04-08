import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Cpu, Activity, Network, Shield, Settings, Download, XCircle } from 'lucide-react';

const RiskGauge = ({ score }) => {
  const normalizedScore = Math.min(10, Math.max(0, score));
  const percentage = (normalizedScore / 10) * 100;
  
  let color = 'text-green-500';
  let strokeColor = 'stroke-green-500';
  if (score > 3) color = 'text-yellow-500';
  if (score > 3) strokeColor = 'stroke-yellow-500';
  if (score > 6) color = 'text-red-500';
  if (score > 6) strokeColor = 'stroke-red-500';

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" className="stroke-slate-700" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r="45" fill="none" className={strokeColor} strokeWidth="8"
          strokeDasharray={`${percentage * 2.827} 282.7`}
          initial={{ strokeDasharray: "0 282.7" }}
          animate={{ strokeDasharray: `${percentage * 2.827} 282.7` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold ${color}`}>{score.toFixed(1)}</span>
        <span className="text-slate-400 text-sm mt-1">Global Risk</span>
      </div>
    </div>
  );
};

const DependencyGraph = ({ dependencies, selectedDep, setSelectedDep }) => {
  return (
    <div className="relative w-full h-64 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden p-4 flex items-center justify-center">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
      
      <div className="flex flex-wrap justify-center items-center gap-6 z-10 relative">
        <motion.div className="w-16 h-16 rounded-full bg-blue-600 border-4 border-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20">
          <span className="text-xs font-bold font-mono">App</span>
        </motion.div>
        
        {dependencies.map((dep, idx) => {
          const isVuln = dep.vulnerable;
          const isSelected = selectedDep?.package === dep.package;
          return (
            <motion.div key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: isSelected ? 1.2 : 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedDep(isSelected ? null : dep)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 
                ${isVuln ? 'bg-red-900/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]' : 'bg-slate-800 border-slate-500 hover:border-green-400'}
                ${isSelected ? 'ring-4 ring-cyan-400 z-30' : ''}`}
            >
              {isVuln && <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />}
              <span className="text-[10px] font-mono text-center px-1 truncate w-full">{dep.package}</span>
              <svg className="absolute w-24 h-2 -left-12 -z-10" style={{ pointerEvents: 'none' }}>
                <line x1="0" y1="4" x2="48" y2="4" stroke={isVuln ? '#ef4444' : '#475569'} strokeWidth={isSelected ? "4" : "2"} strokeDasharray="4 2" />
              </svg>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
};

export const RiskDashboard = ({ data }) => {
  const [selectedDep, setSelectedDep] = useState(null);
  const [expertMode, setExpertMode] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [simulateIgnore, setSimulateIgnore] = useState(false);
  const [showFixCode, setShowFixCode] = useState(false);

  if (!data) return null;

  // Smart Highlighting: Select highest risk on mount if none selected
  React.useEffect(() => {
    if (!selectedDep && data.detailed_results.length > 0) {
      const highestRisk = [...data.detailed_results].sort((a,b) => b.risk_score - a.risk_score)[0];
      if (highestRisk.risk_score > 0) {
        setSelectedDep(highestRisk);
      }
    }
  }, [data]);

  const handleExport = () => {
    const exportData = JSON.stringify(data, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CodeGuardian_Intelligence_Report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopySummary = () => {
    const status = data.summary.project_status;
    const count = data.summary.vulnerable_count;
    const action = selectedDep?.decision?.best_action || "Review dependencies";
    const summary = `Project Risk: ${status}. ${count} vulnerabilities found. Recommended action: ${action.charAt(0).toUpperCase() + action.slice(1)}.`;
    navigator.clipboard.writeText(summary);
    alert("Report summary copied to clipboard!");
  };

  const statusColor = data.summary.project_status === 'Critical' ? 'text-red-400 border-red-500/50 bg-red-500/20' : 
                      data.summary.project_status === 'Warning' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/20' : 
                      'text-green-400 border-green-500/50 bg-green-500/20';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-700 backdrop-blur-md sticky top-16 z-40">
        <div className="flex items-center gap-4">
           <h1 className="text-2xl font-bold tracking-wider">Project Scan Report</h1>
           <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider border ${statusColor}`}>
              STATE: {data.summary.project_status.toUpperCase()}
           </span>
        </div>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-sm inline-flex items-center gap-2 border border-slate-600 transition-colors">
              <span className="hidden md:inline">Print to PDF</span>
           </button>
           <button onClick={handleCopySummary} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-sm inline-flex items-center gap-2 border border-slate-600 transition-colors">
              <span className="hidden md:inline">Copy Report Summary</span>
           </button>
           <button onClick={handleExport} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-sm inline-flex items-center gap-2 border border-cyan-400 shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-colors">
              <Download className="w-4 h-4"/> Export JSON
           </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col items-center justify-center col-span-1">
          <RiskGauge score={data.summary.overall_risk_score} />
          <div className="mt-6 w-full space-y-2 border-t border-slate-700/50 pt-4">
             <div className="flex justify-between text-sm"><span className="text-slate-400">Nodes Analyzed:</span><span className="font-bold">{data.summary.dependencies_analyzed}</span></div>
             <div className="flex justify-between text-sm"><span className="text-slate-400">Vulnerable:</span><span className="font-bold text-red-400">{data.summary.vulnerable_count}</span></div>
             <div className="flex justify-between text-sm"><span className="text-slate-400">Weakest Link:</span><span className="font-bold text-orange-400 font-mono">{data.summary.weakest_dependency || "None"}</span></div>
          </div>
        </div>
        
        <div className="glass-panel p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" /> Dependency Target Map
          </h2>
          <DependencyGraph dependencies={data.detailed_results} selectedDep={selectedDep} setSelectedDep={setSelectedDep} />
        </div>
      </motion.div>

      {/* Intelligence Dashboard */}
      <h2 className="text-2xl font-bold flex items-center gap-2 mt-8">
        <ShieldAlert className="w-6 h-6 text-red-400" />
        Detailed Intelligence Panel
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left List */}
        <div className="col-span-1 md:col-span-4 space-y-3 max-h-[800px] overflow-y-auto pr-2">
          {data.detailed_results.map((dep, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => {setSelectedDep(dep); setSimulateIgnore(false); setShowEvidence(false); setShowFixCode(false)}}
              className={`p-4 cursor-pointer rounded-lg transition-all border-l-4 shadow-[0_4px_10px_rgba(0,0,0,0.2)] bg-slate-800/80
                ${dep.vulnerable ? 'border-l-red-500 hover:bg-slate-700' : 'border-l-green-500 hover:bg-slate-700'}
                ${selectedDep?.package === dep.package ? (dep.vulnerable ? 'ring-2 ring-red-500 bg-slate-700 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'ring-2 ring-cyan-500 bg-slate-700') : ''}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg font-mono">{dep.package}</h3>
                  <span className="text-slate-400 text-sm">v{dep.version}</span>
                </div>
                {dep.vulnerable ? (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded text-xs font-bold">Risk: {dep.risk_score}</span>
                ) : (
                  <CheckCircle className="text-green-500 w-6 h-6" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right Active Panel */}
        <div className="col-span-1 md:col-span-8 relative">
          <AnimatePresence mode="wait">
            {selectedDep ? (
              <motion.div key={selectedDep.package} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-panel p-6 h-full flex flex-col justify-start">
                
                {/* Header & Modes */}
                <div className="flex justify-between items-start border-b border-slate-700/50 pb-4 mb-4">
                  <div>
                     <h3 className="text-3xl font-bold font-mono text-cyan-400 flex items-center gap-3">
                        {selectedDep.package}
                        {selectedDep.vulnerable && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-sans tracking-wide">VULNERABLE</span>}
                     </h3>
                     {selectedDep.first_reported && selectedDep.last_updated && (
                         <div className="text-slate-500 text-xs mt-1 font-mono flex gap-2 items-center">
                             <Activity className="w-3 h-3 text-cyan-500" />
                             <span>Known issues since {selectedDep.first_reported} • Last patched {selectedDep.last_updated}</span>
                         </div>
                     )}
                     <p className="text-slate-400 mt-2 flex items-center cursor-help group">
                         Intelligence Confidence: <span className="ml-1 text-cyan-300 border-b border-dashed border-cyan-800">{selectedDep.confidence_score}</span>
                         <span className="absolute ml-60 invisible group-hover:visible bg-black text-white text-xs p-2 rounded shadow-lg z-50 transform -translate-y-8 w-64 border border-slate-700">
                             Based on number and similarity of retrieved CVE matches.
                         </span>
                     </p>
                  </div>
                  <div className="flex border border-slate-600 rounded-md overflow-hidden text-sm font-bold shadow-lg">
                    <button onClick={() => setExpertMode(false)} className={`px-4 py-2 transition-colors ${!expertMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Beginner</button>
                    <button onClick={() => setExpertMode(true)} className={`px-4 py-2 transition-colors flex items-center gap-1 ${expertMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Settings className="w-4 h-4"/> Expert</button>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto pr-2 pb-8">
                  {/* Explanation */}
                  <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                    <h4 className="font-bold text-slate-300 flex items-center gap-2 mb-3"><Info className="w-5 h-5 text-cyan-400"/> Vulnerability Context</h4>
                    {selectedDep.impact_summary && (
                        <div className="mb-4 bg-orange-500/10 border-l-4 border-orange-500 p-3 rounded">
                            <p className="text-orange-200 text-sm font-semibold flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-orange-400" />
                                Impact: {selectedDep.impact_summary}
                            </p>
                        </div>
                    )}
                    <p className="text-slate-300 leading-relaxed text-lg">
                       {expertMode ? (selectedDep.explanation_expert || selectedDep.explanation_beginner) : selectedDep.explanation_beginner}
                    </p>
                  </div>

                  {selectedDep.vulnerable ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       
                       {/* Predictive Risk */}
                       <div className="bg-orange-900/20 p-5 rounded-lg border border-orange-800/50">
                         <h4 className="font-bold text-orange-400 flex items-center gap-2 mb-2">Predictive Risk Engine</h4>
                         <div className="flex items-center gap-3 mb-2">
                             <span className="text-2xl font-bold text-white bg-orange-500/30 px-3 py-1 rounded">{selectedDep.prediction?.probability || "Unknown"}</span>
                         </div>
                         <p className="text-sm text-orange-200">{selectedDep.prediction?.explanation}</p>
                       </div>

                       {/* Attack Simulation */}
                       <div className="bg-red-900/20 p-5 rounded-lg border border-red-800/50 relative overflow-hidden group">
                         <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu className="w-32 h-32 text-red-500" /></div>
                         <h4 className="font-bold text-red-400 flex items-center gap-2 mb-3 relative z-10"><ShieldAlert className="w-5 h-5"/> Attack Simulator</h4>
                         <div className="text-sm text-red-100 relative z-10 font-mono bg-black/50 p-4 rounded border border-red-900 leading-relaxed">
                            <span className="text-red-500 font-bold block mb-1">$&gt; EXPLOIT_VECTOR: {selectedDep.simulation?.vector}</span>
                            {selectedDep.simulation?.scenario}
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="bg-green-900/10 border border-green-800/30 p-4 rounded-lg flex items-center justify-center py-10">
                       <p className="text-green-500 font-bold text-lg flex items-center gap-2"><CheckCircle/> No malicious attack paths strictly modeled.</p>
                    </div>
                  )}

                  {/* Decision Support Engine */}
                  <div className="mt-8 border border-slate-700 bg-slate-900/60 rounded-xl overflow-hidden">
                     <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 font-bold text-slate-200 uppercase tracking-widest text-sm flex justify-between items-center">
                        <span className="flex items-center gap-2"><Network className="w-4 h-4 text-cyan-400"/> Decision Support Engine</span>
                        {selectedDep.vulnerable && <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/50">RECOMMENDATION: {selectedDep.decision?.best_action?.toUpperCase() || "UPGRADE"}</span>}
                     </div>
                     <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                         <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                           <h5 className="font-bold text-green-400 mb-2 border-b border-slate-700 pb-2">UPGRADE</h5>
                           <p className="text-xs text-slate-300 mt-2"><span className="text-slate-500 block mb-1">Benefits:</span> {selectedDep.decision?.options?.upgrade?.benefits}</p>
                           <p className="text-xs text-slate-300 mt-2"><span className="text-slate-500 block mb-1">Risks:</span> {selectedDep.decision?.options?.upgrade?.risks}</p>
                           <div className="mt-3 inline-block bg-slate-900 text-slate-400 px-2 py-1 rounded text-xs border border-slate-700">{selectedDep.decision?.options?.upgrade?.time_to_fix || "~15 minutes"}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                           <h5 className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-2">REPLACE</h5>
                           <p className="text-xs text-slate-300 mt-2"><span className="text-slate-500 block mb-1">Benefits:</span> {selectedDep.decision?.options?.replace?.benefits}</p>
                           <p className="text-xs text-slate-300 mt-2"><span className="text-slate-500 block mb-1">Risks:</span> {selectedDep.decision?.options?.replace?.risks}</p>
                           <div className="mt-3 inline-block bg-slate-900 text-slate-400 px-2 py-1 rounded text-xs border border-slate-700">{selectedDep.decision?.options?.replace?.time_to_fix || "~2-4 hours"}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50 relative">
                           <h5 className="font-bold text-slate-400 mb-2 border-b border-slate-700 pb-2">IGNORE</h5>
                           {!simulateIgnore ? (
                               <button onClick={() => setSimulateIgnore(true)} className="mt-4 w-full bg-red-600/80 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors text-xs flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                  <AlertTriangle className="w-4 h-4"/> Simulate Consequences
                               </button>
                           ) : (
                              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-2 text-xs text-red-300 bg-red-950 p-3 rounded font-mono border border-red-900 select-all">
                                 {selectedDep.decision?.options?.ignore?.consequences || "Catastrophic failure probability increases exponentially over time."}
                                 <button onClick={() => setSimulateIgnore(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><XCircle className="w-4 h-4"/></button>
                              </motion.div>
                           )}
                           <div className="mt-3 inline-block bg-slate-900 text-slate-400 px-2 py-1 rounded text-xs border border-slate-700">{selectedDep.decision?.options?.ignore?.time_to_fix || "Risk increases over time"}</div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Recommended Fixes */}
                  <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                    <h4 className="font-bold text-slate-300 mb-2">Automated Patch Advice</h4>
                    <ul className="text-sm text-cyan-300 list-disc list-inside space-y-1 mb-4">
                      {selectedDep.fixes?.map((fix, i) => <li key={i}>{fix}</li>)}
                      {(!selectedDep.fixes || selectedDep.fixes.length === 0) && <li>No specific patch instructions retrieved.</li>}
                    </ul>
                    {selectedDep.fix_command && (
                       <div>
                          <button onClick={() => setShowFixCode(!showFixCode)} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-sm transition-colors border border-slate-600 font-bold shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                              👉 {showFixCode ? "Hide Fix Code" : "Show Fix Code"}
                          </button>
                          <AnimatePresence>
                             {showFixCode && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                                    <div className="bg-black/80 font-mono text-green-400 p-4 rounded border border-slate-700 flex items-center justify-between">
                                        <span>$&gt; {selectedDep.fix_command}</span>
                                        <button onClick={() => {navigator.clipboard.writeText(selectedDep.fix_command); alert("Command copied!")}} className="text-slate-500 hover:text-slate-300">Copy</button>
                                    </div>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                    )}
                  </div>

                  {/* Evidence Viewer Toggle */}
                  {selectedDep.evidence?.length > 0 && (
                     <div className="mt-6 border border-slate-700 rounded-lg overflow-hidden bg-slate-900/80">
                       <button onClick={() => setShowEvidence(!showEvidence)} className="w-full bg-slate-800 hover:bg-slate-700 px-5 py-3 font-bold text-slate-300 flex justify-between items-center transition-colors">
                          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400"/> Security Evidence Sources (RAG)</span>
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">{selectedDep.evidence.length} Retrieved</span>
                       </button>
                       <AnimatePresence>
                         {showEvidence && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-slate-950 overflow-hidden">
                             {selectedDep.evidence.map((ev, i) => (
                               <div key={i} className="mb-4 last:mb-0 border-l-2 border-slate-700 pl-3">
                                 <div className="text-emerald-400 font-bold font-mono text-sm mb-1">{ev.cve_id} <span className="text-xs bg-slate-800 text-slate-300 px-2 ml-2 rounded">{ev.severity}</span></div>
                                 <div className="text-slate-400 text-xs italic mb-1">Vector: {ev.attack_vector}</div>
                                 <div className="text-slate-300 text-sm">{ev.description}</div>
                               </div>
                             ))}
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                  )}

                </div>
              </motion.div>
            ) : (
              <div className="h-full glass-panel flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Activity className="w-20 h-20 opacity-20" />
                <p className="text-lg">Select a target node from the Intelligence Report to analyze</p>
                <p className="text-sm font-mono opacity-50 text-center max-w-sm">Neural scan complete. Awaiting human oversight for decision execution.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;
