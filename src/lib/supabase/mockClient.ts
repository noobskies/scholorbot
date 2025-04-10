import { Scholarship, ChatSession, Message } from '@/types';

// Create a mock Supabase client for development without credentials
export function createMockSupabaseClient() {
  console.warn('Using mock Supabase client for development');
  
  // Mock data
  const mockScholarships: Scholarship[] = [
    {
      id: '1',
      name: 'Academic Excellence Scholarship',
      description: 'Awarded to students with outstanding academic achievements.',
      amount: '$5,000',
      deadline: 'March 15, 2025',
      eligibility: 'GPA of 3.8 or higher, SAT score of 1400+',
      applicationUrl: 'https://example.com/academic-scholarship',
      organization: 'National Education Foundation',
      tags: ['academic', 'merit-based'],
    },
    {
      id: '2',
      name: 'STEM Innovation Scholarship',
      description: 'For students pursuing degrees in Science, Technology, Engineering, or Mathematics.',
      amount: '$3,000',
      deadline: 'April 30, 2025',
      eligibility: 'Declared major in STEM field, GPA of 3.5+',
      applicationUrl: 'https://example.com/stem-scholarship',
      organization: 'Future Tech Foundation',
      tags: ['stem', 'innovation'],
    },
    {
      id: '3',
      name: 'Community Service Scholarship',
      description: 'Recognizes students who have made significant contributions to their communities.',
      amount: '$2,500',
      deadline: 'February 28, 2025',
      eligibility: '100+ hours of documented community service',
      applicationUrl: 'https://example.com/community-scholarship',
      organization: 'Community Impact Alliance',
      tags: ['community-service', 'leadership'],
    },
  ];
  
  // Mock sessions and messages
  const mockSessions: Record<string, ChatSession> = {};
  const mockMessages: Record<string, Message[]> = {};
  
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        textSearch: (column: string, query: string) => ({
          then: async (callback: Function) => {
            if (table === 'scholarships') {
              const filteredData = query
                ? mockScholarships.filter(s => 
                    s.name.toLowerCase().includes(query.toLowerCase()) ||
                    s.description.toLowerCase().includes(query.toLowerCase()))
                : mockScholarships;
              return callback({ data: filteredData, error: null });
            }
            return callback({ data: [], error: null });
          },
        }),
        eq: (column: string, value: string) => ({
          single: () => ({
            then: async (callback: Function) => {
              if (table === 'chat_sessions' && mockSessions[value]) {
                return callback({ data: mockSessions[value], error: null });
              }
              return callback({ data: null, error: { message: 'Not found' } });
            },
          }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            then: async (callback: Function) => {
              if (table === 'chat_messages' && mockMessages[value]) {
                const sortedMessages = [...mockMessages[value]].sort((a, b) => {
                  return ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
                });
                return callback({ data: sortedMessages, error: null });
              }
              return callback({ data: [], error: null });
            },
          }),
        }),
        then: async (callback: Function) => {
          if (table === 'scholarships') {
            return callback({ data: mockScholarships, error: null });
          }
          return callback({ data: [], error: null });
        },
      }),
      insert: (data: any) => ({
        select: () => ({
          then: async (callback: Function) => {
            if (table === 'scholarships') {
              return callback({ data: [data], error: null });
            } else if (table === 'chat_sessions') {
              mockSessions[data.id] = {
                id: data.id,
                messages: [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              };
              return callback({ data: null, error: null });
            } else if (table === 'chat_messages') {
              const sessionId = data.session_id;
              if (!mockMessages[sessionId]) {
                mockMessages[sessionId] = [];
              }
              mockMessages[sessionId].push(data);
              return callback({ data: null, error: null });
            }
            return callback({ data: null, error: null });
          },
        }),
        then: async (callback: Function) => {
          if (table === 'chat_sessions') {
            mockSessions[data.id] = {
              id: data.id,
              messages: [],
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
            return callback({ data: null, error: null });
          } else if (table === 'chat_messages') {
            const sessionId = data.session_id;
            if (!mockMessages[sessionId]) {
              mockMessages[sessionId] = [];
            }
            mockMessages[sessionId].push(data);
            return callback({ data: null, error: null });
          }
          return callback({ data: null, error: null });
        },
      }),
    }),
  };
}
