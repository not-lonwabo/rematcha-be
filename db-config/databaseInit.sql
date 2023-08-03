DROP TABLE if exists chats;
DROP TABLE if exists images;
DROP TABLE if exists users;

CREATE TABLE users (
    id UUID NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    lon FLOAT,
    lat FLOAT,
    lowerAgeRange INT,
    higherAgeRange INT,
    myLikes UUID[],
    likeMe UUID[],
    chats UUID[]
);

CREATE TABLE chats (
    chat_id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    messages JSONB[],
    CONSTRAINT fk_users
        FOREIGN KEY(user_id) 
	        REFERENCES users(id)
            ON DELETE CASCADE
);

CREATE TABLE images (
    user_id UUID NOT NULL,
    image_id UUID NOT NULL PRIMARY KEY,
    image_blob BYTEA,
    CONSTRAINT fk_users
        FOREIGN KEY(user_id) 
	        REFERENCES users(id)
	        ON DELETE CASCADE
);