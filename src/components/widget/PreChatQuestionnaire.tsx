'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { PreChatQuestion, UserProfile } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Define the pre-chat questions
const PRE_CHAT_QUESTIONS: PreChatQuestion[] = [
  {
    id: uuidv4(),
    question: "What is your dependency status?",
    type: "select",
    options: ["Dependent", "Independent"],
    required: true,
    fieldName: "dependencyStatus"
  },
  {
    id: uuidv4(),
    question: "What is your tax filing status?",
    type: "select",
    options: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household", "Qualifying Widow(er)"],
    required: true,
    fieldName: "taxFilingStatus"
  },
  {
    id: uuidv4(),
    question: "What is your adjusted gross income?",
    type: "select",
    options: ["$0 - $20,000", "$20,001 - $40,000", "$40,001 - $60,000", "$60,001 - $80,000", "$80,001 - $100,000", "$100,001+"],
    required: true,
    fieldName: "adjustedGrossIncome"
  },
  {
    id: uuidv4(),
    question: "What is your family size (including yourself)?",
    type: "select",
    options: ["1", "2", "3", "4", "5", "6+"],
    required: true,
    fieldName: "familySize"
  },
  {
    id: uuidv4(),
    question: "What is your state of residence?",
    type: "select",
    options: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
      "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
      "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
      "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
      "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
      "District of Columbia", "Puerto Rico", "Other US Territory"
    ],
    required: true,
    fieldName: "stateOfResidence"
  }
];

interface PreChatQuestionnaireProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onComplete: (userProfile: UserProfile) => void;
  onSkip: () => void;
  title?: string;
}

export default function PreChatQuestionnaire({
  position = 'bottom-right',
  onComplete,
  onSkip,
  title = 'Help us determine your financial aid eligibility',
}: PreChatQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Determine position styles
  const positionStyles = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const currentQuestion = PRE_CHAT_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === PRE_CHAT_QUESTIONS.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      // Complete the questionnaire
      onComplete(userProfile as UserProfile);
    } else {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleInputChange = (value: string | string[] | boolean) => {
    if (currentQuestion) {
      setUserProfile({
        ...userProfile,
        [currentQuestion.fieldName]: value,
      });
    }
  };

  const handleMultiselectChange = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];

    setSelectedOptions(newSelectedOptions);
    handleInputChange(newSelectedOptions);
  };

  const isNextDisabled = () => {
    if (!currentQuestion.required) return false;

    const value = userProfile[currentQuestion.fieldName];

    if (currentQuestion.type === 'multiselect') {
      return !value || (Array.isArray(value) && value.length === 0);
    }

    return value === undefined || value === '';
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.question}</Label>
            <Input
              id={currentQuestion.id}
              value={userProfile[currentQuestion.fieldName] as string || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type your answer here..."
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.question}</Label>
            <Select
              value={userProfile[currentQuestion.fieldName] as string || ''}
              onValueChange={(value) => handleInputChange(value)}
            >
              <SelectTrigger id={currentQuestion.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            <Label>{currentQuestion.question}</Label>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options?.map((option) => (
                <Badge
                  key={option}
                  variant={selectedOptions.includes(option) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleMultiselectChange(option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <Label>{currentQuestion.question}</Label>
            <RadioGroup
              value={userProfile[currentQuestion.fieldName] ? "yes" : "no"}
              onValueChange={(value) => handleInputChange(value === "yes")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`fixed ${positionStyles[position]} z-40 w-80 sm:w-96 flex flex-col`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="flex flex-col shadow-xl border border-border/50 rounded-xl overflow-hidden bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="p-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm">
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
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-primary-foreground/20 h-1.5 rounded-full w-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-foreground"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / PRE_CHAT_QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-primary-foreground/90 whitespace-nowrap">
                    {currentQuestionIndex + 1}/{PRE_CHAT_QUESTIONS.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className="p-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderQuestionInput()}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        {/* Footer with Navigation */}
        <CardFooter className="p-3 border-t bg-muted/30 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="h-9 px-3 flex items-center gap-1 border-border/50 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={isNextDisabled()}
            size="sm"
            className="h-9 px-4 flex items-center gap-1 shadow-sm"
          >
            {isLastQuestion ? 'Finish' : 'Next'}
            {!isLastQuestion && <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
