# 🖥️ BlogIt Backend  

![Node.js](https://img.shields.io/badge/Node.js-18-green?logo=node.js)  
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey?logo=express)  
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen?logo=mongodb)  
![JWT](https://img.shields.io/badge/Auth-JWT-orange)  
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)  

The **BlogIt Backend** powers the BlogIt blogging platform. It provides **RESTful APIs** for user authentication and blog post management, enabling the frontend to consume data securely and efficiently.  

---

## ✨ Features  

- 🔐 User registration and login with **JWT authentication**  
- 📝 Blog post **CRUD operations** (Create, Read, Update, Delete)  
- 🔒 Passwords securely hashed using **bcrypt**  
- 📡 RESTful API design following best practices  
- 🛠️ Configurable with environment variables  

---

## 🛠️ Technologies Used  

- **Node.js**  
- **Express.js**  
- **MongoDB + Mongoose**  
- **JWT** – authentication  
- **bcryptjs** – password hashing  
- **dotenv** – environment variables  

---

## 🚀 Setup Instructions  

Follow these steps to run the backend locally:  

### 1. Clone the repository  

```bash
git clone https://github.com/minnulekha/BlogIt-Backend.git
````

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the **backend** folder 

### 4. Run the backend server

```bash
npm start
```

The backend will now run at **[http://localhost:5000](http://localhost:5000)** 🚀

---

## 📂 Project Structure

```
backend/  
│-- .env                 # Environment variables  
│-- server.js            # Express server entry point   
```
---

## 📜 License

This project is licensed under the **MIT License**.
