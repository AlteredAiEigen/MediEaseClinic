# MediEaseClinic Design Documentation

## Patient Information Form

### Page 1: Patient Information Form (Top)
This page contains the main patient information form with the following sections:

#### Patient Details
- Name / Full Name
- Gender
- Age

#### Contact Info
- Blood group
- Email

#### Reports
- Vitals

#### Medical Information
- Chief Complaint / Issues
- Medical History
- Current Medication

#### Treatment Information
- Lifestyle & Habits
- Care Plans
- Doctor Notes

### Page 2: Patient Information Form (Additional Fields)
This page shows more detailed form fields and layout:

#### Personal
- User Name
- Medical Portal

#### MediEase Patient Portal
- Personal
- User Name 
- MediEase Patient Portal

### Page 3: My Appointments
This page shows the appointments interface:

#### My Appointments
- Filters: Upcoming / Past Appointments
- Search functionality
- List of appointments with:
  - Name
  - Gender
  - Age
  - Phone
  - Disease/Condition
  - Status (e.g., "Booked apt")

#### Appointment Details
- Name
- Gender
- Age
- Phone
- Condition (e.g., "cold")
- Status (e.g., "Booked apt")

### Page 4: Alternative Appointments View
This appears to be an alternative design for the appointments view with:

- Search functionality
- Status filters
- Appointment details showing:
  - Name
  - Gender
  - Age
  - Phone
  - Disease/condition
  - Date/time information

## Form Field Details

### Patient Details Section
- **Patient Name/Full Name**: Text input for patient's complete name
- **Gender**: Selection field (Male/Female/Other)
- **Age**: Numeric input for patient's age

### Contact Info Section
- **Blood Group**: Selection field (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Email**: Text input for patient's email address

### Reports Section
- **Vitals**:
  - Blood Pressure (e.g., "120/80 mmHg")
  - Heart Rate (e.g., "72 bpm")
  - Temperature
  - Oxygen Saturation

### Medical Information
- **Chief Complaint/Issues**: Multi-line text area for primary reason for visit
- **Medical History**: Multi-line text area for past medical conditions
- **Current Medication**: Multi-line text area for medications currently taken

### Treatment Information
- **Lifestyle & Habits**: Multi-line text area for information about diet, exercise, smoking, alcohol, etc.
- **Care Plans**: Multi-line text area for treatment plans and recommendations
- **Doctor Notes**: Multi-line text area for physician's observations and notes

### Appointments Section
- **Filters**:
  - Upcoming (default selected)
  - Past Appointments
- **Search**: Text input to search appointments
- **Appointment List**:
  - Patient name
  - Gender
  - Age
  - Phone number
  - Condition/disease
  - Appointment status

## UI Components

### Form Components
- Text inputs
- Selection fields
- Multi-line text areas
- Date/time pickers

### Navigation
- Back button
- Save button
- Cancel button

### Visual Elements
- Section headers
- Field labels
- Error messages
- Helper text

## Implementation Notes

1. The form should be scrollable to accommodate all fields
2. Each section should be visually distinct
3. Required fields should be marked
4. Form should support both creation and editing modes
5. Appointments section should support filtering and searching
6. The interface should follow the existing MediEaseClinic design system
