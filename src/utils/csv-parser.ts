import { CsvRow, GeoLocation } from '../types';

export const parseCsvLine = (line: string): CsvRow | null => {
  const parts = line.split(',');
  if (parts.length !== 6) return null;
  
  return {
    randomized_id: parts[0],
    lat: parts[1],
    lng: parts[2],
    alt: parts[3],
    spd: parts[4],
    azm: parts[5],
  };
};

export const convertToGeoLocation = (row: CsvRow): GeoLocation => ({
  id: row.randomized_id,
  lat: parseFloat(row.lat),
  lng: parseFloat(row.lng),
  alt: parseFloat(row.alt),
  spd: parseFloat(row.spd),
  azm: parseFloat(row.azm),
});

export const isValidGeoLocation = (location: GeoLocation): boolean => {
  return !isNaN(location.lat) && 
         !isNaN(location.lng) && 
         !isNaN(location.alt) && 
         !isNaN(location.spd) && 
         !isNaN(location.azm);
};
