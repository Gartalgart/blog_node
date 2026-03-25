import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.MDP,
    database: 'blog-node'
})

export default pool
