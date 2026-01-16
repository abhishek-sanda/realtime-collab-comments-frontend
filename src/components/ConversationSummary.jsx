import { useState } from 'react';
import useAI from '../hooks/useAI';

export default function ConversationSummary({ conversation }) {
  const [isOpen, setIsOpen] = useState(false);
  const { summarize, loading, error } = useAI();
  const [summary, setSummary] = useState(null);
  const [infoMsg, setInfoMsg] = useState('');

  const handleSummarize = async () => {
    setInfoMsg('');
    if (!conversation || conversation.length === 0) {
      setInfoMsg('Add comments first to summarize!');
      return;
    }

    // Extract meaningful comments text
    const commentTexts = conversation.map(c => c.text || c.content || c).filter(Boolean);
    if (commentTexts.length === 0) {
      setInfoMsg('Comments are empty!');
      return;
    }

    // Verify minimum content length
    const totalLength = commentTexts.join(' ').length;
    if (totalLength < 20) {
      setInfoMsg('Comments too short. Add more detail!');
      return;
    }

    console.log('🔄 Attempting to summarize', commentTexts.length, 'comments');
    const result = await summarize(commentTexts);
    if (result) {
      setSummary(result);
      setIsOpen(true);
    } else if (!error) {
      setInfoMsg('Could not generate summary. Try again.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSummarize}
        disabled={loading}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          loading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
      >
        {loading ? 'Summarizing...' : '📊 Generate Report'}
      </button>

      {error && <p className="text-red-500 text-xs">❌ {error}</p>}
      {infoMsg && <p className="text-blue-500 text-xs">ℹ️ {infoMsg}</p>}

      {isOpen && summary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-3 space-y-2 max-h-40 overflow-y-auto text-xs">
          {/* Main Summary */}
          {summary.summary && (
            <div>
              <p className="font-semibold text-indigo-700">📋 Overview:</p>
              <p className="text-gray-700 text-xs leading-relaxed">{summary.summary}</p>
            </div>
          )}

          {/* Key Points - Business Focus */}
          {summary.key_points && summary.key_points.length > 0 && (
            <div>
              <p className="font-semibold text-indigo-700">🎯 Key Benefits:</p>
              <ul className="text-gray-700 list-disc list-inside space-y-0.5 text-xs">
                {summary.key_points.slice(0, 3).map((point, idx) => (
                  <li key={idx} className="line-clamp-1">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {summary.action_items && summary.action_items.length > 0 && (
            <div>
              <p className="font-semibold text-indigo-700">✅ Next Steps:</p>
              <ul className="text-gray-700 list-disc list-inside space-y-0.5 text-xs">
                {summary.action_items.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="line-clamp-1">{item}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1"
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
