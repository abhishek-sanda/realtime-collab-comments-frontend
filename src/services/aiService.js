import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export const aiService = {
  // Get smart reply suggestions for a conversation
  async getSmartReplies(conversation) {
    try {
      // Normalize data
      const normalized = Array.isArray(conversation) ? conversation : [conversation];
      const payload = {
        conversation: normalized.map(item => ({
          content: typeof item === 'string' ? item : (item.text || item.content || ''),
          user: item.user || 'User',
          timestamp: item.timestamp
        }))
      };
      
      console.log('📤 Smart replies payload:', JSON.stringify(payload, null, 2));
      const response = await axios.post(`${API_BASE}/ai/smart-replies`, payload);
      return response.data.replies || [];
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      console.error('❌ Failed to get smart replies:', errorMsg);
      throw new Error(`Smart Insights failed: ${errorMsg}`);
    }
  },

  // Summarize a conversation
  async summarizeConversation(conversation) {
    try {
      // Normalize data
      const normalized = Array.isArray(conversation) ? conversation : [conversation];
      const payload = {
        conversation: normalized.map(item => ({
          content: typeof item === 'string' ? item : (item.text || item.content || ''),
          user: item.user || 'User',
          timestamp: item.timestamp
        }))
      };
      
      console.log('📤 Summarize payload:', JSON.stringify(payload, null, 2));
      const response = await axios.post(`${API_BASE}/ai/summarize`, payload);
      return response.data.summary || null;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      console.error('❌ Failed to summarize:', errorMsg);
      throw new Error(`Report generation failed: ${errorMsg}`);
    }
  },

  // Moderate a message
  async moderateMessage(content) {
    try {
      const response = await axios.post(`${API_BASE}/ai/moderate`, {
        content
      });
      return response.data.result || null;
    } catch (err) {
      console.error('Failed to moderate message:', err);
      return null;
    }
  },

  // Moderate a saved message by ID
  async moderateSavedMessage(messageId) {
    try {
      const response = await axios.post(`${API_BASE}/ai/moderate`, {
        messageId
      });
      return response.data.message || null;
    } catch (err) {
      console.error('Failed to moderate saved message:', err);
      return null;
    }
  }
};

export default aiService;
