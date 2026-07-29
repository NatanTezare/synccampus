# SyncCampus - University Venue & Appointment Management System

SyncCampus is a full-featured web application designed to streamline campus operations, enabling students to book university venues, manage faculty appointments, and handle role-based authentication seamlessly.

---

## 🚀 Key Features

* **Role-Based Authentication:** Secure login and registration supporting **Students**, **Faculty Leadership**, and **Admins** with automated routing based on user roles.
* **Interactive Venue Booking:** Real-time availability checking, automated conflict detection for overlapping reservations, and live status tracking (Approved, Pending, Rejected).
* **Faculty Dashboard & Triage:** 
  * Interactive weekly availability template grid (*Open*, *Booked*, *Closed*).
  * Instant status management allowing lecturers to review, confirm, or reject student appointment requests with custom notes.
* **Modern Responsive UI:** Clean, accessible interface built with React, TypeScript, and Tailwind CSS, featuring custom themes and dynamic indicators.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS
* **Networking:** Axios for API requests
* **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`)
* **Backend Integration:** RESTful API services (`authService`, `venueService`, `appointmentService`)

---

## 📦 Installation & Setup Guide

Follow these steps to set up and run the project locally on your machine.

### Prerequisites

Make sure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* npm (comes with Node.js) or Yarn

### 1. Clone the Repository

```bash
git clone [https://github.com/NatanTezare/synccampus.git](https://github.com/NatanTezare/synccampus.git)
cd synccampus

2. Install Dependencies
Install the required project dependencies using npm:

Bash
npm install
3. Configure Environment Variables
Create a .env file in the root directory of the project and specify your backend API URL. You can use the template below:

Code snippet
VITE_API_BASE_URL=http://localhost:5000/api
(Adjust the port and URL based on your local or production backend configuration).

4. Run the Development Server
Start the local development server:

Bash
npm run dev
Open your browser and navigate to the local URL provided in your terminal (typically http://localhost:5173).

