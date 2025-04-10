import React from 'react';
import { Scholarship } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, DollarSign, Users } from 'lucide-react';

interface ScholarshipResultProps {
  scholarship: Scholarship;
}

export default function ScholarshipResult({ scholarship }: ScholarshipResultProps) {
  return (
    <Card className="mb-3 border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow duration-200 bg-card/80">
      <CardContent className="p-4">
        <h4 className="font-semibold text-base mb-1">{scholarship.name}</h4>
        <p className="text-sm text-muted-foreground mb-2">{scholarship.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{scholarship.amount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Deadline: {scholarship.deadline}</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Users className="h-3 w-3" />
            <span>{scholarship.eligibility}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {scholarship.tags.map((tag, index) => (
            <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between">
        <span className="text-xs text-muted-foreground">{scholarship.organization}</span>
        {scholarship.applicationUrl && (
          <Button variant="outline" size="sm" className="h-7 text-xs bg-primary/5 hover:bg-primary/10 text-primary border-primary/20" asChild>
            <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
