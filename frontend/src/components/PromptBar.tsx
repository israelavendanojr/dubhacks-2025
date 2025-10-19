// components/PromptBar.tsx
import { useState } from 'react';
import { generateSimulation, type SimulationResponse } from '../utils/apiClient';

interface PromptBarProps {
  onTerrainGenerated: (response: SimulationResponse) => Promise<void>;
}

export function PromptBar({ onTerrainGenerated }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await generateSimulation(prompt.trim());
      if (response.success) {
        await onTerrainGenerated(response);
        setPrompt(''); // Clear on success
      }
    } catch (error) {
      console.error('Generation failed:', error);
      // Optionally show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[140px] bg-[#1a1a1a] border-t border-white/10">
      <div className="h-full px-8 py-6">
        <form onSubmit={handleSubmit} className="h-full flex items-center gap-4">
          {/* Text Input */}
          <div className="flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="     Describe an environmental scenario... (e.g., 'What if all cars were electric?')"
              disabled={isLoading}
              className="w-full h-[60px] px-6 bg-[#222222] border border-white/10 rounded-xl text-white placeholder-gray-500 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
              style={{ color: 'white' }}
            />
          </div>
          
          {/* Generate Button */}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="h-[60px] px-8 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-3 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
