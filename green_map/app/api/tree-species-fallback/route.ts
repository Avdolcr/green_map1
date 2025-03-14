import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Fallback tree species API called');
  
  // Static fallback data with family names added
  const fallbackSpecies = [
    { scientific_name: "Quercus robur", common_name: "English Oak", count: 245, family_name: "Fagaceae" },
    { scientific_name: "Acer platanoides", common_name: "Norway Maple", count: 187, family_name: "Aceraceae" },
    { scientific_name: "Tilia cordata", common_name: "Small-leaved Lime", count: 156, family_name: "Tiliaceae" },
    { scientific_name: "Betula pendula", common_name: "Silver Birch", count: 134, family_name: "Betulaceae" },
    { scientific_name: "Fagus sylvatica", common_name: "European Beech", count: 98, family_name: "Fagaceae" },
    { scientific_name: "Pinus sylvestris", common_name: "Scots Pine", count: 87, family_name: "Pinaceae" },
    { scientific_name: "Fraxinus excelsior", common_name: "European Ash", count: 76, family_name: "Oleaceae" },
    { scientific_name: "Aesculus hippocastanum", common_name: "Horse Chestnut", count: 65, family_name: "Hippocastanaceae" },
    { scientific_name: "Ulmus minor", common_name: "Field Elm", count: 54, family_name: "Ulmaceae" },
    { scientific_name: "Alnus glutinosa", common_name: "Common Alder", count: 43, family_name: "Betulaceae" },
    { scientific_name: "Carpinus betulus", common_name: "European Hornbeam", count: 32, family_name: "Betulaceae" },
    { scientific_name: "Sorbus aucuparia", common_name: "Rowan", count: 28, family_name: "Rosaceae" },
    { scientific_name: "Larix decidua", common_name: "European Larch", count: 26, family_name: "Pinaceae" },
    { scientific_name: "Prunus avium", common_name: "Wild Cherry", count: 24, family_name: "Rosaceae" },
    { scientific_name: "Platanus x hispanica", common_name: "London Plane", count: 22, family_name: "Platanaceae" },
  ];
  
  return NextResponse.json({
    success: true,
    species: fallbackSpecies,
    totalSpeciesShown: fallbackSpecies.length,
    note: "This is fallback data and may not reflect the actual tree species counts."
  });
} 