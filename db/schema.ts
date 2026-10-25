import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const profiles = sqliteTable("music_profiles", {
  owner: text("owner").primaryKey(),
  name: text("name").notNull(),
  payload: text("payload").notNull().default("{}"),
  version: integer("version").notNull().default(0),
});
export const playlists = sqliteTable(
  "music_playlists",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    payload: text("payload").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("music_playlists_owner").on(t.owner)],
);
export const tracks = sqliteTable(
  "music_cloud_tracks",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    payload: text("payload").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("music_cloud_tracks_owner").on(t.owner)],
);
export const catalog = sqliteTable("music_catalog_cache", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
