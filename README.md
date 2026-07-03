# Finora AI
### Cognitive Financial Auditing & Wealth Management Platform

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss)
![DeepSeek](https://img.shields.io/badge/DeepSeek-Chat-blue?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?style=for-the-badge&logo=google)

</p>

---

## Overview

**Finora AI** is an intelligent financial management platform designed for **individuals, entrepreneurs, and startups**.

Unlike traditional budgeting applications, Finora AI combines:

- AI-powered financial analysis
- Smart budgeting & auditing
- Credit risk simulation
- Goal-oriented savings
- Investment forecasting
- Wealth management dashboard

---

# Features

## Financial Dashboard

- Income & expense analytics
- Budget efficiency calculation
- Monthly financial overview
- Dynamic statistics
- Personal finance health score

---

## Goal Management

Create and manage financial goals.

Examples:

- Buy a Car
- Apartment
- Vacation
- New Laptop

Each goal tracks:

- Target amount
- Current savings
- Progress
- Estimated completion

---

## Investment Simulator

Interactive investment calculator with two analytical modes.

### Historical Performance

Simulates historical market movement and volatility using realistic market parameters.

### Future Growth Projection

Projects compound growth using:


| Variable | Description |
|-----------|-------------|
| **P** | Initial investment |
| **PMT** | Monthly contribution |
| **r** | Annual expected return |
| **t** | Investment duration |

Supported investment horizons:

- 1 year
- 3 years
- 5 years
- 10 years
- 20 years

---

## Loan Comparison Engine

Compare **18 loan offers** from Moldova's largest banks.

Supported banks:

- MAIB
- MICB
- OTP Bank
- Victoriabank
- FinComBank
- BCR Chișinău

Each bank includes:

- Consumer Loan
- Express Loan
- Credit Card

Real-time calculations:

- Monthly payment
- Total repayment
- Overpayment
- Interest rate
- Debt-To-Income (DTI)
- Financial risk indicator

---

## AI Financial Advisor

Generate personalized recommendations using AI.

Examples:

- Budget optimization
- Saving strategies
- Spending analysis
- Investment suggestions
- Financial planning

Powered by:

- DeepSeek Chat
- Google Gemini Flash

---

## Authentication

- JWT Authentication
- Spring Security
- Protected REST API
- Secure profile switching
- Local profile caching
- Automatic 403 handling

---

# System Architecture

```mermaid
graph TD

Client[Next.js Frontend]
Gateway[Spring Boot REST API]
Database[(PostgreSQL / Supabase)]
AI[OpenRouter / Gemini]
Security[RLS + JWT]

Client --> Gateway
Gateway --> Database
Client --> AI
Database --> Security
```

---

# ⚙️ Technical Highlights

## Smart Goal Deduction

When contributing money toward a goal, users choose where funds originate.

### Savings

Updates:

```
PUT /api/users/profile
```

Reduces:

```
baseSavings
```

---

### Monthly Expenses

Creates transaction:

```
POST /api/users/details/transactions
```

Automatically recalculates:

- Expenses
- Budget efficiency
- Financial statistics

---

## Lightweight SVG Charts

Instead of using heavy charting libraries, Finora AI renders responsive SVG graphs manually.

Benefits:

- Faster loading
- Smaller bundle
- Better responsiveness
- No external plotting dependency

---

## Credit Risk Analysis

Every loan recalculates:

- Monthly annuity
- Total interest
- Total repayment
- DTI ratio

If

```
DTI > 40%
```

the interface immediately displays a financial warning.

---

## Intelligent Error Handling

The frontend intercepts authentication failures.

Instead of exposing backend errors:

```
403 Forbidden
```

Users always receive:

```
Incorrect nickname or password
```

creating a consistent authentication experience.

---

# 🗄 Database Schema

```mermaid
erDiagram

USERS ||--|| USER_DETAILS : has
USERS ||--o{ GOALS : tracks
USERS ||--o{ TRANSACTIONS : logs

USERS{
bigint id PK
string username
string email
string password
}

USER_DETAILS{
bigint id PK
bigint user_id FK
string job
string country
bigint baseSavings
bigint baseSalary
bigint baseExpenses
}

GOALS{
bigint id PK
bigint user_id FK
string goalName
bigint targetAmount
bigint savedAmount
}

TRANSACTIONS{
bigint id PK
bigint user_id FK
string transactionType
string category
bigint amount
string date
}
```

---

# Project Structure

```
finora-ai
│
├── finora-frontend
│   ├── app
│   │   ├── dashboard
│   │   ├── loans
│   │   ├── profile
│   │   │   ├── advices
│   │   │   └── goal-details
│   │   └── verification
│   │
│   ├── public
│   └── package.json
│
└── finora-backend
    ├── controller
    ├── service
    ├── repository
    ├── model
    └── pom.xml
```

---

# Installation

## Prerequisites

- Node.js 18+
- Java 17+
- Maven
- PostgreSQL
- Supabase (optional)

---

# Backend

Clone repository

```bash
git clone https://github.com/EduardIateniuc/finora-ai.git
cd finora-ai/finora-backend
```

Configure

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

Run

```bash
mvn clean install
mvn spring-boot:run
```

Backend:

```
http://localhost:8080
```

---

# Frontend

```
cd ../finora-frontend
```

Create

```
.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8080

OPENROUTER_API_KEY=your_api_key

OPENROUTER_MODEL=deepseek/deepseek-chat:free
```

Install

```bash
npm install
```

Run

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# 📡 REST API

Private endpoints require

```
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint | Description |
|----------|-----------|------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/details/transactions` | Add transaction |
| PUT | `/api/users/details/goals/{id}` | Update goal |
| DELETE | `/api/users/details/goals/{id}` | Delete goal |

---

# Security

✔ JWT Authentication

✔ Spring Security

✔ Password Encryption

✔ Protected REST Endpoints

✔ Row Level Security (Supabase)

✔ CORS Protection

✔ Secure Local Storage

---

# 🛠 Tech Stack

### Frontend

- Next.js 14
- React
- Tailwind CSS
- TypeScript

### Backend

- Spring Boot 3
- Spring Security
- JWT
- Hibernate
- JPA

### Database

- PostgreSQL
- Supabase

### AI

- DeepSeek
- Gemini Flash
- OpenRouter

---

# Screenshots


<img width="1514" height="997" alt="Снимок экрана 2026-07-03 в 12 45 05" src="https://github.com/user-attachments/assets/a738ac0a-557a-4404-9a5c-ce049087e49f" />
<img width="1527" height="996" alt="Снимок экрана 2026-07-03 в 12 42 08" src="https://github.com/user-attachments/assets/ce42e2e0-7282-4131-a6a2-8ab48b716924" />
<img width="1522" height="997" alt="Снимок экрана 2026-07-03 в 12 43 17" src="https://github.com/user-attachments/assets/14378375-7964-402d-8e0d-6b538979e0cb" />
<img width="1522" height="1002" alt="Снимок экрана 2026-07-03 в 12 44 38" src="https://github.com/user-attachments/assets/d1747530-4ec3-4f22-a369-0121686cfcf0" />
<img width="1511" height="990" alt="Снимок экрана 2026-07-03 в 12 44 01" src="https://github.com/user-attachments/assets/10c9a9d2-9190-4ba8-bbcd-b39bca505f1c" />


---


License

This project was developed as part of the **Finora AI Financial Intelligence Platform**.

© 2026 Finora AI
