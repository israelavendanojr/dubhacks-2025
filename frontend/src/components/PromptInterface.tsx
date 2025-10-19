import React, { useState } from 'react';
import { generateSimulation, type SimulationResponse } from '../utils/apiClient';

interface PromptInterfaceProps {
  // Future props can be added here for Phase 2
}

export function PromptInterface({}: PromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'loading';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a prompt before submitting.'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'loading',
      text: 'Processing with LLM...'
    });

    try {
      const response: SimulationResponse = await generateSimulation(prompt.trim());
      
      if (response.success) {
        setStatusMessage({
          type: 'success',
          text: `✓ Generated ${response.data.metric} data (${response.data.dataPoints.length} counties)`
        });
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      } else {
        setStatusMessage({
          type: 'error',
          text: '✗ API returned unsuccessful response'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setStatusMessage({
        type: 'error',
        text: `✗ Error: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!statusMessage) return null;
    
    switch (statusMessage.type) {
      case 'loading':
        return (
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        );
      case 'success':
        return <span className="text-green-400">✓</span>;
      case 'error':
        return <span className="text-red-400">✗</span>;
      default:
        return null;
    }
  };

  const getStatusTextColor = () => {
    if (!statusMessage) return '';
    
    switch (statusMessage.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'loading':
        return 'text-cyan-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col">
      {/* Future controls will go here in Phase 2 */}
      <div className="flex-1 p-6">
        <div className="text-white text-lg font-semibold mb-4">
          Environmental Scenario Generator
        </div>
        <div className="text-gray-400 text-sm mb-6">
          Describe an environmental scenario to see how it would affect Washington state counties.
        </div>
        
        {/* Status Message Area */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className={`flex items-center space-x-2 ${getStatusTextColor()}`}>
              {getStatusIcon()}
              <span className="text-sm">{statusMessage.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area at Bottom */}
      <div className="p-6 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your environmental scenario... (e.g., 'What if all cars were electric?')"
              className="w-full h-24 px-4 py-3 bg-gray-800/90 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none transition-colors"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? 'Generating...' : 'Generate Scenario'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
