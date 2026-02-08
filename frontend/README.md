# SubTrack Frontend

React application for SubTrack, built with Vite.

##  Requirements

- Node.js 18 or higher
- npm or yarn

##  Setup

1. **Install dependencies:**
   `ash
   npm install
   ` 

2. **Environment Configuration:**
   Create a .env file in the rontend root if needed.
   Vite exposes env variables prefixed with VITE_.
   `env
   VITE_API_URL=http://localhost:8000
   ` 

##  Running the Development Server

Start the React dev server:
`ash
npm run dev
` 
The application will be accessible at [http://localhost:5173](http://localhost:5173).

##  Build for Production

To create a production build:
`ash
npm run build
` 

The output will be in the dist/ directory.

##  Project Structure

- **src/pages/**: Admin Dashboard pages (Products, Subscriptions, Invoices, etc.).
- **src/portal/**: Customer Portal pages (Shop, Cart, Profile).
- **src/components/**: Reusable UI components.
- **src/context/**: React Context for global state (Auth, Cart).
