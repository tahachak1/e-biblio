<!-- Github: https://github.com/tahachak1/e-biblio -->

  # Library Website Login Page

  This is a code bundle for Library Website Login Page. The original project is available at https://www.figma.com/design/4OP7XBouZVQZuvL31RPfB2/Library-Website-Login-Page.

  ## Running the code

  ### Frontend
  1. Install dependencies at the repo root with `npm install`.
  2. Start the dev server with `npm run dev` (Vite on http://localhost:5173).

  ### Backend API
  1. `cd backend && npm install`
  2. Copy `backend/.env.example` to `backend/.env` and set your credentials (Mongo URI, JWT secret, optional SMTP/Twilio keys).
  3. Launch the API with `npm run dev` (nodemon) or `npm start`.

  ### OTP Delivery
  - If SMTP/Twilio credentials are absent, the API now simulates OTP delivery to avoid crashes, but production must use real values.
  - OTP routes are rate-limited (10 requests / 15 minutes per IP) for security; adjust `backend/routes/otp*.js` if needed.
  
