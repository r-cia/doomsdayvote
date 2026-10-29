#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE doomsday_owner LOGIN PASSWORD '${DOOMSDAY_OWNER_PASSWORD}';
  CREATE ROLE doomsday_app LOGIN PASSWORD '${DOOMSDAY_APP_PASSWORD}';
  ALTER SCHEMA public OWNER TO doomsday_owner;
  REVOKE ALL ON SCHEMA public FROM PUBLIC;
  GRANT USAGE ON SCHEMA public TO doomsday_app;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE doomsdayvote_test OWNER doomsday_owner;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname doomsdayvote_test <<-EOSQL
  REVOKE ALL ON SCHEMA public FROM PUBLIC;
  GRANT USAGE ON SCHEMA public TO doomsday_app;
EOSQL
