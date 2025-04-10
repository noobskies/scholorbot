import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processPdfData, processCsvData, normalizeScholarshipData } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileType || !['pdf', 'csv'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or CSV files.' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Process file based on type
    let scholarships;
    if (fileType === 'pdf') {
      scholarships = await processPdfData(buffer);
    } else {
      scholarships = await processCsvData(buffer);
    }
    
    // Normalize scholarship data
    const normalizedScholarships = normalizeScholarshipData(scholarships);
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('scholarships')
      .insert(normalizedScholarships)
      .select();
    
    if (error) {
      console.error('Error saving scholarships to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to save scholarships' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: `Successfully processed ${normalizedScholarships.length} scholarships`,
      scholarships: data
    });
  } catch (error) {
    console.error('Error processing scholarship data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
