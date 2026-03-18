# Skill Exchange

Skill Exchange is a full-stack web application that allows users to share, discover, and exchange skills. It provides an interactive platform where learners and teachers can connect, post skills, and collaborate. This project is built with the MERN stack (MongoDB, Express.js, React, Node.js) and utilizes modern tools like Vite for the frontend, TailwindCSS for styling, Clerk for authentication, and an integrated Python ML Pipeline for personalized recommendations.

## About The Project

The Skill Exchange platform is designed to create a community of learners and educators. Users can sign up, create a profile, select their interests, and then either offer their skills to others or browse for skills they want to learn. The platform supports both paid and skill-exchange models, providing flexibility for users. A key feature is the user dashboard, where individuals can manage their posted skills, track enrolled skills, and update their AI learning preferences.

### Built With

  * **Frontend:**
      * React 19
      * Vite
      * React Router 7
      * TailwindCSS v4
      * Radix UI & ShadCN
      * Lucide React (for icons)
  * **Backend (Node.js API):**
      * Node.js
      * Express.js
      * MongoDB with Mongoose
      * Stripe for payments
  * **Machine Learning Engine:**
      * Python 3
      * Flask
      * Sentence-Transformers (Semantic Search)
      * Rank-BM25 (Lexical Search)
  * **Authentication:**
      * Clerk
  * **Emailing:**
       * EmailJS

## Architecture

This project follows an extended MERN stack architecture with a dedicated Microservice:

  * **MongoDB:** A NoSQL database used to store all the application data, including users, skills, and enrollments.
  * **Express.js:** A web application framework for Node.js that provides a robust set of features for building the main backend API.
  * **React:** A JavaScript library for building the user interface. The frontend is a single-page application built with React and Vite.
  * **Node.js:** A JavaScript runtime environment that allows us to run the Express server.
  * **Python/Flask (Microservice):** A lightweight server that loads a HuggingFace ML model into memory to calculate and serve real-time, hybrid (semantic + lexical) skill recommendations based on user preferences.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

  * npm
    ```sh
    npm install npm@latest -g
    ```
  * Node.js
  * Python 3.9+ (For the ML Recommendation Engine)
  * MongoDB Atlas account (or a local MongoDB instance)
  * Clerk account for authentication keys
  * Stripe account for payment processing
  * EmailJS account for email services

### Installation

1.  **Clone the repo**

    ```sh
    git clone [https://github.com/Agnibho-Saha14/Major_Project_SkillExchange.git](https://github.com/Agnibho-Saha14/Major_Project_SkillExchange.git)
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

5.  **Start the application**
    
    You will need to run three separate services for the full experience.

    **Terminal 1: Node.js Server**
    ```sh
    cd server
    npm start
    ```

    **Terminal 2: React Client**
    ```sh
    cd client
    npm run dev
    ```

    **Terminal 3: Python ML Pipeline**
    (From the root `Major_Project_SkillExchange` directory)
    
    *On Windows:*
    ```cmd
    .\run_ml.bat
    ```
    *On Mac/Linux:*
    ```bash
    chmod +x run_ml.sh
    ./run_ml.sh
    ```
    *(Note: These scripts will automatically create a Python virtual environment and install the required ML packages on first run).*

## Features

  * **User Authentication & Onboarding:** Secure sign-up provided by Clerk, paired with a custom onboarding flow to capture learning interests.
  * **AI-Curated Homepage:** A personalized "Recommended for You" section powered by a hybrid Sentence-Transformer/BM25 machine learning model.
  * **Publish Skills:** Users can post new skills they want to teach, providing details like category, level, duration, and cost.
  * **Browse Skills:** A comprehensive page where users can explore all the available skills, with filtering and pagination.
  * **Dashboard:** A personal dashboard for users to manage their posted skills, enrolled skills, and AI learning preferences.
  * **Skill Details:** A detailed view for each skill, showing all relevant information and allowing users to enroll or contact the instructor.
  * **Payment Integration:** Secure payment processing with Stripe for enrolling in paid courses.
  * **Skill Exchange:** The option to propose a skill exchange instead of a monetary payment.

## 🔌 API Endpoints & Architecture

The application operates on a local microservices architecture. By default, the services run on the following ports:

* **Frontend Client (React/Vite):** `http://localhost:5173`
* **Main Backend (Node.js/Express):** `http://localhost:5000`
* **ML Microservice (Python/Flask):** `http://localhost:5001`

---

### Node.js Backend (`http://localhost:5000`)

**Skills & Categories**
* `GET /api/skills` - Fetches all published skills (supports `?page=` and `?limit=` pagination).
* `GET /api/skills/:id` - Fetches a single skill by its ID.
* `POST /api/skills` - Creates a new skill listing.
* `PUT /api/skills/:id` - Updates an existing skill.
* `DELETE /api/skills/:id` - Deletes a skill.
* `GET /api/categories` - Fetches all unique skill categories.

**Users & Machine Learning Pipeline**
* `POST /api/users/onboard` - Saves onboarding preferences and triggers the real-time ML recommendation pipeline.
* `GET /api/users/all-ids` - Fetches a complete list of all registered Clerk User IDs (used by the ML batch script).
* `GET /api/users/:userId/skills` - Fetches a specific user's name and selected skills array.
* `POST /api/users/:userId/recommendations` - Saves AI-curated course recommendations back into the user's Clerk `publicMetadata`.

**Payments & Enrollments**
* `POST /api/payments/checkout` - Creates a Stripe checkout session for skill enrollment.
* `POST /api/enrollments/complete` - Marks an enrollment as complete after a successful payment.
* `GET /api/enrollments/my-skills` - Fetches all skills a user is actively enrolled in.

**Skill Exchanges**
* `POST /api/exchanges` - Proposes a new skill-for-skill exchange.
* `GET /api/exchanges/user` - Fetches all inbound and outbound exchange proposals for the active user.
* `PATCH /api/exchanges/:id/status` - Updates the status of an exchange proposal (Accept/Reject).

---

### Python ML Microservice (`http://localhost:5001`)

**Recommendations**
* `POST /generate-recommendations` - The core AI engine. 
  * **Payload:** Expects `{ "userId": "...", "skills": ["..."] }`. 
  * **Action:** Fetches the full database catalog from the Node.js server, runs a Hybrid Semantic (Sentence-Transformers) + Lexical (BM25) ranking algorithm, and returns the exact top 6 matches.

## Project Structure

```
├── client
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── app.js
│   └── server.js
├── .venv (Generated by run_ml scripts)
├── ml_server.py
├── requirements.txt
├── run_ml.bat
└── run_ml.sh
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
