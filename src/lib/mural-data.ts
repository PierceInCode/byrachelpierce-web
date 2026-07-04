/**
 * The 14 mural locations across Sanibel Island painted by Rachel Pierce.
 *
 * IMPORTANT: These coordinates were geocoded from verified Google Maps lookups
 * of the actual business addresses (March 2026). Do NOT use approximate or
 * fabricated coordinates — always geocode from the real street address.
 *
 * CONTENT HONESTY (Architecture §4.4, DECISIONS 007 / 022): the `name` field
 * holds each mural's REAL location/business name (the same one that leads its
 * verified `address`). The mural TITLES, DESCRIPTIONS, and YEARS have not yet
 * been supplied by Rachel, so `description` and `year` are intentionally
 * absent — the public site never presents invented facts (Iron Invariant 3).
 * R4's content intake (Architecture §7) fills real titles/descriptions/years
 * from Rachel's CSV; the UI un-suppresses them automatically by data presence
 * (the renders already guard `description`/`year` with `&&`), and overwrites
 * `name` with the real mural title — no code change required at that time.
 *
 * Radius is the geofence radius in meters for the Mural Selfie Trail feature.
 */

import type { MuralLocation } from '@/types';

export const MURAL_LOCATIONS: MuralLocation[] = [
  {
    id: 1,
    name: 'Lighthouse Cafe',
    address: 'Lighthouse Cafe, 1020 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4468597,
    lng: -82.0409293,
    radius: 150,
  },
  {
    id: 2,
    name: 'Tortuga Beach Club',
    address: 'Tortuga Beach Club, 959 E. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4395992,
    lng: -82.0393715,
    radius: 150,
  },
  {
    id: 3,
    name: 'Loggerhead Cay',
    address: 'Loggerhead Cay, 979 E. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4398768,
    lng: -82.0405075,
    radius: 150,
  },
  {
    id: 4,
    name: 'Sundial Beach Resort',
    address: 'Sundial Beach Resort, 1451 Middle Gulf Dr, Sanibel, FL 33957',
    lat: 26.4315721,
    lng: -82.0517195,
    radius: 150,
  },
  {
    id: 5,
    name: 'Anchor Inn',
    address: 'Anchor Inn, 1245 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4441864,
    lng: -82.0467407,
    radius: 150,
  },
  {
    id: 6,
    name: 'Sanibel Holiday',
    address: 'Sanibel Holiday, 1648 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4422593,
    lng: -82.0582572,
    radius: 150,
  },
  {
    id: 7,
    name: 'Rachel Pierce Art Gallery',
    address: 'Rachel Pierce Art Gallery, 1571 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4418806,
    lng: -82.0557876,
    radius: 150,
  },
  {
    id: 8,
    name: 'Sanibel Café',
    address: 'Sanibel Café, 2007 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.438531,
    lng: -82.066615,
    radius: 150,
  },
  {
    id: 9,
    name: 'Sanibel Sprout',
    address: 'Sanibel Sprout, 2407 Periwinkle Way, Sanibel, FL 33957',
    lat: 26.4358032,
    lng: -82.0776823,
    radius: 150,
  },
  {
    id: 10,
    name: 'CVS Pharmacy',
    address: 'CVS Pharmacy, 2331 Palm Ridge Rd, Sanibel, FL 33957',
    lat: 26.4370123,
    lng: -82.0778395,
    radius: 150,
  },
  {
    id: 11,
    name: 'Shalimar Beach Resort',
    address: 'Shalimar Beach Resort, 2823 W. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4230609,
    lng: -82.0884098,
    radius: 150,
  },
  {
    id: 12,
    name: 'The SeaShells of Sanibel',
    address: 'The SeaShells of Sanibel, 2840 W. Gulf Dr, Sanibel, FL 33957',
    lat: 26.4259448,
    lng: -82.0892634,
    radius: 150,
  },
  {
    id: 13,
    name: 'SanCap Medical Center',
    address: 'SanCap Medical Center, 4301 Sanibel Captiva Rd, Sanibel, FL 33957',
    lat: 26.450358,
    lng: -82.129249,
    radius: 150,
  },
  {
    id: 14,
    name: 'Sanibel Fire Dept Station #172',
    address: 'Sanibel Fire Dept Station #172, 5171 Sanibel Captiva Rd, Sanibel, FL 33957',
    lat: 26.4653901,
    lng: -82.1522022,
    radius: 150,
  },
];
