# Merchandise Portal

[**Deployment Link**](https://merchandise-portal-theta.vercel.app/)

This project is a full-stack application for managing and selling merchandise, built with Next.js, Prisma, and PostgreSQL.

```
capstone_project/
|-- docs/
|   |-- Capstone.pdf
|   |-- Design.md
|   |-- ERD.md
|   |-- ERD.png
|   |-- RequirementAnalysis.md
|   |-- Report.md
|   `-- Wireframes/
|       |-- Checkout.md
|       |-- Catalog.md
|       |-- Landing.md
|       |-- ProductDetail.md
|       `-- README.md
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- app/
|   |-- components/
|   |-- lib/
|   `-- styles/
|-- public/
|-- .env.example
|-- package.json
|-- README.md
`-- LICENSE
```

## Features

*   **User Management:** User registration, login, and role-based access control (user, department head, admin).
*   **Product Catalog:** Manage products, including details like name, description, price, images, and stock.
*   **Ordering System:** Users can place individual or group orders. The system tracks order status from draft to delivery.
*   **Payments:** Hooks for integrating an external payment gateway (provider selection pending).
*   **Reviews and Ratings:** Users can leave reviews and ratings for products.
*   **Departmental Orders:** Support for orders associated with specific departments.
*   **Reminders:** Automated reminders for order deadlines and pickups.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v20 or later)
*   [npm](https://www.npmjs.com/)
*   [PostgreSQL](https://www.postgresql.org/)

### Environment Variables

The application expects the following configuration values. Create `.env` based on `.env.example` or supply them through your hosting provider:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Random string used by NextAuth for session encryption.
- `NEXTAUTH_URL`: Public URL for the app (e.g., `http://localhost:3000` in development).
- `PAYMENT_PROVIDER_API_KEY` / `PAYMENT_PROVIDER_API_SECRET`: Credentials for the payment gateway you configure.
- `BLOB_READ_WRITE_TOKEN`: Token for product image uploads (e.g., Vercel Blob).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd capstone_project
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add the following, replacing the placeholder with your PostgreSQL connection string:

    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    ```

4.  **Run database migrations:**

    ```bash
    npx prisma migrate dev
    ```

5.  **Seed the database:**

    ```bash
    npx prisma db seed
    ```

6.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open http://localhost:3000 with your browser to see the result.
