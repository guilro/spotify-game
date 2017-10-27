-- Up
CREATE TABLE settings (name UNIQUE, value TEXT);
CREATE TABLE songs (id UNIQUE, votes INTEGER, count INTEGER, description TEXT);
CREATE TABLE users (id UNIQUE, last_vote TEXT);

-- Down
DROP TABLE settings;
DROP TABLE songs;
DROP TABLE users;
