/**
 * The 14 mural locations across Sanibel Island painted by Rachel Pierce.
 *
 * IMPORTANT: These coordinates were geocoded from verified Google Maps lookups
 * of the actual business addresses (March 2026). Do NOT use approximate or
 * fabricated coordinates — always geocode from the real street address.
 *
 * NOTE: The mural names below are PLACEHOLDERS and need to be replaced with
 * the actual mural titles. The locations/addresses are confirmed correct.
 *
 * Radius is the geofence radius in meters for the Mural Selfie Trail feature.
 */

import type { MuralLocation } from '@/types';

export const MURAL_LOCATIONS: MuralLocation[] = [
  {
    id: 1,
    // TODO: Replace with actual mural name
    name: 'Sea Turtle Sanctuary',
    address: 'Lighthouse Cafe, 1020 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4468597,
    lng: -82.0409293,
    radius: 150,
    description:
      'A vibrant sea turtle mural celebrating the nesting turtles of Sanibel\'s shores.',
    year: 2019,
  },
  {
    id: 2,
    // TODO: Replace with actual mural name
    name: 'Roseate Spoonbill in Flight',
    address: 'Tortuga Beach Club, 959 E. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4395992,
    lng: -82.0393715,
    radius: 150,
    description:
      'A sweeping depiction of the beloved roseate spoonbill soaring over island marshes.',
    year: 2020,
  },
  {
    id: 3,
    // TODO: Replace with actual mural name
    name: 'Manatee Morning',
    address: 'Loggerhead Cay, 979 E. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4398768,
    lng: -82.0405075,
    radius: 150,
    description: 'A gentle manatee drifting through sun-dappled waters.',
    year: 2020,
  },
  {
    id: 4,
    // TODO: Replace with actual mural name
    name: 'Island Florals',
    address: 'Sundial Beach Resort, 1451 Middle Gulf Dr, Sanibel, FL 33957',
    lat: 26.4315721,
    lng: -82.0517195,
    radius: 150,
    description: 'Lush tropical blooms in Rachel\'s signature vivid palette.',
    year: 2021,
  },
  {
    id: 5,
    // TODO: Replace with actual mural name
    name: 'The Mermaid of Sanibel',
    address: 'Anchor Inn, 1245 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4441864,
    lng: -82.0467407,
    radius: 150,
    description:
      'A whimsical mermaid encircled by sea glass, shells, and island magic.',
    year: 2021,
  },
  {
    id: 6,
    // TODO: Replace with actual mural name
    name: 'Great Blue Heron',
    address: 'Sanibel Holiday, 1648 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4422593,
    lng: -82.0582572,
    radius: 150,
    description:
      'A stately great blue heron standing in the stillness of a tidal flat.',
    year: 2019,
  },
  {
    id: 7,
    // TODO: Replace with actual mural name
    name: 'Sanibel Lighthouse Sunrise',
    address: 'Rachel Pierce Art Gallery, 1571 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4418806,
    lng: -82.0557876,
    radius: 150,
    description:
      'The historic Sanibel Lighthouse bathed in watercolor sunrise hues.',
    year: 2022,
  },
  {
    id: 8,
    // TODO: Replace with actual mural name
    name: 'Palm Paradise',
    address: 'Sanibel Caf\u00e9, 2007 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.438531,
    lng: -82.066615,
    radius: 150,
    description:
      'Swaying palms and a turquoise sky \u2014 pure Sanibel in every brushstroke.',
    year: 2022,
  },
  {
    id: 9,
    // TODO: Replace with actual mural name
    name: 'Dolphin Dance',
    address: 'Sanibel Sprout, 2407 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4358032,
    lng: -82.0776823,
    radius: 150,
    description: 'A playful pod of dolphins leaping through Gulf waters.',
    year: 2023,
  },
  {
    id: 10,
    // TODO: Replace with actual mural name
    name: 'Seahorse & Sea Glass',
    address: 'CVS Pharmacy, 2331 Palm Ridge Rd, Sanibel, FL 33957',
    lat: 26.4370123,
    lng: -82.0778395,
    radius: 150,
    description: 'A delicate seahorse surrounded by a mosaic of sea glass treasures.',
    year: 2023,
  },
  {
    id: 11,
    // TODO: Replace with actual mural name
    name: 'Osprey\'s Catch',
    address: 'Shalimar Beach Resort, 2823 W. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4230609,
    lng: -82.0884098,
    radius: 150,
    description: 'An osprey diving with wings spread wide above sparkling Gulf waters.',
    year: 2023,
  },
  {
    id: 12,
    // TODO: Replace with actual mural name
    name: 'Mangrove Magic',
    address: 'The SeaShells of Sanibel, 2840 W. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4259448,
    lng: -82.0892634,
    radius: 150,
    description:
      'The intricate root systems of Sanibel\'s mangroves in jewel-toned color.',
    year: 2024,
  },
  {
    id: 13,
    // TODO: Replace with actual mural name
    name: 'Shelling at Sunrise',
    address: 'SanCap Medical Center, 4301 Sanibel Captiva Rd, Sanibel, FL 33957',
    lat: 26.450358,
    lng: -82.129249,
    radius: 150,
    description:
      'The beloved "Sanibel stoop" \u2014 collectors bending for shells at golden hour.',
    year: 2024,
  },
  {
    id: 14,
    // TODO: Replace with actual mural name
    name: 'Flamingo Fiesta',
    address: 'Sanibel Fire Dept Station #172, 5171 Sanibel Captiva Rd, Sanibel, FL 33957',
    lat: 26.4653901,
    lng: -82.1522022,
    radius: 150,
    description:
      'A flock of flamingos in Rachel\'s most colorful, celebratory style.',
    year: 2024,
  },
];
