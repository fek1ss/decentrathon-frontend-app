import { pgTable, text, real, serial } from 'drizzle-orm/pg-core';

export const geoLocations = pgTable('geo_locations', {
  id: serial('id').primaryKey(),
  randomizedId: text('randomized_id').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  alt: real('alt').notNull(),
  spd: real('spd').notNull(),
  azm: real('azm').notNull(),
});
