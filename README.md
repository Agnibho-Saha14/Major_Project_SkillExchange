# Skill Exchange

Skill Exchange is a full-stack web application that allows users to share, discover, and exchange skills. It provides an interactive platform where learners and teachers can connect, post skills, and collaborate. This project is built with the MERN stack (MongoDB, Express.js, React, Node.js) and utilizes modern tools like Vite for the frontend, TailwindCSS for styling, and Clerk for authentication.

## About The Project

The Skill Exchange platform is designed to create a community of learners and educators. Users can sign up, create a profile, and then either offer their skills to others or browse for skills they want to learn. The platform supports both paid and skill-exchange models, providing flexibility for users. A key feature is the user dashboard, where individuals can manage their posted skills and track the skills they have enrolled in.

### Built With

  * **Frontend:**
      * React 19
      * Vite
      * React Router 7
      * TailwindCSS v4
      * Radix UI & ShadCN
      * Lucide React (for icons)
  * **Backend:**
      * Node.js
      * Express.js
      * MongoDB with Mongoose
      * Stripe for payments
  * **Authentication:**
      * Clerk
  * **Emailing:**
       * EmailJS

## Architecture

This project follows a classic MERN stack architecture:

  * **MongoDB:** A NoSQL database used to store all the application data, including users, skills, and enrollments.
  * **Express.js:** A web application framework for Node.js that provides a robust set of features for building the backend API.
  * **React:** A JavaScript library for building the user interface. The frontend is a single-page application built with React and Vite.
  * **Node.js:** A JavaScript runtime environment that allows us to run the Express server.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

  * npm
    ```sh
    npm install npm@latest -g
    ```
  * Node.js
  * MongoDB Atlas account (or a local MongoDB instance)
  * Clerk account for authentication keys
  * Stripe account for payment processing
  * EmailJS account for email services

### Installation

1.  **Clone the repo**

    ```sh
    git clone https://github.com/Agnibho-Saha14/Major_Project_SkillExchange.git
    ```

2.  **Install NPM packages for the server**

    ```sh
    cd Major_Project_SkillExchange/server
    npm install
    ```

3.  **Install NPM packages for the client**

    ```sh
    cd ../client
    npm install
    ```

4.  **Set up environment variables**

    Create a `.env` file in the `server` directory and add the following:

    ```env
    MONGODB_URI=your_mongodb_connection_string
    PORT=5000
    STRIPE_SECRET_KEY=your_stripe_secret_key
    CLIENT_URL=http://localhost:5173
    ```

    Create a `.env` file in the `client` directory and add the following:

    ```env
    VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
    VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    VITE_API_URL=http://localhost:5000/api
    VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
    VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
    VITE_EMAILJS_ENROLL_TEMPLATE_ID=your_emailjs_template_id  //for enrollment specific email
    VITE_EMAILJS_USER_ID=your_emailjs_user_id
    ```

5.  **Start the development servers**

    In the `server` directory, run:

    ```sh
    npm start
    ```

    In the `client` directory, run:

    ```sh
    npm run dev
    ```

## Features

  * **User Authentication:** Secure sign-up and login functionality provided by Clerk.
  * **Publish Skills:** Users can post new skills they want to teach, providing details like category, level, duration, and cost.
  * **Browse Skills:** A comprehensive page where users can explore all the available skills, with filtering and pagination.
  * **Dashboard:** A personal dashboard for users to manage their posted and enrolled skills.
  * **Skill Details:** A detailed view for each skill, showing all relevant information and allowing users to enroll or contact the instructor.
  * **Payment Integration:** Secure payment processing with Stripe for enrolling in paid courses.
  * **Skill Exchange:** The option to propose a skill exchange instead of a monetary payment.

## API Endpoints

The backend server exposes the following RESTful API endpoints:

  * `GET /api/skills`: Fetches all published skills with filtering and pagination.
  * `GET /api/skills/:id`: Fetches a single skill by its ID.
  * `POST /api/skills`: Creates a new skill.
  * `PUT /api/skills/:id`: Updates an existing skill.
  * `DELETE /api/skills/:id`: Deletes a skill.
  * `GET /api/categories`: Fetches all unique skill categories.
  * `POST /api/payments/checkout`: Creates a Stripe checkout session for a skill enrollment.
  * `POST /api/enrollments/complete`: Marks an enrollment as complete after a successful payment.
  * `GET /api/enrollments/my-skills`: Fetches all skills a user is enrolled in.

## Project Structure

```
.
├── client
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── server
    ├── config
    ├── controllers
    ├── middleware
    ├── models
    ├── routes
    ├── app.js
    └── server.js
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Link: [https://github.com/Agnibho-Saha14/Major\_Project\_SkillExchange](https://www.google.com/search?q=https://github.com/Agnibho-Saha14/Major_Project_SkillExchange)
