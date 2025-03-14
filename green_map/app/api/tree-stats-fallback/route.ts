import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Fallback tree stats API called');
  
  // Static fallback statistics
  const fallbackStats = {
    totalTrees: 1200,
    uniqueSpecies: 60,
    uniqueFamilies: 25,
    statusCounts: {
      'normal': 950,
      'new': 150,
      'old': 100
    },
    columnsAvailable: {
      status: true,
      family: true
    },
    note: "This is fallback data and may not reflect the actual tree statistics."
  };
  
  return NextResponse.json(fallbackStats);
} 