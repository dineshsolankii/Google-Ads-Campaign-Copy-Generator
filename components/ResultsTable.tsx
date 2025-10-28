
import React from 'react';
import { AdGroup, Headline, Description } from '../types';
import { DownloadIcon, PinIcon, RefreshIcon } from './icons';

interface ResultsTableProps {
  adGroups: AdGroup[];
  onDownload: () => void;
  onStartOver: () => void;
  onPinHeadline: (adGroupId: string, headlineIndex: number) => void;
}

const CharCount: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
  const count = text.length;
  const color = count > limit ? 'text-red-500' : 'text-slate-400';
  return <span className={`text-xs ml-2 font-mono ${color}`}>[{count}/{limit}]</span>;
};


const ResultsTable: React.FC<ResultsTableProps> = ({ adGroups, onDownload, onStartOver, onPinHeadline }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Generated Ad Campaign</h2>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <button
                    onClick={onStartOver}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <RefreshIcon className="w-5 h-5 mr-2" />
                    Start Over
                </button>
                <button
                    onClick={onDownload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download as XLSX
                </button>
            </div>
        </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200">Ad Group</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200">Keywords</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200">Headline</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200">Description</th>
            </tr>
          </thead>
          <tbody>
            {adGroups.map((group, groupIndex) => {
              const rowCount = Math.max(group.headlines.length, group.descriptions.length);
              const bgColor = groupIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50';

              return Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={`${group.id}-${rowIndex}`} className={`${bgColor} border-b border-slate-200`}>
                  {rowIndex === 0 && (
                    <>
                      <td className="p-4 align-top font-semibold text-indigo-700 border-r border-slate-200" rowSpan={rowCount}>
                        {group.name}
                      </td>
                      <td className="p-4 align-top text-sm text-slate-600 border-r border-slate-200" rowSpan={rowCount}>
                        <ul className="list-disc list-inside space-y-1">
                          {group.keywords.map((kw, i) => <li key={i}>{kw}</li>)}
                        </ul>
                      </td>
                    </>
                  )}
                  <td className="p-3 align-top text-sm text-slate-800 border-r border-slate-200 w-1/3">
                    {group.headlines[rowIndex] && (
                       <div className="flex items-center justify-between">
                         <span>{group.headlines[rowIndex].text}
                           <CharCount text={group.headlines[rowIndex].text} limit={30} />
                         </span>
                         <button onClick={() => onPinHeadline(group.id, rowIndex)} title="Pin headline">
                           <PinIcon className={`w-5 h-5 transition-colors ${group.headlines[rowIndex].isPinned ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-500'}`} />
                         </button>
                       </div>
                    )}
                  </td>
                  <td className="p-3 align-top text-sm text-slate-800 w-1/3">
                    {group.descriptions[rowIndex] && (
                        <span>
                            {group.descriptions[rowIndex].text}
                            <CharCount text={group.descriptions[rowIndex].text} limit={90} />
                        </span>
                    )}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
