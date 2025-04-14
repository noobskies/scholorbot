import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatBubbleProps {
  onClick: () => void;
  isOpen: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function ChatBubble({
  onClick,
  isOpen,
  position = 'bottom-right',
}: ChatBubbleProps) {
  // Determine position styles
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <motion.div
      className={`fixed ${positionStyles[position]} z-50`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary relative border-2 border-primary/20"
              variant="default"
              onClick={onClick}
              aria-label={isOpen ? "Close chat" : "Open chat"}
            >
              <AnimatePresence>
                {!isOpen && (
                  <motion.span
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full shadow-sm"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1.5
                    }}
                  >
                    <span className="text-[10px] font-bold text-white">1</span>
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MessageCircle className="h-6 w-6" />
                )}
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-md">
            <p>{isOpen ? "Close chat" : "Ask about scholarships"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
