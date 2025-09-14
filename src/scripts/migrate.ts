import { createConnection } from '../db/connection';
import { GeoLocationService } from '../services/geo-location.service';
import { MigrationService } from '../services/migration.service';
import { DatabaseConfig } from '../types';

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'indrive_hackaton',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

async function migrate() {
  const db = createConnection(config);
  const geoLocationService = new GeoLocationService(db);
  const migrationService = new MigrationService(geoLocationService);
  
  const csvPath = './seed/geo_locations_astana_hackathon';
  
  console.log('Starting migration...');
  await migrationService.migrateFromCsv(csvPath);
  console.log('Migration completed!');
  
  const count = await geoLocationService.getCount();
  console.log(`Total records: ${count}`);
}

migrate().catch(console.error);
