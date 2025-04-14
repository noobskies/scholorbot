import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Scholarship } from '@/types';
import ScholarshipResult from './ScholarshipResult';
import { SendIcon, Trash2, GraduationCap, Sparkles, Info, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    "How can I apply for financial aid?",
    "What scholarships are available for my major?",
    "Can you tell me about Pell Grants?",
    "How do I make college more affordable?",
    "What's the difference between loans and scholarships?",
    "I'm the first in my family to go to college. What resources are available?"
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
                <div className="flex items-center gap-3">
                  <div className="bg-primary-foreground/10 p-2 rounded-full shadow-inner">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                      {title}
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                      </motion.span>
                    </h3>
                    <p className="text-sm text-primary-foreground/90">{subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-md">
                        <p>Ask me about scholarships!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {onClearChat && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClearChat}
                      className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10 border-primary-foreground/20 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear</span>
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
                  <motion.div
                    className="mb-6 bg-card p-4 rounded-lg border border-border/50 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">You can ask about:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm py-1.5 px-3"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Show scholarship results if available */}
                {showScholarships && scholarships.length > 0 && (
                  <motion.div
                    className="mb-6 bg-card/50 p-4 rounded-lg border border-border/50 shadow-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-sm font-medium mb-3 flex items-center text-primary">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 mr-2">
                        <span className="text-xs font-bold">{scholarships.length}</span>
                      </span>
                      Matching Scholarships Found
                    </h4>
                    <div className="space-y-3">
                      {scholarships.map((scholarship) => (
                        <ScholarshipResult
                          key={scholarship.id}
                          scholarship={scholarship}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
                    >
                      <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-primary' : 'bg-muted'} border ${message.role === 'user' ? 'border-primary/30' : 'border-muted/30'} shadow-sm`}>
                        {message.role === 'user' ? (
                          <AvatarFallback className="text-primary-foreground text-xs font-semibold">
                            You
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="text-foreground text-xs font-semibold bg-gradient-to-br from-muted to-muted/80">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        )}
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
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div
                      className="flex items-start gap-2 flex-row"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="h-8 w-8 bg-muted border border-muted/30 shadow-sm">
                        <AvatarFallback className="text-foreground text-xs font-semibold bg-gradient-to-br from-muted to-muted/80">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80%] p-3 rounded-lg bg-card text-card-foreground rounded-tl-none border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <motion.span
                              className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                              animate={{ scale: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                              animate={{ scale: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.span
                              className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                              animate={{ scale: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
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
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1 text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
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
                  className="flex-1 bg-background border-border focus-visible:ring-primary/50 shadow-sm"
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
