import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import VideoCall from './VideoCall';
import SmartReplies from './SmartReplies';
import ConversationSummary from './ConversationSummary';
import useSocket from '../hooks/useSocket';

export default function Editor({ username }) {
  const editorRef = useRef();
  const [content, setContent] = useState('');
  const [comments, setComments] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const userId = localStorage.getItem('userId');

  const socket = useSocket('http://localhost:3001', {
    query: { username },
  });

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-doc');
    
    const handleLoadDoc = (loadedContent) => {
      setContent(loadedContent);
      if (editorRef.current) {
        editorRef.current.innerText = loadedContent;
      }
    };

    const handleReceiveChanges = (newContent) => {
      setContent(newContent);
      if (editorRef.current) {
        const cursorPos = getCursorPosition();
        editorRef.current.innerText = newContent;
        setCursorPosition(cursorPos);
      }
    };

    socket.on('load-doc', handleLoadDoc);
    socket.on('receive-changes', handleReceiveChanges);

    // Fetch comments for the shared document
    axios.get('http://localhost:3001/comments/shared-doc')
      .then(response => setComments(response.data))
      .catch(err => console.error('Failed to fetch comments:', err));

    return () => {
      // Clean up listeners when the socket changes or component unmounts
      socket.off('load-doc', handleLoadDoc);
      socket.off('receive-changes', handleReceiveChanges);
    };
    // This effect runs whenever the socket instance changes.
    // The useSocket hook ensures a new socket is created when username changes.
  }, [socket]);

  const getCursorPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    return selection.getRangeAt(0).endOffset;
  };

  const setCursorPosition = (pos) => {
    const selection = window.getSelection();
    const range = document.createRange();
    if (editorRef.current && editorRef.current.firstChild) {
      range.setStart(editorRef.current.firstChild, Math.min(pos, editorRef.current.innerText.length));
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleInput = (e) => {
    const newContent = e.currentTarget.innerText;
    setContent(newContent);
    if (socket) {
      socket.emit('send-changes', newContent);
    }
  };

  const handleComment = async () => {
    const selection = window.getSelection();
    const text = selection.toString();
    if (!text) {
      alert('Please select some text to comment on.');
      return;
    }

    const range = {
      start: Math.min(selection.anchorOffset, selection.focusOffset),
      end: Math.max(selection.anchorOffset, selection.focusOffset)
    };

    let commentText = prompt(`Add comment for "${text}" (you can @mention)`);
    if (commentText === null) return; // user clicked cancel
    commentText = commentText.trim();

    if (!commentText) {
      alert('Comment cannot be empty.');
      return;
    }

    const comment = {
      documentId: 'shared-doc',
      user: username,
      text: commentText,
      range,
      mentions: extractMentions(commentText)
    };

    try {
      await axios.post('http://localhost:3001/comments', comment);
      setComments([...comments, comment]);
      
      // Update conversation history with user info
      setConversationHistory([
        ...conversationHistory,
        { role: 'user', content: commentText, user: username, timestamp: new Date().toISOString() }
      ]);
      
      window.getSelection().removeAllRanges();
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const extractMentions = (text) => {
    const regex = /@\w+/g;
    const matches = text.match(regex) || [];
    return matches.map(username => ({ username: username.slice(1), userId: username.slice(1) }));
  };

  const handleSelectSmartReply = (replyText) => {
    // Add the smart reply to conversation history
    setConversationHistory([
      ...conversationHistory,
      { role: 'assistant', content: replyText, timestamp: new Date().toISOString() }
    ]);
  };

  const renderComments = () => {
    return comments.map((comment, index) => (
      <div key={index} className="bg-white border border-gray-200 p-2 rounded hover:border-blue-300 transition text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-blue-600">@{comment.user}</span>
          <div className="flex gap-1">
            <button className="text-gray-400 hover:text-red-500 transition" title="Like">👍</button>
            <button className="text-gray-400 hover:text-blue-500 transition" title="Reply">💬</button>
          </div>
        </div>
        <p className="text-gray-700 text-xs leading-relaxed">{comment.text}</p>
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Control Buttons - Responsive Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button 
          onClick={handleComment} 
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm font-medium transition col-span-1 sm:col-span-1"
        >
          💬 Comment
        </button>
        <button 
          onClick={() => setShowVideo(!showVideo)} 
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm font-medium transition col-span-1 sm:col-span-1"
        >
          📹 {showVideo ? 'Hide' : 'Show'}
        </button>
        <button 
          onClick={() => setShowAI(!showAI)} 
          className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs sm:text-sm font-medium transition col-span-1 sm:col-span-1"
        >
          🤖
        </button>
        <button 
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs sm:text-sm font-medium transition hidden sm:block"
          title="Premium features coming soon"
        >
          ⭐ Pro
        </button>
      </div>

      {/* Video Section - Controlled Height */}
      {showVideo && (
        <div className="border rounded p-3 bg-gray-50 max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto">
          <VideoCall username={username} userId={userId} roomId="shared-doc" />
        </div>
      )}

      {/* AI Section - Controlled Height */}
      {showAI && (
        <div className="border rounded p-3 bg-orange-50 max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2 text-sm text-orange-700">🤖 AI Insights & Moderation</h3>
          <div className="flex flex-col gap-2 text-sm">
            <SmartReplies 
              conversation={comments} 
              onSelectReply={handleSelectSmartReply}
            />
            <ConversationSummary conversation={comments} />
          </div>
        </div>
      )}

      {/* Editor Section - Takes Remaining Space */}
      <div className="flex-1 border p-3 sm:p-4 rounded bg-white shadow overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning={true}
          className="min-h-full whitespace-pre-wrap outline-none text-sm sm:text-base"
        />
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">💬 Comments & Engagement</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{comments.length}</span>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {renderComments()}
          {comments.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No comments yet. Start the conversation!</p>
          )}
        </div>
      </div>
    </div>
  );
}