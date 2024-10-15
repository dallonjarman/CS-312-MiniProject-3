CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    creator_name VARCHAR(255),
    creator_user_id VARCHAR(255),
    title VARCHAR(255),
    body TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    password VARCHAR(255),
    name VARCHAR(255)
);