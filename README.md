# Vue 3 + Django CATI System

A comprehensive Computer-Assisted Telephone Interviewing (CATI) system built with Vue 3 frontend and Django REST API backend.

## Features

- **Multi-role User System**: Admin, Interviewer, and Contact roles
- **4-Stage Interview Workflow** with progress tracking
- **Real-time Auto-save** functionality
- **Contact Management** with search and filtering
- **Role-based Access Control**
- **Responsive Design** optimized for desktop workflows
- **Professional UI** with Tailwind CSS

## User Roles

### 1. Contact
- Cannot login to the system
- Used for reference and data management only
- Represents interview subjects

### 2. Interviewer
- Can login to the system
- Can conduct interviews
- Can manage their assigned contacts
- Can view their interview statistics

### 3. Admin
- Can login to the system
- Full system access
- Can manage all users and interviews
- Can view system-wide statistics

## Test Login Credentials

### Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator (full system access)

### Interviewer 1
- **Username**: `interviewer1`
- **Password**: `interview123`
- **Role**: Interviewer

### Interviewer 2
- **Username**: `interviewer2`
- **Password**: `interview123`
- **Role**: Interviewer

**Note**: Only Administrator and Interviewer roles can login to the system. Contact users are for data reference only.

## Frontend Setup (Vue 3)

The frontend is already configured and running. It includes:

- Vue 3 with TypeScript
- Pinia for state management
- Vue Router with protected routes
- Tailwind CSS for styling
- Axios for API communication

## Backend Setup (Django)

Due to WebContainer limitations, the Django backend cannot run in this environment. However, the complete backend structure is provided.

To run the Django backend in a proper environment:

1. **Install Dependencies**:
   ```bash
   cd django_backend
   pip install -r requirements.txt
   ```

2. **Run Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Create Test Users**:
   ```bash
   python manage.py shell < create_test_users.py
   ```

4. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```

5. **Access Admin Panel**:
   - URL: `http://localhost:8000/admin/`
   - Login with admin credentials above

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user info

### Contacts
- `GET /api/contacts/` - List contacts
- `POST /api/contacts/` - Create contact
- `GET /api/contacts/{id}/` - Get contact details
- `PATCH /api/contacts/{id}/` - Update contact
- `DELETE /api/contacts/{id}/` - Delete contact

### Interviews
- `GET /api/interviews/` - List interviews
- `POST /api/interviews/` - Start new interview
- `GET /api/interviews/{id}/` - Get interview details
- `PATCH /api/interviews/{id}/` - Update interview

### Questions & Responses
- `GET /api/interviews/questions/` - List questions
- `POST /api/interviews/response/` - Submit response

## Security Features

- Token-based authentication
- Role-based access control
- CORS configuration for frontend integration
- Input validation and sanitization
- Protected routes on both frontend and backend

## Interview Workflow

1. **Contact Management**: Add and manage interview contacts
2. **Interview Initiation**: Start interviews for selected contacts
3. **4-Stage Process**: Navigate through structured interview stages
4. **Progress Tracking**: Real-time progress indicators
5. **Auto-save**: Automatic response saving
6. **Pause/Resume**: Ability to pause and resume interviews
7. **Completion**: Mark interviews as completed

## Development Notes

- Frontend uses TypeScript for type safety
- Pinia stores manage application state
- Responsive design works on desktop and mobile
- Error handling and validation throughout
- Professional UI with smooth transitions