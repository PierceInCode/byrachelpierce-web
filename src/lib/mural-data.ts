/**
 * The 14 mural locations across Sanibel Island painted by Rachel Pierce.
 * Coordinates are approximate (used for map display and AR geofencing).
 * Radius is the geofence radius in meters for the Mural Selfie Trail feature.
 */

import type { MuralLocation } from '@/types';

export const MURAL_LOCATIONS: MuralLocation[] = [
  {
    id: 1,
    name: 'Sea Turtle Sanctuary',
    address: '1571 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4484,
    lng: -82.0834,
    radius: 150,
    description:
      'A vibrant sea turtle mural celebrating the nesting turtles of Sanibel\'s shores.',
    year: 2019,
  },
  {
    id: 2,
    name: 'Roseate Spoonbill in Flight',
    address: 'Jerry\'s Shopping Center, 1700 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4479,
    lng: -82.0789,
    radius: 150,
    description:
      'A sweeping depiction of the beloved roseate spoonbill soaring over island marshes.',
    year: 2020,
  },
  {
    id: 3,
    name: 'Manatee Morning',
    address: '2330 Palm Ridge Rd, Sanibel Island, FL 33957',
    lat: 26.4512,
    lng: -82.0756,
    radius: 150,
    description: 'A gentle manatee drifting through sun-dappled waters.',
    year: 2020,
  },
  {
    id: 4,
    name: 'Island Florals',
    address: '2407 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4468,
    lng: -82.0712,
    radius: 150,
    description: 'Lush tropical blooms in Rachel\'s signature vivid palette.',
    year: 2021,
  },
  {
    id: 5,
    name: 'The Mermaid of Sanibel',
    address: '1025 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4488,
    lng: -82.0902,
    radius: 150,
    description:
      'A whimsical mermaid encircled by sea glass, shells, and island magic.',
    year: 2021,
  },
  {
    id: 6,
    name: 'Great Blue Heron',
    address: '1630 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4481,
    lng: -82.0823,
    radius: 150,
    description:
      'A stately great blue heron standing in the stillness of a tidal flat.',
    year: 2019,
  },
  {
    id: 7,
    name: 'Sanibel Lighthouse Sunrise',
    address: '1 Lighthouse Way, Sanibel Island, FL 33957',
    lat: 26.4399,
    lng: -82.0157,
    radius: 150,
    description:
      'The historic Sanibel Lighthouse bathed in watercolor sunrise hues.',
    year: 2022,
  },
  {
    id: 8,
    name: 'Palm Paradise',
    address: '1539 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4485,
    lng: -82.0838,
    radius: 150,
    description:
      'Swaying palms and a turquoise sky — pure Sanibel in every brushstroke.',
    year: 2022,
  },
  {
    id: 9,
    name: 'Dolphin Dance',
    address: '975 Rabbit Rd, Sanibel Island, FL 33957',
    lat: 26.4456,
    lng: -82.0923,
    radius: 150,
    description: 'A playful pod of dolphins leaping through Gulf waters.',
    year: 2023,
  },
  {
    id: 10,
    name: 'Seahorse & Sea Glass',
    address: '2075 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4473,
    lng: -82.0745,
    radius: 150,
    description: 'A delicate seahorse surrounded by a mosaic of sea glass treasures.',
    year: 2023,
  },
  {
    id: 11,
    name: 'Osprey\'s Catch',
    address: '1101 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4487,
    lng: -82.0895,
    radius: 150,
    description: 'An osprey diving with wings spread wide above sparkling Gulf waters.',
    year: 2023,
  },
  {
    id: 12,
    name: 'Mangrove Magic',
    address: '3111 West Gulf Dr, Sanibel Island, FL 33957',
    lat: 26.4503,
    lng: -82.0978,
    radius: 150,
    description:
      'The intricate root systems of Sanibel\'s mangroves in jewel-toned color.',
    year: 2024,
  },
  {
    id: 13,
    name: 'Shelling at Sunrise',
    address: '2499 Periwinkle Way, Sanibel Island, FL 33957',
    lat: 26.4465,
    lng: -82.0698,
    radius: 150,
    description:
      'The beloved "Sanibel stoop" — collectors bending for shells at golden hour.',
    year: 2024,
  },
  {
    id: 14,
    name: 'Flamingo Fiesta',
    address: '1157 Causeway Rd, Sanibel Island, FL 33957',
    lat: 26.4534,
    lng: -82.1012,
    radius: 150,
    description:
      'A flock of flamingos in Rachel\'s most colorful, celebratory style.',
    year: 2024,
  },
];
