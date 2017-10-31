-- Up
DROP TABLE users;
CREATE TABLE votes (
  user_id TEXT,
  song_id TEXT,
  created TEXT,
  FOREIGN KEY(song_id) REFERENCES songs(id)
);


-- Down
DROP TABLE votes;
CREATE TABLE users (id UNIQUE, last_vote TEXT);
