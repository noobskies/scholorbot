import React from 'react';
import { Scholarship } from '@/types';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, DollarSign, Users, Award, School } from 'lucide-react';

interface ScholarshipResultProps {
  scholarship: Scholarship;
}

export default function ScholarshipResult({ scholarship }: ScholarshipResultProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mb-3 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-200 bg-card/80 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-primary/10 p-1.5 rounded-full">
              <Award className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base mb-1 line-clamp-1">{scholarship.name}</h4>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{scholarship.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="font-medium">{scholarship.amount}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="font-medium">Due: {scholarship.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 bg-muted/50 px-2 py-1 rounded">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="font-medium line-clamp-1">{scholarship.eligibility}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {scholarship.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5 text-primary text-xs border-primary/20 px-2 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center border-t border-border/30">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <School className="h-3 w-3" />
          {scholarship.organization}
        </span>
        {scholarship.applicationUrl && (
          <Button variant="outline" size="sm" className="h-7 text-xs bg-primary/5 hover:bg-primary/10 hover:scale-105 text-primary border-primary/20 transition-all" asChild>
            <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
    </motion.div>
  );
}
