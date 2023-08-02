DROP TABLE if exists users;

CREATE TABLE users (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL
);