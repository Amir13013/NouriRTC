CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone_number TEXT,
    mail TEXT NOT NULL,
    password TEXT NOT NULL
);

INSERT INTO users (name, first_name, phone_number, mail, password) VALUES
('Dupont', 'Alice', '0612345678', 'alice.dupont@mail.com', 'passAlice'),
('Leroy', 'Marc', '0623456789', 'marc.leroy@mail.com', 'passMarc');
