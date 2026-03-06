CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone_number TEXT,
    mail TEXT NOT NULL,
    password TEXT NOT NULL
);


CREATE TABLE Servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner UUID NOT NULL REFERENCES users(id),
    invitecode TEXT NOT NULL
);


CREATE TABLE users_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    server_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,

    CONSTRAINT unique_user_server UNIQUE (user_id, server_id),

    CONSTRAINT check_role
    CHECK (role IN ('owner', 'admin', 'member'))
);


CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    server_id UUID NOT NULL,

    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);