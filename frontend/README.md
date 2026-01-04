# Hackathon Platform Frontend

A modern, feature-rich React frontend for the Hackathon Management Platform built with Vite, React Router, Tailwind CSS, and Framer Motion.

## 🚀 Features

### Core Features
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Multi-Role Support**: Different dashboards for organizers, coordinators, judges, and students
- **Real-time Updates**: Dynamic data fetching and state management with Zustand
- **Payment Integration**: Razorpay integration for hackathon registrations and subscriptions
- **Form Validation**: React Hook Form for robust form handling
- **Toast Notifications**: User-friendly feedback with react-hot-toast

### User Roles & Features

#### Student
- Browse and discover hackathons
- Register teams with team members
- Submit projects for rounds
- View leaderboards
- Track team progress

#### Coordinator
- Access "My Coordinations" dashboard
- View and manage assigned hackathons
- Check-in participants
- Assign table and team numbers
- View submissions (based on permissions)
- Cannot participate in coordinated hackathons

#### Judge
- Access assigned hackathons
- View team submissions
- Score teams with custom criteria
- Provide feedback and remarks
- View real-time leaderboards

#### Organizer
- Create and manage hackathons
- Configure rounds, schedules, and prizes
- Invite coordinators with custom permissions
- Invite judges
- Manage team registrations
- View comprehensive analytics

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (see backend README)

## 🚦 Getting Started

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd hackathon-frontend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

5. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
hackathon-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       └── Badge.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Hackathons.jsx
│   │   ├── HackathonDetail.jsx
│   │   ├── CreateHackathon.jsx
│   │   ├── MyCoordinations.jsx
│   │   ├── CoordinatorDashboard.jsx
│   │   ├── JudgeDashboard.jsx
│   │   ├── TeamDetail.jsx
│   │   ├── Profile.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   └── api.js
│   ├── store/
│   │   └── index.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Red shades for main actions
- **Secondary**: Blue shades for secondary actions
- **Accent**: Yellow/Gold for highlights
- **Dark**: Gray shades for text and backgrounds

### Components
All UI components are in `src/components/ui/`:
- `Button`: Versatile button with variants and loading states
- `Card`: Container component with optional title and actions
- `Input`: Form input with icons and validation support
- `Modal`: Accessible modal dialog
- `Badge`: Status and category badges

### Typography
- Display font: Inter (weights 300-900)
- Body font: Inter
- Monospace: JetBrains Mono

## 📱 Pages Overview

### Public Pages
- **Home**: Landing page with features and benefits
- **Hackathons**: Browse and search all hackathons
- **Login/Register**: Authentication pages

### Protected Pages
- **Dashboard**: Overview of user's hackathons and teams
- **My Coordinations**: List of hackathons user coordinates
- **Coordinator Dashboard**: Manage specific hackathon as coordinator
- **Judge Dashboard**: Score teams and view submissions
- **Team Detail**: View and manage team information
- **Profile**: User profile and settings

### Admin Pages
- **Create Hackathon**: Create new hackathons with full configuration
- **Hackathon Management**: Edit hackathon details, rounds, and settings

## 🔐 Authentication

The app uses JWT token-based authentication:
- Tokens stored in localStorage
- Automatic token injection in API requests
- Automatic redirect on token expiration
- Protected routes with authentication check

## 🌐 API Integration

All API calls are centralized in `src/services/api.js`:
- Automatic token management
- Request/response interceptors
- Error handling with toast notifications
- Organized by feature (auth, hackathons, teams, payments)

## 📊 State Management

Using Zustand for global state:
- `useAuthStore`: User authentication and profile
- `useHackathonStore`: Hackathon data and operations
- `useTeamStore`: Team data and operations
- `useUIStore`: UI state (theme, sidebar)

## 🎭 Animations

Framer Motion animations throughout:
- Page transitions
- Component enter/exit animations
- Hover effects
- Loading states

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🔧 Configuration

### Tailwind CSS
Customize theme in `tailwind.config.js`:
- Colors
- Fonts
- Animations
- Breakpoints

### Vite
Customize build in `vite.config.js`:
- Aliases
- Plugins
- Proxy settings
- Build options

## 🚀 Features to Implement

The following pages have stubs and need full implementation:

### HackathonDetail.jsx
- Display complete hackathon information
- Show rounds, schedule, prizes
- Registration button for students
- Manage button for organizers
- View leaderboard

### CreateHackathon.jsx
- Multi-step form for hackathon creation
- Configure team settings
- Add multiple rounds
- Set up payment options
- Schedule management
- Invite coordinators and judges

### MyCoordinations.jsx
- List all coordinations with status
- Show permissions for each
- Quick access to coordinator dashboard
- Accept/decline pending invitations

### CoordinatorDashboard.jsx
- Team list with filters
- Check-in functionality
- Assign table/team numbers
- View submissions
- Team communication

### JudgeDashboard.jsx
- List assigned hackathons
- View team submissions
- Score teams with criteria
- Add remarks and feedback
- Real-time leaderboard

### TeamDetail.jsx
- Team information and members
- Project submissions
- Scores and feedback
- Payment status
- Team settings

### Profile.jsx
- Edit user information
- Change password
- Subscription management
- Account settings

## 🎯 Best Practices

1. **Component Structure**: Keep components small and focused
2. **State Management**: Use Zustand for global state, local state for UI
3. **API Calls**: Always use try-catch and handle errors gracefully
4. **Forms**: Use React Hook Form for validation
5. **Styling**: Use Tailwind utility classes, avoid custom CSS
6. **Accessibility**: Use semantic HTML and ARIA labels
7. **Performance**: Lazy load routes and components when needed

## 🐛 Troubleshooting

### API Connection Issues
- Verify backend is running
- Check VITE_API_BASE_URL in .env
- Check CORS configuration in backend

### Build Errors
- Clear node_modules and reinstall
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check Node.js version

### Authentication Issues
- Clear localStorage
- Check token expiration
- Verify JWT_SECRET matches backend

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: support@hackplatform.com

---

Made with ❤️ for the hacker community
