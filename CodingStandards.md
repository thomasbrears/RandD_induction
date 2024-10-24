# Coding Standards
## New Starter Induction, BCIS R&D Project

**Version 1.0.0** - October 2024

Created by Thomas Brears, Project Manager 


### **1. General Guidelines**
- Use ESLint to enforce code style and standards. Follow the Airbnb JavaScript Style Guide with project-specific adjustments (e.g., semicolon preference, JSX rules).
- Organize code into modules and follow the Single Responsibility Principle to ensure each function or class has one clear responsibility.
- Write clean, maintainable, and self-explanatory code. Use meaningful and descriptive variable, function, and component names.
- Document your code appropriately using comments where necessary, focusing on the why rather than the what.
- Maintain concise and descriptive commit messages following a conventional format (e.g., "fix: resolved issue with form validation").
 
**2. Project Structure**
Maintain a consistent and scalable folder structure to separate concerns between frontend and backend:
```
/frontend
  /src
    /components      # React components
    /public          # Public files
        /images      # static hard coded image files
    /pages           # React Router page components
    /hooks           # Custom React hooks
    /contexts        # React context providers
    /utils           # Utility functions
    /styles          # SCSS or CSS modules for styling
  package.json

/backend
  /src
    /controllers     # Business logic
    /routes          # Express routes
    /middlewares     # Middleware functions
    /services        # Service layer for external APIs, DB access
    /models          # Mongoose models
    /config          # Configuration files (e.g., database, environment)
  package.json
```

### **Frontend:**

- Use React Context for global state management to avoid prop drilling.


### **Backend:**
- Follow the MVC structure for maintaining separation of concerns (Models, Views, Controllers).
- Group related routes and controllers logically into feature-specific files (e.g., userRoutes.js, authController.js).


### **3. Naming Conventions**
- Variables, Functions & Components: Use camelCase and avoid special characters
- Files and Directories: Use kebab-case for filenames and directory names.
- Constants: Use UPPER_SNAKE_CASE for constants.


### **4. React Best Practices**
- Prefer functional components over class components.
- Use React hooks (useState, useEffect, useContext, custom hooks) where applicable.
- Implement error boundaries to catch runtime errors in components.
- Ensure components are reusable, modular, and follow the Single Responsibility Principle.
- Always return JSX with self-closing tags when there are no children.

### **5. Node.js/Express Best Practices**
- Use modular design principles: Separate your logic into routes, controllers, and services.
- Use Express middleware for validation, authentication, and logging.
- Implement centralized error handling using middleware to ensure all routes have consistent error responses.
- Use environment variables for sensitive data (API keys, database credentials), and manage them with .env files (using dotenv).
- Utilize structured logging with winston or morgan for logging API requests and errors.

### **6. API Design**
- Follow RESTful principles for designing APIs.
- Use consistent naming conventions for API routes (e.g., /users, /induction).
- Versioning: Version the API (e.g., /api/v1/).

### **7. Error Handling**
- Ensure consistent error response formats.
- Return appropriate HTTP status codes:
```
200 OK: Successful requests.
400 Bad Request: Validation or client errors.
401 Unauthorized: Authentication errors.
404 Not Found: Nonexistent routes or resources.
500 Internal Server Error: General server errors.
```

### **8. Testing**
- Use Jest for both frontend and backend unit testing.
Write unit tests for:
- React components: Ensure components render correctly and behave as expected.
- API endpoints: Test all routes with valid and invalid inputs.
- Use Supertest for testing Express routes.
- Maintain high test coverage (aim for 100% on critical components).

### **9. Code Reviews and Pull Requests**
- All code must undergo code reviews before being merged into the main branch.
- Use Pull Requests (PRs) for every feature or bug fix. PRs should:
- - Provide a detailed description of changes.
- - Address feedback promptly and clearly explain any unimplemented suggestions.

### **10. Security**
- Sanitize all user inputs to prevent SQL injection, XSS, and other vulnerabilities.
- Use HTTPS for all API calls and communication.
- Implement helmet middleware for setting secure HTTP headers.

### **11. Continuous Integration and Deployment (CI/CD)**
- Use GitHub Actions or similar tools for continuous integration to run tests and linters on every push.
- Ensure all tests pass before merging into the main branch.

### **Code Formatting**
- Use tab spaces for indentation 
- Semicolons at the end of statements.
- Use Prettier for automatic formatting.
