/* Ce dossier correspond aux datas que la base de donné postgressql aura par défault au démarrage */  
/* En cas de changement, il faut d'abord faire dans le terminal : docker compose down -v */
/* puis : docker compose up -d --build */


CREATE TABLE Applications ( 
    id BIGSERIAL PRIMARY KEY, 
    name TEXT NOT NULL,
    mail TEXT, 
    cover_letter TEXT, 
    application_status TEXT ); 
    
CREATE TABLE People ( 
    id BIGSERIAL PRIMARY KEY, 
    name TEXT NOT NULL, 
    first_name TEXT NOT NULL, 
    phone_number TEXT, 
    mail TEXT NOT NULL,
    password TEXT NOT NULL, 
    adress TEXT, 
    city TEXT ); 
        
CREATE TABLE Companies ( 
    id BIGSERIAL PRIMARY KEY, 
    name TEXT NOT NULL, 
    siret TEXT NOT NULL UNIQUE,
    mail TEXT,
    password TEXT, 
    business_sector TEXT, 
    headquarters TEXT, 
    web_site TEXT, 
    description TEXT ); 
    
CREATE TABLE Advertisements ( 
    id BIGSERIAL PRIMARY KEY, 
    company_name TEXT NOT NULL, 
    job_name TEXT NOT NULL, 
    contract_type TEXT NOT NULL, 
    business_sector TEXT, 
    salary TEXT NOT NULL, 
    city TEXT, 
    adress TEXT,  
    description TEXT NOT NULL );

INSERT INTO Applications (id, name, mail, cover_letter, application_status) VALUES
(1, 'Alice Dupont', 'alice.dupont@mail.com', 'I am highly motivated to join your company.', 'Pending'),
(2, 'Marc Leroy', 'marc.leroy@mail.com', 'Looking forward to contributing to your team.', 'Accepted'),
(3, 'Sophie Martin', 'sophie.martin@mail.com', 'With 3 years of experience, I can add value.', 'Rejected'),
(4, 'Lucas Bernard', 'lucas.bernard@mail.com', 'Excited to learn and grow in this role.', 'Pending'),
(5, 'Emma Laurent', 'emma.laurent@mail.com', 'Skilled in project management and teamwork.', 'Interview Scheduled'),
(6, 'Nathan Petit', 'nathan.petit@mail.com', 'I am confident in my technical expertise.', 'Pending'),
(7, 'Chloé Simon', 'chloe.simon@mail.com', 'Ready to take on new challenges.', 'Accepted'),
(8, 'Paul Robert', 'paul.robert@mail.com', 'Strong communication and leadership skills.', 'Pending'),
(9, 'Julie Lefevre', 'julie.lefevre@mail.com', 'Motivated to contribute positively.', 'Rejected'),
(10, 'Tom Dubois', 'tom.dubois@mail.com', 'I would be a great fit for your company.', 'Pending');

INSERT INTO People (id, name, first_name, phone_number, mail, password, adress, city) VALUES
(1, 'Dupont', 'Alice', '0612345678', 'alice.dupont@mail.com', 'passAlice', '12 rue des Lilas', 'Paris'),
(2, 'Leroy', 'Marc', '0623456789', 'marc.leroy@mail.com', 'passMarc', '5 avenue de la République', 'Lyon'),
(3, 'Martin', 'Sophie', '0634567890', 'sophie.martin@mail.com', 'passSophie', '3 rue Victor Hugo', 'Marseille'),
(4, 'Bernard', 'Lucas', '0645678901', 'lucas.bernard@mail.com', 'passLucas', '22 chemin des Fleurs', 'Toulouse'),
(5, 'Laurent', 'Emma', '0656789012', 'emma.laurent@mail.com', 'passEmma', '14 boulevard du Midi', 'Nice'),
(6, 'Petit', 'Nathan', '0667890123', 'nathan.petit@mail.com', 'passNathan', '18 rue des Orangers', 'Bordeaux'),
(7, 'Simon', 'Chloé', '0678901234', 'chloe.simon@mail.com', 'passChloe', '27 rue Lafayette', 'Lille'),
(8, 'Robert', 'Paul', '0689012345', 'paul.robert@mail.com', 'passPaul', '8 rue du Général', 'Strasbourg'),
(9, 'Lefevre', 'Julie', '0690123456', 'julie.lefevre@mail.com', 'passJulie', '11 rue du Port', 'Nantes'),
(10, 'Dubois', 'Tom', '0601234567', 'tom.dubois@mail.com', 'passTom', '9 rue Montmartre', 'Reims');

INSERT INTO Companies (id, name, siret, mail, password, business_sector, headquarters, web_site, description) VALUES
(1, 'TechNova', '12345678900011', 'contact@technova.com', 'passTechNova', 'Technology', 'Paris', 'https://technova.com', 'Innovative software solutions.'),
(2, 'GreenEnergy', '98765432100022', 'info@greenenergy.com', 'passGreen', 'Energy', 'Lyon', 'https://greenenergy.com', 'Sustainable energy provider.'),
(3, 'BuildRight', '45678912300033', 'hr@buildright.com', 'passBuild', 'Construction', 'Marseille', 'https://buildright.com', 'Quality construction services.'),
(4, 'EduSmart', '65432198700044', 'support@edusmart.com', 'passEdu', 'Education', 'Toulouse', 'https://edusmart.com', 'Online learning solutions.'),
(5, 'Foodies', '74185296300055', 'hello@foodies.com', 'passFood', 'Catering', 'Nice', 'https://foodies.com', 'Fresh and fast food service.'),
(6, 'MediCare', '85296374100066', 'contact@medicare.com', 'passMedi', 'Health', 'Bordeaux', 'https://medicare.com', 'Healthcare and medical support.'),
(7, 'AutoDrive', '96374185200077', 'jobs@autodrive.com', 'passAuto', 'Automotive', 'Lille', 'https://autodrive.com', 'Smart car manufacturing.'),
(8, 'FinSecure', '15975348600088', 'admin@finsecure.com', 'passFin', 'Finance', 'Strasbourg', 'https://finsecure.com', 'Financial security services.'),
(9, 'ArtVision', '35715948600099', 'info@artvision.com', 'passArt', 'Design', 'Nantes', 'https://artvision.com', 'Creative design studio.'),
(10, 'SkyNetWorks', '25845678900100', 'support@skynetworks.com', 'passSky', 'Telecommunications', 'Reims', 'https://skynetworks.com', 'Global communication solutions.');

INSERT INTO Advertisements (id, company_name, job_name, contract_type, business_sector, salary, city, adress, description) VALUES
(1, 'TechNova', 'Frontend Developer', 'CDI', 'Technology', '40000', 'Paris', '10 rue de la Paix', 'Develop modern web interfaces.'),
(2, 'GreenEnergy', 'Project Engineer', 'CDI', 'Energy', '42000', 'Lyon', '22 rue Lumière', 'Manage renewable energy projects.'),
(3, 'BuildRight', 'Site Manager', 'CDI', 'Construction', '38000', 'Marseille', '15 rue du Port', 'Oversee construction site operations.'),
(4, 'EduSmart', 'Course Designer', 'CDD', 'Education', '32000', 'Toulouse', '5 rue du Savoir', 'Design engaging online courses.'),
(5, 'Foodies', 'Chef de Cuisine', 'CDI', 'Catering', '30000', 'Nice', '3 avenue Gourmande', 'Prepare and manage kitchen operations.'),
(6, 'MediCare', 'Nurse', 'CDI', 'Health', '29000', 'Bordeaux', '18 rue Santé', 'Provide patient care in clinics.'),
(7, 'AutoDrive', 'Mechanical Engineer', 'CDI', 'Automotive', '41000', 'Lille', '12 rue Mécanique', 'Develop and test automotive systems.'),
(8, 'FinSecure', 'Financial Analyst', 'CDI', 'Finance', '45000', 'Strasbourg', '8 rue des Marchés', 'Analyze and forecast financial data.'),
(9, 'ArtVision', 'Graphic Designer', 'Freelance', 'Design', '28000', 'Nantes', '7 rue des Arts', 'Create visual designs for clients.'),
(10, 'SkyNetWorks', 'Network Administrator', 'CDI', 'Telecommunications', '43000', 'Reims', '9 avenue des Réseaux', 'Maintain and secure IT networks.');