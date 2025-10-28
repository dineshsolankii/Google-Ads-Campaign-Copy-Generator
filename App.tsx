
import React, { useState, useCallback } from 'react';
import { AdGroup, AppStep, Settings } from './types';
import KeywordInput from './components/KeywordInput';
import ResultsTable from './components/ResultsTable';
import { generateAdGroupsAndCopy } from './services/geminiService';
import { exportToXLSX } from './utils/fileUtils';
import { LogoIcon, SparklesIcon } from './components/icons';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (keywords: string[], settings: Settings) => {
    setStep('loading');
    setError(null);
    try {
      const result = await generateAdGroupsAndCopy(keywords, settings);
      setAdGroups(result);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStep('error');
    }
  };

  const handleDownload = () => {
    exportToXLSX(adGroups);
  };
  
  const handleStartOver = () => {
      setAdGroups([]);
      setStep('input');
      setError(null);
  }

  const handlePinHeadline = (adGroupId: string, headlineIndex: number) => {
    setAdGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id === adGroupId) {
          const newHeadlines = [...group.headlines];
          newHeadlines[headlineIndex].isPinned = !newHeadlines[headlineIndex].isPinned;
          return { ...group, headlines: newHeadlines };
        }
        return group;
      })
    );
  };
  
  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <div className="flex justify-center items-center mb-4">
              <SparklesIcon className="w-10 h-10 text-indigo-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">AI is thinking...</h2>
            <p className="text-slate-500 mt-2">Grouping keywords and crafting compelling ad copy. This may take a moment.</p>
          </div>
        );
      case 'results':
        return <ResultsTable adGroups={adGroups} onDownload={handleDownload} onStartOver={handleStartOver} onPinHeadline={handlePinHeadline} />;
      case 'error':
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md border border-red-200">
                <h2 className="text-2xl font-semibold text-red-600">An Error Occurred</h2>
                <p className="text-slate-600 mt-2 mb-4">{error}</p>
                <button
                    onClick={handleStartOver}
                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Try Again
                </button>
            </div>
        );
      case 'input':
      default:
        return <KeywordInput onGenerate={handleGenerate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center space-x-3 mb-8">
          <LogoIcon className="w-10 h-10 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Google Ads Campaign Generator</h1>
            <p className="text-slate-500">AI-Powered Ad Group & Copy Creation</p>
          </div>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
