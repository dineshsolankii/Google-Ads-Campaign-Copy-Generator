
import React, { useState, useCallback } from 'react';
import { Settings } from '../types';
import { parseKeywordsFromFile } from '../utils/fileUtils';
import { UploadIcon } from './icons';

interface KeywordInputProps {
  onGenerate: (keywords: string[], settings: Settings) => void;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ onGenerate }) => {
  const [keywords, setKeywords] = useState('');
  const [settings, setSettings] = useState<Settings>({
    numAdGroups: 20,
    minKeywordsPerGroup: 3,
    maxKeywordsPerGroup: 10,
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        setFileName(file.name);
        const parsedKeywords = await parseKeywordsFromFile(file);
        setKeywords(parsedKeywords.join('\n'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.');
        setFileName(null);
      }
    }
  };
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const keywordList = keywords.split('\n').map(k => k.trim()).filter(Boolean);
    if(keywordList.length === 0) {
      setError("Please enter or upload some keywords.");
      return;
    }
    setError(null);
    onGenerate(keywordList, settings);
  };
  
  const handleSettingChange = (field: keyof Settings, value: number) => {
      setSettings(prev => ({...prev, [field]: value}));
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <label htmlFor="keywords" className="block text-lg font-semibold text-slate-700 mb-2">
              1. Enter Keywords
            </label>
            <p className="text-sm text-slate-500 mb-4">Paste your keywords below (one per line) or upload a CSV/XLSX file.</p>
            <textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g.&#10;custom t-shirt printing&#10;bulk shirt orders&#10;design your own shirt online"
              className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm"
            />
             <div className="mt-4">
               <label htmlFor="file-upload" className="relative cursor-pointer bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                 <UploadIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                 <span>Upload a file</span>
                 <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, .xlsx"/>
               </label>
               {fileName && <span className="ml-4 text-sm text-slate-600">File: {fileName}</span>}
             </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">2. Configure Settings</h3>
            <p className="text-sm text-slate-500 mb-4">Adjust how the AI groups your keywords.</p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="numAdGroups" className="block text-sm font-medium text-slate-600">Number of Ad Groups ({settings.numAdGroups})</label>
                    <input type="range" id="numAdGroups" min="5" max="50" value={settings.numAdGroups} onChange={(e) => handleSettingChange('numAdGroups', parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
                <div>
                    <label htmlFor="minKeywordsPerGroup" className="block text-sm font-medium text-slate-600">Min Keywords per Group ({settings.minKeywordsPerGroup})</label>
                    <input type="range" id="minKeywordsPerGroup" min="2" max="10" value={settings.minKeywordsPerGroup} onChange={(e) => handleSettingChange('minKeywordsPerGroup', parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
                <div>
                    <label htmlFor="maxKeywordsPerGroup" className="block text-sm font-medium text-slate-600">Max Keywords per Group ({settings.maxKeywordsPerGroup})</label>
                    <input type="range" id="maxKeywordsPerGroup" min="5" max="20" value={settings.maxKeywordsPerGroup} onChange={(e) => handleSettingChange('maxKeywordsPerGroup', parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
        
        <div className="mt-8 pt-6 border-t border-slate-200 text-right">
          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Generate Ad Copy
          </button>
        </div>
      </form>
    </div>
  );
};

export default KeywordInput;
