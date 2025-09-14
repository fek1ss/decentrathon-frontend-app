import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCsvLine, convertToGeoLocation, isValidGeoLocation } from '../utils/csv-parser';
import { GeoLocationService } from './geo-location.service';
import { GeoLocation } from '../types';

export class MigrationService {
  constructor(private geoLocationService: GeoLocationService) {}

  async migrateFromCsv(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const locations: GeoLocation[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const csvRow = parseCsvLine(line);
      if (!csvRow) continue;
      
      const location = convertToGeoLocation(csvRow);
      if (!isValidGeoLocation(location)) continue;
      
      locations.push(location);
    }
    
    await this.geoLocationService.insertBatch(locations);
  }
}
