\set ON_ERROR_STOP on

CREATE ROLE doomsday_owner LOGIN PASSWORD :'owner_password';
CREATE ROLE doomsday_app LOGIN PASSWORD :'app_password';

CREATE DATABASE doomsdayvote OWNER doomsday_owner;
CREATE DATABASE doomsdayvote_test OWNER doomsday_owner;

\connect doomsdayvote
ALTER SCHEMA public OWNER TO doomsday_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO doomsday_app;

\connect doomsdayvote_test
ALTER SCHEMA public OWNER TO doomsday_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO doomsday_app;
