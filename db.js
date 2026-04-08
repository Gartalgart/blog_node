// Connexion à la base de données MySQL
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Charge les variables du fichier .env (mot de passe BDD)
dotenv.config()

// Crée un pool de connexions vers la base de données
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.MDP,
    database: 'blog-node'
})

export default pool
