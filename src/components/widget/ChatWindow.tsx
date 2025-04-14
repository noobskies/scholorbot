import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Scholarship } from '@/types';
import ScholarshipResult from './ScholarshipResult';
import { SendIcon, Loader2, Trash2, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatWindowProps {
  isOpen: boolean;
  messages: Message[];
  onSendMessage: (message: string) => void;
  title?: string;
  subtitle?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  isLoading?: boolean;
  onClearChat?: () => void;
  scholarships?: Scholarship[];
  showScholarships?: boolean;
}

export default function ChatWindow({
  isOpen,
  messages,
  onSendMessage,
  title = 'Scholarship Finder',
  subtitle = 'Ask me about scholarships!',
  position = 'bottom-right',
  isLoading = false,
  onClearChat,
  scholarships = [],
  showScholarships = false,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested questions
  const suggestedQuestions = [
    "Can you tell me about scholarships for STEM majors?",
    "I'm worried about paying for college. What need-based options are there?",
    "When should I start applying for scholarships for next fall?",
    "I'm the first in my family to go to college. Are there scholarships for me?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  // Determine position styles
  const positionStyles = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed ${positionStyles[position]} z-40 w-80 sm:w-96 h-[500px] flex flex-col`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="flex flex-col h-full shadow-xl border border-border/50 rounded-xl overflow-hidden bg-card/95 backdrop-blur-sm">
            {/* Header */}
            <CardHeader className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-primary-foreground/10 p-2 rounded-full">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg tracking-tight">{title}</h3>
                    <p className="text-sm text-primary-foreground/80">{subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {onClearChat && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClearChat}
                      className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10 border-primary-foreground/20 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear Chat</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[350px] px-4 py-3 bg-gradient-to-b from-muted/30 to-transparent">
                {/* Show suggested questions if no messages except the initial one */}
                {messages.length <= 1 && (
                  <div className="mb-6 bg-card p-3 rounded-lg border border-border/50 shadow-sm">
                    <p className="text-sm font-medium mb-2">You can ask about:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show scholarship results if available */}
                {showScholarships && scholarships.length > 0 && (
                  <div className="mb-6 bg-card/50 p-3 rounded-lg border border-border/50 shadow-sm">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Matching Scholarships:
                    </h4>
                    <div className="space-y-3">
                      {scholarships.map((scholarship) => (
                        <ScholarshipResult
                          key={scholarship.id}
                          scholarship={scholarship}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                        <AvatarFallback className={`${message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'} text-xs font-semibold`}>
                          {message.role === 'user' ? 'You' : 'AI'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none border border-primary/10'
                          : 'bg-card text-card-foreground rounded-tl-none border border-border/50'
                          }`}
                      >
                        <div className="prose prose-sm max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-1.5 prose-headings:font-semibold">
                          <ReactMarkdown
                            rehypePlugins={[rehypeSanitize]}
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80 transition-colors"
                                />
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="flex items-start gap-2 flex-row">
                      <Avatar className="h-8 w-8 bg-muted">
                        <AvatarFallback className="text-foreground text-xs font-semibold">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80%] p-3 rounded-lg bg-card text-card-foreground rounded-tl-none border border-border/50 shadow-sm flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <CardFooter className="p-3 pt-2 border-t bg-muted/30 flex flex-col gap-2">
              {/* Clear chat button */}
              {onClearChat && messages.length > 1 && (
                <div className="w-full flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearChat}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear conversation</span>
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-background border-border focus-visible:ring-primary/50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
