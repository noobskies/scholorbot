'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

// Define the pre-chat questions
const PRE_CHAT_QUESTIONS: PreChatQuestion[] = [
  {
    id: uuidv4(),
    question: "What is your current education level?",
    type: "select",
    options: ["High School", "Undergraduate", "Graduate", "Other"],
    required: true,
    fieldName: "educationLevel"
  },
  {
    id: uuidv4(),
    question: "What is your field of study or interest?",
    type: "text",
    required: true,
    fieldName: "fieldOfStudy"
  },
  {
    id: uuidv4(),
    question: "What types of scholarships are you interested in?",
    type: "multiselect",
    options: ["Merit-based", "Need-based", "STEM", "Arts", "Sports", "Community Service", "First-generation", "Minority"],
    required: true,
    fieldName: "interests"
  },
  {
    id: uuidv4(),
    question: "Are you seeking financial aid or need-based scholarships?",
    type: "boolean",
    required: true,
    fieldName: "financialNeed"
  },
  {
    id: uuidv4(),
    question: "What is your expected graduation year?",
    type: "text",
    required: false,
    fieldName: "graduationYear"
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
  title = 'Help us find the right scholarships for you',
}: PreChatQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    interests: [],
    financialNeed: false,
  });
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
            <div>
              <h3 className="font-bold text-lg tracking-tight">{title}</h3>
              <p className="text-sm text-primary-foreground/80">
                Question {currentQuestionIndex + 1} of {PRE_CHAT_QUESTIONS.length}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className="p-4 space-y-4">
          {renderQuestionInput()}
        </CardContent>

        {/* Footer with Navigation */}
        <CardFooter className="p-3 border-t bg-muted/30 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              Skip All
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
