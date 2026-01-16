// frontend/src/components/CommentSidebar.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import ModerationBadge from './ModerationBadge';

export default function CommentSidebar() {
  const [comments, setComments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      const res = await axios.get('https://realtime-collab-comments-backend.onrender.com/comments/shared-doc');
      setComments(res.data);
    };
    fetchComments();
  }, []);

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('username');

  const handleVote = async (commentId, voteType) => {
    try {
      const endpoint = voteType === 'up' 
        ? `https://realtime-collab-comments-backend.onrender.com/comments/${commentId}/upvote`
        : `https://realtime-collab-comments-backend.onrender.com/${commentId}/downvote`;

      const res = await axios.post(endpoint, { userId });
      
      // Update comments with new vote data
      setComments(comments.map(c => c._id === commentId ? res.data : c));
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      const res = await axios.put(`https://realtime-collab-comments-backend.onrender.com/comments/${commentId}`, {
        text: editText,
        userId: userName
      });
      setComments(comments.map(c => c._id === commentId ? res.data : c));
      setEditingId(null);
      setEditText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to edit comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await axios.delete(`https://realtime-collab-comments-backend.onrender.com/comments/${commentId}`, {
        data: { userId: userName }
      });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const getUserVote = (comment) => {
    const vote = comment.voters?.find(v => v.userId === userId);
    return vote?.vote || null;
  };

  const isCommentAuthor = (commentUser) => commentUser === userName;

  return (
    <div className="min-h-full p-4 border-l overflow-y-auto bg-gray-100">
      <h2 className="text-lg font-bold mb-4">Comments</h2>
      {comments.map((c) => {
        const userVote = getUserVote(c);
        const isAuthor = isCommentAuthor(c.user);
        
        return (
          <div key={c._id} className="mb-4 p-3 border rounded bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-700"><strong>@{c.user}</strong>:</div>
              {isAuthor && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {editingId === c._id ? (
              <div className="mb-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border p-2 rounded text-sm"
                  rows="3"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSaveEdit(c._id)}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm mt-2">{c.text}</div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleVote(c._id, 'up')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  userVote === 'upvote' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                👍 {c.upvotes || 0}
              </button>
              
              <button
                onClick={() => handleVote(c._id, 'down')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  userVote === 'downvote' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                👎 {c.downvotes || 0}
              </button>
            </div>

            {c.mentions?.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                Mentions: {c.mentions.map(m => `@${m.username}`).join(', ')}
              </div>
            )}

            <ModerationBadge 
              moderation={c.moderation}
              tags={c.tags}
              priority={c.priority}
            />
          </div>
        );
      })}
    </div>
  );
}
