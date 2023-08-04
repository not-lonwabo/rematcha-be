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
    matches UUID[]
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

INSERT INTO users (id, username, salt, hash) VALUES ('fd7d4e2a-b49f-4b22-838a-bb364fb7b896', 'raranen', 'd72db2b15155a3e902793a5083f7b7e7583526e333cfa7caeda0fb1ea635b0765b899a934f4743fa004c9848019585be4e87ed2adfae0ebef12118f2d029d0ec', 'd9205efac94383abc2acc169d360dc72fdb96516ef24128772185fd858c82015');

INSERT INTO users (id, username, salt, hash) VALUES ('0d600bb1-3770-4206-b4d3-11646101a779', 'john@higgins', 'bab0b94e7372b1f97bc79cb72f29c081d387c81e46686f48df00e741d9afd5e8fc3c141979483b1f6cfa7d815b5ce343357ca9dd08b8e90b2fe81242f2a441ca', '70ce23a2ff21b0305b55a0e5d547749a51190cc48cb88f48a943635bc049ee50');

INSERT INTO users (id, username, salt, hash) VALUES ('9c58dffe-593a-462b-8a0b-b66784bf5fe2', 'big@josher', 'bab0b94e7372b1f97bc79cb72f29c081d387c81e46686f48df00e741d9afd5e8fc3c141979483b1f6cfa7d815b5ce343357ca9dd08b8e90b2fe81242f2a441ca', '70ce23a2ff21b0305b55a0e5d547749a51190cc48cb88f48a943635bc049ee50');

UPDATE users SET myLikes = array_append(myLikes, 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896') WHERE id = '0d600bb1-3770-4206-b4d3-11646101a779';

UPDATE users SET likeMe = array_append(likeMe, '0d600bb1-3770-4206-b4d3-11646101a779') WHERE id = 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896';

do $$
declare
matching users%rowtype;
input_user_id users.id%type := '0d600bb1-3770-4206-b4d3-11646101a779';
begin
select * from users into matching where input_user_id = any(likeMe);
if found then
raise notice 'here!';
UPDATE users SET matches = array_append(matches, '0d600bb1-3770-4206-b4d3-11646101a779'), likeMe = array_remove(likeMe, '0d600bb1-3770-4206-b4d3-11646101a779') WHERE id = 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896';
INSERT INTO chats (chat_id, user_id, messages) VALUES ('891f78ea-36b1-4269-9e75-82ca22f5fd01', 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896', ('[' + '{"match": "You matched"}' + ']')::jsonb[]);
else
raise notice 'here instead!';
UPDATE users SET myLikes = array_append(myLikes, '0d600bb1-3770-4206-b4d3-11646101a779') WHERE id = 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896';
UPDATE users SET likeMe = array_append(likeMe, 'fd7d4e2a-b49f-4b22-838a-bb364fb7b896') WHERE id = '0d600bb1-3770-4206-b4d3-11646101a779';
end if;
end $$;