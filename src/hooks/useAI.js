import { useState } from 'react';
import aiService from '../services/aiService';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSmartReplies = async (conversation) => {
    setLoading(true);
    setError(null);
    try {
      const replies = await aiService.getSmartReplies(conversation);
      return replies;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const summarize = async (conversation) => {
    setLoading(true);
    setError(null);
    try {
      const summary = await aiService.summarizeConversation(conversation);
      return summary;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const moderate = async (content) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.moderateMessage(content);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getSmartReplies,
    summarize,
    moderate,
    loading,
    error
  };
}

export default useAI;
