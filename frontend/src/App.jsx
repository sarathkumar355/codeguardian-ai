import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, UploadCloud, Code, ChevronRight, Activity, Terminal } from 'lucide-react';
import axios from 'axios';
import NetworkBackground from './components/NetworkBackground';
import RiskDashboard from './components/RiskDashboard';

function App() {
  const [inputData, setInputData] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const loadingSteps = ["Scanning dependencies...", "Retrieving CVEs...", "Analyzing risk...", "Evaluating neural logic..."];

  useEffect(() => {
    let interval;
    if (analyzing) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleAnalyze = async () => {
    if (!inputData.trim()) return;
    
    setAnalyzing(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/analyze', {
        content: inputData,
        filename: 'requirements.txt'
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 selection:bg-cyan-500/30 font-sans relative">
      <NetworkBackground />
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl tracking-tight">
            <Shield className="w-6 h-6" />
            CodeGuardian AI
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            DEFENSE MATRIX ONLINE
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
        {!result && !analyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
          >
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm">
                Predictive Security Intelligence
              </h1>
              <p className="text-lg text-slate-400">
                AI-powered dependency scanning. Detect vulnerabilities, predict risk vectors, and simulate zero-day exploits before they happen.
              </p>
            </div>

            <div className="w-full max-w-3xl glass-panel p-2">
              <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                <div className="flex items-center bg-slate-900 px-4 py-2 border-b border-slate-800 gap-2">
                  <Terminal className="w-4 h-4 text-slate-500"/>
                  <span className="text-xs text-slate-500 font-mono">requirements.txt / package.json</span>
                </div>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Paste your dependencies here... (e.g. flask==1.0&#10;requests>=2.0)"
                  className="w-full h-64 bg-transparent text-cyan-300 font-mono p-4 focus:outline-none resize-none placeholder-slate-700"
                />
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!inputData.trim()}
              className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_20px_rgba(8,145,178,0.4)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat group-hover:transition-[background-position_0s_ease] group-hover:bg-[position:200%_0,0_0] group-hover:duration-[1500ms]" />
              <span className="flex items-center gap-2 relative z-10">
                Initiate Neural Scan
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            {error && <p className="text-red-400 mt-2 font-mono text-sm">{error}</p>}
          </motion.div>
        )}

        {analyzing && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative w-40 h-40">
              <motion.div className="absolute inset-0 rounded-full border-t-4 border-cyan-500 shadow-[0_0_15px_#06b6d4]" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
              <motion.div className="absolute inset-4 rounded-full border-b-4 border-blue-500 shadow-[0_0_15px_#3b82f6]" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
              <motion.div className="absolute inset-8 rounded-full border-l-4 border-emerald-500 shadow-[0_0_15px_#10b981]" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 text-cyan-400 animate-pulse mb-1" />
              </div>
            </div>
            
            <div className="text-center font-mono space-y-2">
               <motion.p 
                 key={scanStep}
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 className="text-cyan-400 text-lg font-bold tracking-widest uppercase h-8">
                 {loadingSteps[scanStep]}
               </motion.p>
               <div className="flex flex-col gap-1 text-xs text-slate-500 uppercase tracking-widest mt-4">
                  <span className="flex items-center justify-center gap-2">[ <span className="text-emerald-400 w-24 text-left">Vector DB</span> ] FAISS Searching</span>
                  <span className="flex items-center justify-center gap-2">[ <span className="text-emerald-400 w-24 text-left">Intelligence</span> ] RAG Extraction</span>
                  <span className="flex items-center justify-center gap-2">[ <span className="text-emerald-400 w-24 text-left">Assessment</span> ] Evaluating Risks</span>
               </div>
            </div>
          </div>
        )}

        {result && !analyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-8 pr-4">
              <button 
                onClick={() => setResult(null)}
                className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Scanner
              </button>
            </div>
            <RiskDashboard data={result} />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
