import { useState } from 'react';
import useAI from '../hooks/useAI';

export default function SmartReplies({ conversation, onSelectReply }) {
  const [isOpen, setIsOpen] = useState(false);
  const { getSmartReplies, loading, error } = useAI();
  const [replies, setReplies] = useState([]);
  const [infoMsg, setInfoMsg] = useState('');

  const handleGetReplies = async () => {
    setInfoMsg('');
    if (!conversation || conversation.length === 0) {
      setInfoMsg('Add comments first to get AI suggestions!');
      return;
    }
    
    // Extract meaningful comments text
    const commentTexts = conversation.map(c => c.text || c.content || c).filter(Boolean);
    if (commentTexts.length === 0) {
      setInfoMsg('Comments are empty. Add meaningful discussion!');
      return;
    }

    const smartReplies = await getSmartReplies(commentTexts);
    if (smartReplies.length === 0 && !error) {
      setInfoMsg('No insights generated. Add more context.');
    }
    setReplies(smartReplies);
    if (smartReplies.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelectReply = (replyText) => {
    onSelectReply(replyText);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGetReplies}
        disabled={loading}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          loading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        {loading ? 'Analyzing...' : '✨ Smart Insights'}
      </button>

      {error && <p className="text-red-500 text-xs">❌ {error}</p>}
      {infoMsg && <p className="text-blue-500 text-xs">ℹ️ {infoMsg}</p>}

      {isOpen && replies.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-purple-700">💡 Suggested Discussion Points:</p>
          {replies.map((reply, idx) => {
            const toneEmoji = {
              friendly: '😊',
              formal: '🎩',
              direct: '👉',
              humorous: '😄',
              thoughtful: '🤔',
              strategic: '🎯',
              technical: '⚙️'
            };
            const emoji = toneEmoji[reply.tone] || '💭';
            return (
              <button
                key={idx}
                onClick={() => handleSelectReply(reply.label)}
                className="block w-full text-left px-2 py-1 text-xs bg-white border border-purple-200 rounded hover:bg-purple-100 transition"
                title={`Category: ${reply.tone || 'suggestion'}`}
              >
                <span className="mr-2">{emoji}</span>
                <span className="line-clamp-2">{reply.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
