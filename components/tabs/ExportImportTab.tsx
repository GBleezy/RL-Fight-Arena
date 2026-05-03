'use client';
import { useGameStore } from '@/lib/store';
import { useState } from 'react';
import { ModelInfo, sampleModels, Architecture } from '@/lib/types';
import { Copy, Download, Upload, Users, Trash2, ShieldPlus } from 'lucide-react';

export default function ExportImportTab() {
  const { state, addModel, removeModel } = useGameStore();
  const { trainedModel, modelLibrary, architecture, trainingParams, curriculum } = state;

  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCurrentHash = () => {
     if(trainedModel) return trainedModel.hash;
     return `RLF-A1B2-C3D4-S0-E0`;
  };

  const copyHash = () => {
    navigator.clipboard.writeText(generateCurrentHash());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const data = {
      model: trainedModel,
      architecture,
      trainingParams,
      curriculum,
      exportTimestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RLF_ModelConfig_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      if (importText.startsWith('RLF-')) {
        // Pseudo-hash parse
        const parts = importText.split('-');
        const sMatch = parts[3]?.match(/S(\d+)/);
        const eMatch = parts[4]?.match(/E(\d+)/);
        const score = sMatch ? parseInt(sMatch[1]) : 50;
        const eps = eMatch ? parseInt(eMatch[1]) : 1000;
        
        const newMod: ModelInfo = {
          id: 'imp-hash-' + Date.now(),
          hash: importText,
          name: `Imported Hash (${parts[1]})`,
          score, episodesTrained: eps,
          architecture: { ...architecture },
          aggressionIndex: 50, defenseIndex: 50
        };
        addModel(newMod);
        setImportText('');
        alert('Model imported from hash!');
      } else {
        const data = JSON.parse(importText);
        if (data.model && data.architecture) {
          const m: ModelInfo = data.model;
          m.id = 'imp-json-' + Date.now();
          m.isBuiltIn = false;
          addModel(m);
          setImportText('');
          alert('Model imported from JSON!');
        } else {
          alert('Invalid JSON structure.');
        }
      }
    } catch(e) {
      alert('Failed to parse import string. Ensure it is a valid hash or JSON.');
    }
  };

  const loadSamples = () => {
    sampleModels.forEach(m => addModel({...m, id: 'sample-'+Math.random().toString(36).substring(7)}));
    alert('Samples added to library.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full pb-10 overflow-y-auto pr-4 scrollbar-thin">
       
       <div className="space-y-8">
         <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" /> Export
            </h2>
            <p className="text-sm text-zinc-400">Export your latest trained model and config to share.</p>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">Model Hash</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-rose-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {generateCurrentHash()}
                </div>
                <button onClick={copyHash} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 rounded-lg transition-colors flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-green-400 text-xs text-right">Copied!</p>}
            </div>

            <button onClick={downloadJson} className="w-full bg-blue-900 border border-blue-800 hover:bg-blue-800 text-blue-100 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mt-4">
               <Download className="w-4 h-4" /> Download Full JSON Config
            </button>
         </section>

         <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" /> Import
            </h2>
            <p className="text-sm text-zinc-400">Paste a model hash or full JSON array.</p>
            
            <textarea 
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste RLF-XXXX... or { json }"
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex gap-4">
              <button onClick={handleImport} className="flex-1 bg-emerald-900 border border-emerald-800 hover:bg-emerald-800 text-emerald-100 py-3 rounded-lg font-bold transition-colors">
                 Import Model
              </button>
              <button onClick={loadSamples} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 rounded-lg font-bold flex items-center gap-2 transition-colors border border-zinc-700">
                 <Users className="w-4 h-4" /> Sample Pack
              </button>
            </div>
         </section>
       </div>

       <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-xl">
             <h2 className="text-lg font-semibold text-zinc-100">Model Library</h2>
             <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-bold">{modelLibrary.length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
             {modelLibrary.length === 0 && <div className="text-center text-zinc-600 mt-10">Library is empty.</div>}
             {modelLibrary.map(m => (
               <div key={m.id} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-4 group hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <ShieldPlus className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-bold text-zinc-200 text-sm flex items-center gap-2">
                      {m.name}
                      {m.isBuiltIn && <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">Built-In</span>}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-1 flex gap-3">
                       <span>SC: <span className="text-rose-400">{m.score}</span></span>
                       <span>L: {m.architecture.hiddenLayers}x{m.architecture.neuronsPerLayer}</span>
                       <span>EP: {m.episodesTrained}</span>
                    </div>
                  </div>
                  {!m.isBuiltIn && (
                    <button onClick={() => removeModel(m.id)} className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
               </div>
             ))}
          </div>
       </div>

    </div>
  );
}
