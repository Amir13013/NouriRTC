-- Nombre total d'utilisateurs
SELECT COUNT(*) AS total_users
FROM users;


-- Nombre de serveurs
SELECT COUNT(*) AS total_servers
FROM servers;


-- Utilisateurs par serveur
SELECT
s.name AS server_name,
COUNT(us.user_id) AS total_users
FROM servers s
JOIN users_servers us ON s.id = us.server_id
GROUP BY s.name
ORDER BY total_users DESC;


-- Channels par serveur
SELECT
s.name AS server_name,
COUNT(c.id) AS total_channels
FROM servers s
LEFT JOIN channels c ON s.id = c.server_id
GROUP BY s.name
ORDER BY total_channels DESC;


-- Répartition des rôles
SELECT
role,
COUNT(*) AS total
FROM users_servers
GROUP BY role;


-- Nombres moyen d'utilisateurs par serveur
SELECT
    ROUND(AVG(user_count), 2) AS avg_users_per_server
FROM (
    SELECT COUNT(user_id) AS user_count
    FROM users_servers
    GROUP BY server_id
) AS subquery;


-- Nombre moyen de channels par serveur
SELECT
    ROUND(AVG(channel_count), 2) AS avg_channels_per_server
FROM (
    SELECT COUNT(id) AS channel_count
    FROM channels
    GROUP BY server_id
) AS subquery;