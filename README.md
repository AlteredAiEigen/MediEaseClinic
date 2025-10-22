# MediEaseClinic - Healthcare Management System

A comprehensive healthcare management system built with React Native (Frontend) and Express.js with MongoDB (Backend).

## 🏥 Project Overview

MediEaseClinic is a modern healthcare management system designed to streamline clinic operations, patient management, and medical record keeping. The system supports multiple user roles including administrators, doctors, and receptionists.

## 🚀 Features

### Core Features
- **Patient Management**: Complete patient registration, search, and medical history tracking
- **Appointment Scheduling**: Advanced scheduling system with conflict detection and time slot management
- **Clinical Notes**: AI-powered clinical note generation and management
- **Audio Recording**: Secure consultation recording with transcription capabilities
- **User Management**: Role-based access control for different user types
- **Real-time Dashboard**: Comprehensive dashboards for all user roles
- **Search & Analytics**: Advanced search functionality and reporting

### User Roles
- **Admin**: Full system access, user management, analytics, and system configuration
- **Doctor**: Patient management, consultation recording, clinical notes, and appointment management
- **Receptionist**: Patient registration, appointment scheduling, and check-in/out management

## 🛠 Tech Stack

### Frontend (React Native)
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation management
- **Context API** - State management
- **AsyncStorage** - Local data persistence
- **LinearGradient** - UI enhancements
- **React Native Calendar** - Calendar integration

### Backend (Express.js + MongoDB)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **multer** - File upload handling

## 📁 Project Structure

```
MediEaseClinic/
├── Frontend/                 # React Native mobile app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # App screens
│   │   ├── navigation/      # Navigation configuration
│   │   ├── context/         # State management
│   │   ├── services/        # API services
│   │   ├── models/          # TypeScript interfaces
│   │   └── themes/          # UI theming
│   ├── android/             # Android-specific code
│   ├── ios/                 # iOS-specific code
│   └── package.json
├── Backend/                 # Express.js API server
│   ├── controllers/         # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── scripts/             # Database scripts
│   └── server.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)

### Backend Setup

1. **Navigate to Backend directory**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config.env.example config.env
   ```
   
   Update `config.env` with your MongoDB connection string and other configuration.

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

### Frontend Setup

1. **Navigate to Frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Start the development server**
   ```bash
   # Start Metro bundler
   npm start
   
   # Run on Android
   npm run android
   
   # Run on iOS
   npm run ios
   ```

## 📱 Mobile App Features

### Authentication
- Role-based login system
- Secure JWT token authentication
- User profile management

### Patient Management
- Patient registration and profile creation
- Advanced search and filtering
- Medical history tracking
- Emergency contact management

### Appointment System
- Calendar-based scheduling
- Time slot management
- Conflict detection
- Status tracking (scheduled, completed, cancelled)

### Clinical Workflow
- Audio recording during consultations
- AI-powered transcription
- Clinical note generation
- Action item tracking

### Dashboard Features
- Real-time statistics
- Patient queue management
- Appointment overview
- Quick actions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Clinical Notes
- `GET /api/clinical-notes` - Get clinical notes
- `POST /api/clinical-notes` - Create clinical note
- `PUT /api/clinical-notes/:id` - Update clinical note

### Recordings
- `GET /api/recordings` - Get recordings
- `POST /api/recordings` - Upload recording
- `POST /api/recordings/:id/process` - Process recording

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and throttling
- CORS protection
- Security headers with Helmet
- File upload validation
- Request timeout handling

## 📊 Database Schema

### User Model
- Authentication and profile information
- Role-based access control
- Contact details

### Patient Model
- Personal information
- Medical history
- Emergency contacts
- Insurance information

### Appointment Model
- Scheduling information
- Status tracking
- Notes and comments

### ClinicalNote Model
- Consultation details
- AI-generated content
- Action items
- Priority levels

### Recording Model
- Audio file metadata
- Transcription data
- Processing status

## 🧪 Testing

### Backend Testing
```bash
cd Backend
npm test
```

### Frontend Testing
```bash
cd Frontend
npm test
```

## 📈 Performance

- **Caching**: Redis-based caching for improved performance
- **Compression**: Gzip compression for API responses
- **Pagination**: Efficient data pagination
- **Optimization**: Database query optimization
- **Monitoring**: Real-time performance monitoring

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to cloud platform (Heroku, AWS, etc.)
4. Set up monitoring and logging

### Frontend Deployment
1. Build for production
2. Deploy to app stores (Google Play, App Store)
3. Configure deep linking
4. Set up push notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added clinical notes and recording features
- **v1.2.0** - Enhanced security and performance
- **v2.0.0** - Complete backend API and frontend integration

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Integration with external medical systems
- [ ] Mobile app for patients
- [ ] Telemedicine features
- [ ] AI-powered diagnosis assistance
- [ ] Multi-language support
- [ ] Offline mode support

---

**MediEaseClinic** - Streamlining healthcare management for the modern world.
