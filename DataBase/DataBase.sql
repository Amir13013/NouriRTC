CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone_number TEXT,
    mail TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE Servers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner BIGINT NOT NULL REFERENCES users(id),
    invitecode TEXT NOT NULL
);  

CREATE TABLE users_servers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    server_id BIGINT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,

    CONSTRAINT unique_user_server UNIQUE (user_id, server_id),

    CONSTRAINT check_role
    CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE TABLE channels (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    server_id BIGINT NOT NULL,

    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);