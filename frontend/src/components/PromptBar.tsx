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
      <div className="h-full py-6" style={{ paddingLeft: '15px', paddingRight: '32px' }}>
        <form onSubmit={handleSubmit} className="h-full flex items-center gap-4">
          {/* Text Input */}
          <div className="flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe an environmental scenario... (e.g., 'What if all cars were electric?')"
              disabled={isLoading}
              className="w-full h-[60px] pr-6 bg-[#222222] border border-white/10 rounded-xl text-white placeholder-gray-500 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
              style={{ color: 'white', paddingLeft: '20px' }}
            />
          </div>
          
          {/* Generate Button */}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white transition-all duration-200 flex items-center gap-3 whitespace-nowrap"
            style={{ 
              height: '60px', 
              paddingLeft: '32px', 
              paddingRight: '32px',
              marginLeft: '15px',
              marginRight: '-18px',
              borderRadius: '6px'
            }}
          >
            {isLoading ? (
              <span>Generating...</span>
            ) : (
              <span>Generate</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
