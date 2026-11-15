import { useState, useEffect, useCallback } from 'react';
import api from './api'; // Wait, does types/index.ts have AnswerItem? It has Comment! We can use Comment or define Answer.

interface UsePostsResult {
  posts: any[] | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function usePosts(category?: string, sortBy?: string): UsePostsResult {
  const [posts, setPosts] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const isAll = !category || category.toUpperCase() === 'ALL' || category.toLowerCase().trim() === 'all topics' || category.trim() === '';
      const params: any = {};
      if (!isAll) {
        params.category = category.trim();
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }
      params._t = Date.now();
      const response = await api.get('/posts', { params });
      // The API returns { items, page, limit, total, totalPages }
      setPosts(response.data.items);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  }, [category, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, mutate: fetchPosts };
}

interface UsePostDetailsResult {
  post: any | null;
  answers: any[] | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function usePostDetails(id: string): UsePostDetailsResult {
  const [post, setPost] = useState<any | null>(null);
  const [answers, setAnswers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [postRes, answersRes] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/answers/post/${id}`),
      ]);
      setPost(postRes.data);
      setAnswers(answersRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { post, answers, isLoading, error, mutate: fetchDetails };
}

interface UseWalletResult {
  walletBalance: number;
  reputationScore: number;
  reputationXp: number;
  isLoading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function useWallet(): UseWalletResult {
  const [walletBalance, setWalletBalance] = useState(0);
  const [reputationScore, setReputationScore] = useState(0);
  const [reputationXp, setReputationXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      setWalletBalance(response.data.walletBalance ?? 0);
      setReputationScore(response.data.reputationScore ?? 0);
      setReputationXp(response.data.reputationXp ?? 0);
      setError(null);
      
      // Update local storage user just in case to keep components in sync
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        localStorage.setItem('user', JSON.stringify({ ...userObj, ...response.data }));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch wallet info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { walletBalance, reputationScore, reputationXp, isLoading, error, mutate: fetchWallet };
}

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

