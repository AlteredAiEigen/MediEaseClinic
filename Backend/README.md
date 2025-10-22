# MediEaseClinic Backend API

A comprehensive backend API for the MediEaseClinic healthcare management system built with Express.js and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Patient Management**: Complete CRUD operations for patient records
- **Appointment Scheduling**: Time slot management with conflict detection
- **Clinical Notes**: AI-generated clinical notes from consultations
- **Audio Recording**: Secure recording storage and transcription
- **User Management**: Admin, Doctor, and Receptionist role management
- **Statistics & Analytics**: Comprehensive reporting and analytics
- **Data Validation**: Input validation and error handling
- **Security**: Rate limiting, CORS, and data encryption

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MediEaseClinic/Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp config.env.example config.env
   ```
   
   Update the `config.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URL=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=7d
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/search` - Search patients
- `GET /api/patients/stats` - Get patient statistics
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/stats` - Get appointment statistics
- `GET /api/appointments/availability/:doctorId` - Get doctor availability
- `GET /api/appointments/date-range` - Get appointments by date range
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/stats` - Get doctor statistics
- `GET /api/doctors/:id` - Get single doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Clinical Notes
- `GET /api/clinical-notes` - Get all clinical notes
- `GET /api/clinical-notes/actionable` - Get actionable notes
- `POST /api/clinical-notes/generate` - Generate notes from consultation
- `GET /api/clinical-notes/:id` - Get single clinical note
- `POST /api/clinical-notes` - Create new clinical note
- `PUT /api/clinical-notes/:id` - Update clinical note
- `PUT /api/clinical-notes/:id/complete` - Mark note as complete
- `DELETE /api/clinical-notes/:id` - Delete clinical note

### Recordings
- `GET /api/recordings` - Get all recordings
- `GET /api/recordings/patient/:patientId` - Get recordings by patient
- `GET /api/recordings/doctor/:doctorId` - Get recordings by doctor
- `GET /api/recordings/:id` - Get single recording
- `POST /api/recordings` - Create new recording
- `PUT /api/recordings/:id` - Update recording
- `POST /api/recordings/:id/process` - Process recording
- `DELETE /api/recordings/:id` - Delete recording

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard statistics
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Doctor**: Access to patients, appointments, clinical notes, and recordings
- **Receptionist**: Access to patients and appointments for scheduling

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Applied to all `/api/` routes

## Data Validation

All input data is validated using express-validator:
- Required fields validation
- Format validation (email, phone, etc.)
- Length constraints
- Type validation

## Database Models

### User
- Authentication and user management
- Role-based access control
- Profile information

### Patient
- Complete patient records
- Medical history and vitals
- Contact information

### Appointment
- Scheduling and time management
- Status tracking
- Conflict detection

### ClinicalNote
- AI-generated notes
- Categorization and priority
- Actionable items tracking

### Recording
- Audio file management
- Transcription processing
- Security and retention

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRE` - JWT expiration time
- `CORS_ORIGIN` - Allowed CORS origins

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
