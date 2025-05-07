# AUT Events Induction Portal

A full-stack web application for efficiently tracking and managing staff inductions for AUT Events.

Welcome to the Induction portal repository. This project has been developed as part of our coursework for COMP702/COMP703 as our final year, software development major Research and Development project at Auckland University of Technology (AUT) in Aotearoa, New Zealand. Development began in June 2024 and was completed in May 2025.

## Confidentiality Notice

**This project is private and proprietary to AUT Events. It cannot be reproduced or shared without explicit permission from AUT, AUT Events or the Developers**

## Problem Statement

AUT Events needed a more efficient way to track and manage inductions for their staff members. This system provides a streamlined solution to replace previous manual, paper processes.

## Tech Stack

### Frontend
- React.js

### Backend
- Node.js
- Express.js

### Authentication & Database
- Firebase Authentication
- Firestore Database

### Storage
- Google Cloud Storage (for images and file storage)

## Features

- **Authentication & Access Control**
  - User authentication with role-based access control
  - Self-service password and email address management
  - User account management

- **Induction Management**
  - Complete induction taking process
  - Document and certificate storage
  - Reporting and results tracking

- **Communication & Support**
  - Contact form with submission tracking
  - User feedback capabilities

- **Content Management**
  - Admin interface to modify key text content
  - Image upload and management
  - Dynamic content updates without code changes

## Installation

### Prerequisites
- Node.js (v16.x or later)
- npm or yarn
- Firebase account
- Google Cloud Platform account with Storage enabled

### Setup

1. Clone the repository:
   ```
   git clone [https://github.com/thomasbrears/RandD_induction.git](https://github.com/thomasbrears/RandD_induction.git)
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. Configure environment variables:
   - Create `.env` files in both frontend and backend
   - Add your Firebase and Google Cloud credentials

4. Run the development servers:
   ```
   # Start backend server
   cd backend
   npm run dev

   # Start frontend development server
   cd frontend
   npm start
   ```

## Project Structure

```
├── frontend/               # Frontend React application
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API services
│   │   └── utils/          # Utility functions
│   └── ...
├── backend/                # Backend Node.js/Express server application
│   ├── controllers/        # Request controllers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
|   ├── index.js            # Main server
│   └── ...
└── ...
```

## Contributors

This project was developed by:
- Thomas Brears
- Ellena
- Mio
- Ellison

## License

This project is proprietary and confidential.

Copyright © 2025, Thomas Brears and AUT Events. All rights reserved.
