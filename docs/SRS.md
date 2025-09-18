# Software Requirements Specification (SRS)
# for Capstone Project

**Version 1.0**

---

## Table of Contents

1.  [Introduction](#1-introduction)
    1.1. [Purpose](#11-purpose)
    1.2. [Scope](#12-scope)
    1.3. [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
    1.4. [References](#14-references)
    1.5. [Overview](#15-overview)
2.  [Overall Description](#2-overall-description)
    2.1. [Product Perspective](#21-product-perspective)
    2.2. [Product Functions](#22-product-functions)
    2.3. [User Characteristics](#23-user-characteristics)
    2.4. [Constraints](#24-constraints)
    2.5. [Assumptions and Dependencies](#25-assumptions-and-dependencies)
3.  [Specific Requirements](#3-specific-requirements)
    3.1. [Functional Requirements](#31-functional-requirements)
    3.2. [Non-Functional Requirements](#32-non-functional-requirements)
    3.3. [Interface Requirements](#33-interface-requirements)

---

## 1. Introduction

### 1.1. Purpose

This document defines the software requirements for the Capstone Project. It is intended for the project developers, testers, and stakeholders. The purpose is to provide a detailed description of the system's functionality, constraints, and user interactions for an e-commerce/ordering platform, likely for a campus or organizational setting.

### 1.2. Scope

The software will be a web-based application that allows users to browse products, place orders, and make payments. It will feature role-based access control for different user types (e.g., regular users, department heads, administrators). The system will manage user data, product catalogs, orders, payments, and reviews.

### 1.3. Definitions, Acronyms, and Abbreviations

| Term           | Definition                                                              |
| -------------- | ----------------------------------------------------------------------- |
| **User**       | A general user of the system, typically a student or staff member.      |
| **Dept Head**  | A user with special permissions, possibly for group orders.             |
| **Admin**      | A privileged user responsible for managing the system.                  |
| **Product**    | An item or service available for purchase.                              |
| **Order**      | A transaction initiated by a user to purchase one or more products.     |
| **Prisma**     | The Object-Relational Mapper (ORM) used for database access.            |
| **Next.js**    | The React framework used for building the application.                  |
| **Razorpay**   | The payment gateway integrated for processing online payments.          |
| **UI**         | User Interface.                                                         |

### 1.4. References

- `prisma/schema.prisma`: The definitive source for the database schema.
- `package.json`: Lists all project dependencies and scripts.
- `components.json`: Configuration for shadcn/ui components.

### 1.5. Overview

This document is organized into three main sections. Section 1 provides an introduction to the project. Section 2 gives an overall description of the product, its functions, users, and constraints. Section 3 details the specific functional, non-functional, and interface requirements.

---

## 2. Overall Description

### 2.1. Product Perspective

The product is a self-contained, modern web application built on the Next.js framework. It will interact with a PostgreSQL database via the Prisma ORM. The user interface will be styled with Tailwind CSS and utilize shadcn/ui components. It is intended to be deployed as a standalone web service.

### 2.2. Product Functions

The major functions of the system include:
- **User Authentication**: Secure user registration, login, and session management.
- **Product Catalog Management**: Admins can perform CRUD (Create, Read, Update, Delete) operations on products. Users can browse and search for products.
- **Order Processing**: Users can create and manage orders. The system will track order status from creation to delivery.
- **Payment Integration**: Secure payment processing through the Razorpay API.
- **Review System**: Users can submit reviews for products they have purchased.
- **Administrative Dashboard**: A dedicated interface for admins to manage users, products, orders, and departments.

### 2.3. User Characteristics

The system will have three primary user roles:
- **User**: Can browse products, place individual orders, make payments, and write reviews.
- **Department Head (`dept_head`)**: Has all the capabilities of a User, plus the ability to place group orders on behalf of their department.
- **Admin**: Has full control over the system, including managing products, users, departments, and all orders.

### 2.4. Constraints

- The application must be built using Next.js and TypeScript.
- The database must be PostgreSQL.
- The UI must be responsive and work on modern web browsers.
- All user input must be validated on the server-side (e.g., using Zod).

### 2.5. Assumptions and Dependencies

- A running PostgreSQL database instance is required.
- Access to a Razorpay merchant account is necessary for payment processing.
- The application will be deployed to a hosting environment that supports Node.js.

---

## 3. Specific Requirements

### 3.1. Functional Requirements

#### FR-1: User Account Management
This will be managed by the `User` model, which includes fields for `name`, `email`, `password`, and `role`.
- **FR-1.1**: Users shall be able to create an account with a name, email, and password.
- **FR-1.2**: Users shall be able to log in using their email and password.
- **FR-1.3**: The system shall securely store user passwords by hashing them.
- **FR-1.4**: Admins shall be able to assign roles (`user`, `dept_head`, `admin`) to users.

#### FR-2: Product Catalog
This corresponds to the `Product` model, containing fields such as `name`, `description`, `price`, and `stock`.
- **FR-2.1**: All users shall be able to view a list of available products.
- **FR-2.2**: Users shall be able to view detailed information for a single product, including name, description, price, and images.
- **FR-2.3**: Admins shall be able to add, update, and delete products.

#### FR-3: Ordering System
This functionality is supported by the `Order` and `OrderItem` models, linking users to the products they purchase.
- **FR-3.1**: Authenticated users shall be able to create an order.
- **FR-3.2**: An order shall consist of one or more `OrderItems`, each linked to a `Product` with a specified quantity.
- **FR-3.3**: The system shall support both `individual` and `group` order types.
- **FR-3.4**: Users shall be able to view their own order history.
- **FR-3.5**: Admins shall be able to view and update the status of any order (`draft`, `pending`, `paid`, `shipped`, `delivered`, `canceled`).

#### FR-4: Payment
Payment details are stored in the `Payment` model, which has a one-to-one relationship with an `Order` and includes Razorpay-specific IDs.
- **FR-4.1**: The system shall integrate with Razorpay to process payments for orders.
- **FR-4.2**: The system shall record payment details, including the Razorpay Order ID.

#### FR-5: Reviews
Product reviews are handled by the `Review` model, which links a `User` and a `Product` with a rating and text body.
- **FR-5.1**: Authenticated users shall be able to submit a review (rating and text) for a product.
- **FR-5.2**: Reviews shall be linked to the user and the product.

### 3.2. Non-Functional Requirements

- **NFR-1 (Performance)**: Page load times should be under 3 seconds on a standard internet connection.
- **NFR-2 (Security)**: All data transmission between the client and server must be encrypted using HTTPS. No sensitive data (like passwords or API keys) should be stored in the client-side code.
- **NFR-3 (Usability)**: The user interface must be intuitive and accessible, adhering to WCAG 2.1 AA standards where possible.
- **NFR-4 (Reliability)**: The system should aim for 99.9% uptime.

### 3.3. Interface Requirements

#### 3.3.1. User Interfaces
- The application will provide a responsive web interface accessible through modern browsers like Chrome, Firefox, and Safari.
- The UI will be built with React, Next.js, and styled with Tailwind CSS.

#### 3.3.2. Software Interfaces
- **Database**: The application will interface with a PostgreSQL database via the Prisma client.
- **Payment Gateway**: The application will interface with the Razorpay REST API for payment processing.
