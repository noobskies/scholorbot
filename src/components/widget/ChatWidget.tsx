'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { extractScholarshipQuery } from '@/lib/openai';
import { getScholarships } from '@/lib/supabase';
import ChatBubble from './ChatBubble';
import ChatWindow from './ChatWindow';

import { Message, ChatWidgetProps, Scholarship, UserProfile } from '@/types';
import { createChatSession, saveChatMessage, getChatSession } from '@/lib/supabase';

export default function ChatWidget({
  title = process.env.NEXT_PUBLIC_WIDGET_TITLE || 'Attribia',
  subtitle = process.env.NEXT_PUBLIC_WIDGET_SUBTITLE || 'Ask me about scholarships!',
  position = 'bottom-right',
  initialMessage = "Hi there! 👋 I'm Attribia, your friendly scholarship assistant. I can help you discover scholarships, answer questions about financial aid, and provide information about college. What would you like to know about today?",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [showScholarships, setShowScholarships] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      // Check for existing user profile in localStorage first
      const storedUserProfile = localStorage.getItem('userProfile');
      if (storedUserProfile) {
        try {
          const parsedProfile = JSON.parse(storedUserProfile) as UserProfile;
          setUserProfile(parsedProfile);
        } catch (error) {
          console.error('Error parsing stored user profile:', error);
          localStorage.removeItem('userProfile'); // Remove invalid profile data
        }
      }

      // Check for existing session in localStorage
      const storedSessionId = localStorage.getItem('chatSessionId');

      if (storedSessionId) {
        setSessionId(storedSessionId);

        // Try to load messages and user profile from the session
        const session = await getChatSession(storedSessionId);
        if (session) {
          if (session.messages.length > 0) {
            setMessages(session.messages);
          }

          // If we don't have a profile from localStorage but have one from the session
          if (!storedUserProfile && session.userProfile) {
            setUserProfile(session.userProfile);

            // Save to localStorage for future page refreshes
            localStorage.setItem('userProfile', JSON.stringify(session.userProfile));
          }
          return;
        }
      }

      // Create new session if no existing one
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);

      // Add initial message
      const initialMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: initialMessage,
        timestamp: Date.now(),
      };

      setMessages([initialMsg]);
      await saveChatMessage(newSessionId, initialMsg);
    };

    initSession();
  }, [initialMessage]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(sessionId, userMessage);

    // Show loading state
    setIsLoading(true);
    setShowScholarships(false);

    try {
      // Check if the message is a scholarship query
      const scholarshipQuery = extractScholarshipQuery(content);

      // If it's a scholarship query, search for scholarships
      if (scholarshipQuery) {
        const results = await getScholarships(scholarshipQuery);
        setScholarships(results);

        if (results.length > 0) {
          setShowScholarships(true);
        }
      }

      // Get AI response from the API route
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userProfile: userProfile, // Include user profile if available
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.content || 'Failed to get response from API');
      }

      const response = data.content;

      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveChatMessage(sessionId, assistantMessage);
    } catch (error: unknown) {
      console.error('Error sending message:', error);

      // Extract error message if possible
      let errorMessage = 'I seem to be having a technical issue right now. Could you try again in a moment? I want to make sure I can help you find the right scholarship opportunities!';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Add error message
      const assistantErrorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const clearChat = async () => {
    // Create new session
    const newSessionId = await createChatSession();
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);

    // Clear user profile from state and localStorage
    setUserProfile(null);
    localStorage.removeItem('userProfile');

    // Add initial message
    const initialMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: initialMessage,
      timestamp: Date.now(),
    };

    setMessages([initialMsg]);
    await saveChatMessage(newSessionId, initialMsg);
  };

  return (
    <>
      <ChatBubble
        onClick={toggleChat}
        isOpen={isOpen}
        position={position}
      />
      {isOpen && (
        <ChatWindow
          isOpen={isOpen}
          messages={messages}
          onSendMessage={handleSendMessage}
          title={title}
          subtitle={subtitle}
          position={position}
          isLoading={isLoading}
          onClearChat={clearChat}
          scholarships={scholarships}
          showScholarships={showScholarships}
        />
      )}
    </>
  );
}
