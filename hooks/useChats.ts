'use client';

import { useState, useEffect } from 'react';
import { get, post } from '@/lib/utils/fetcher';

export interface Message {
  id: string;
  senderId: string;
  sender: 'user' | 'seller';
  content: string;
  text: string;
  timestamp: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastUpdated: string;
  unreadCount?: number;
  unread?: boolean;
  avatar?: string;
  sellerName: string;
  productName: string;
  timestamp: string;
  online?: boolean;
  status?: 'pending' | 'completed' | 'cancelled';
  price?: number;
}

interface UseChatsResult {
  chats: Chat[];
  messages: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  sendMessage: (chatId: string, text: string) => Promise<void>;
}

export function useChats(): UseChatsResult {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Chat[]>('/api/chat/list');
        setChats(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const sendMessage = async (chatId: string, text: string) => {
    try {
      await post('/api/chat/send-message', { chatId, text });
      const data = await get<Message[]>(`/api/chat/${chatId}`);
      setMessages(prev => ({ ...prev, [chatId]: data || [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return { chats, messages, loading, error, sendMessage };
}

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Message[]>(`/api/chat/${chatId}`);
        setMessages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  const sendMessage = async (text: string) => {
    try {
      await post('/api/chat/send-message', { chatId, text });
      const data = await get<Message[]>(`/api/chat/${chatId}`);
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return { messages, loading, error, sendMessage };
}

export function useCreateChat() {
  const createChat = async (participantUsername: string) => {
    try {
      const data = await post<Chat>('/api/chat/create', {
        participantUsername,
      });
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create chat');
    }
  };

  return { createChat };
}