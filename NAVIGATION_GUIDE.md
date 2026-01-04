# 🧭 Navigation Guide - Pages & Links

This guide shows all the pages created and how to access them based on user roles.

## 📄 Pages Created

### 1. **My Roles Page** (`/my-roles`)
**File:** `frontend/src/pages/MyRoles.jsx`

**Purpose:** Centralized view of all roles assigned to a user across all hackathons

**Features:**
- Shows Participant, Organizer, Coordinator, and Judge roles
- Quick navigation to all hackathons where user has roles
- Statistics cards for each role
- Links to dashboards and management pages

**Access:**
- **Navigation:** Profile Menu → My Roles
- **Icon:** Green Shield icon
- **For:** All authenticated users

---

### 2. **Organizer Dashboard** (`/hackathons/:id/manage`)
**File:** `frontend/src/pages/OrganizerDashboard.jsx`

**Purpose:** Main control center for hackathon organizers

**Features:**
- Real-time statistics (teams, participants, check-ins, revenue)
- Current round tracking
- Round progress overview
- Team status breakdown
- Quick action buttons

**Quick Actions:**
- Approve Teams
- View Participants
- Manage Coordinators
- Manage Rounds
- Hackathon Settings

**Access:**
- **From Hackathon Page:** "Dashboard" button (white button with Settings icon)
- **From My Roles:** Under "My Hackathons (Organizer)" section
- **For:** Hackathon organizers only

---

### 3. **Manage Participants** (`/hackathons/:id/participants`)
**File:** `frontend/src/pages/ManageParticipants.jsx`

**Purpose:** View and manage all participants in a hackathon

**Features:**
- Search participants by name, email, username, or team
- Filter by team status (approved/pending/rejected)
- Filter by check-in status
- Export to CSV
- View participant details
- Email participants directly
- View team details

**Access:**
- **From Organizer Dashboard:** "View Participants" quick action
- **Direct URL:** `/hackathons/:id/participants`
- **For:** Organizers and coordinators

---

### 4. **Team Progress Page** (`/teams/:id/progress`)
**File:** `frontend/src/pages/TeamProgress.jsx`

**Purpose:** Show teams their progress through hackathon rounds

**Features:**
- Current round information
- Next round details
- Submission requirements and deadlines
- Progress timeline with all rounds
- Round scores and feedback
- File upload requirements
- Links and submission status

**What Teams See:**
- Current round status (pending/ongoing/completed)
- What needs to be done now
- Submission deadlines
- Required files and links
- Scores from judges (when available)
- Elimination status

**Access:**
- **From Hackathon Page:** "View Progress" button (green button) in team status banner
  - Only shows if team is **approved**
- **From Team Details:** Click "View Progress" or navigate directly
- **For:** Team members whose team has been approved

---

## 🔗 Navigation Links Added

### **In Hackathon Detail Page** (`/hackathons/:id`)

#### For Organizers:
```jsx
// Header buttons (top right)
<Button icon={Settings} onClick={() => navigate(`/hackathons/${id}/manage`)}>
  Dashboard
</Button>
<Button icon={Edit} onClick={() => navigate(`/hackathons/${id}/edit`)}>
  Edit
</Button>
```

**Shows:**
- ✅ **Dashboard** button (white, with Settings icon) → Goes to Organizer Dashboard
- ✅ **Edit** button (outline) → Goes to Edit Hackathon page

---

#### For Coordinators:
```jsx
// Header button (top right)
<Button icon={Shield} onClick={() => navigate(`/coordinator/${id}`)}>
  Coordinator Dashboard
</Button>
```

**Shows:**
- ✅ **Coordinator Dashboard** button (white, with Shield icon)

---

#### For Participants with Registered Team:
```jsx
// Team status banner buttons
{userTeam && (
  <div className="flex gap-2">
    <Button icon={Users} onClick={() => navigate(`/teams/${userTeam._id}`)}>
      Team Details
    </Button>
    {userTeam.registrationStatus === 'approved' && (
      <Button icon={TrendingUp} onClick={() => navigate(`/teams/${userTeam._id}/progress`)}>
        View Progress
      </Button>
    )}
  </div>
)}
```

**Shows:**
- ✅ **Team Details** button → Goes to team page
- ✅ **View Progress** button (green, only if approved) → Goes to Team Progress page

---

### **In Navbar Profile Menu**

Added "My Roles" link in the profile dropdown:

```jsx
<Link to="/my-roles">
  <Shield icon /> My Roles
</Link>
```

**Access:** Click profile avatar → My Roles (green shield icon)

---

## 📊 Complete Page Flow

### **For Organizers:**
1. **Dashboard** → Click profile → **My Roles**
2. See all hackathons under "My Hackathons (Organizer)"
3. Click **"Manage"** → Opens **Organizer Dashboard**
4. From Organizer Dashboard:
   - Click **"Approve Teams"** → Team Approvals page
   - Click **"View Participants"** → **Manage Participants** page
   - Click **"Manage Coordinators"** → Coordinators Management
   - Click **"Manage Rounds"** → Rounds Management
   - Click **"Hackathon Settings"** → Edit Hackathon

**OR from any hackathon:**
1. Go to **Hackathon Details** page
2. Click **"Dashboard"** button (white button, top right)
3. Opens **Organizer Dashboard** with all quick actions

---

### **For Coordinators:**
1. **Dashboard** → Click profile → **My Roles**
2. See all assigned hackathons under "Coordinator Roles"
3. Click **"Open Dashboard"** → Opens Coordinator Dashboard
4. Can also click **"View Invitations"** to see pending invitations

**OR from any hackathon they coordinate:**
1. Go to **Hackathon Details** page
2. Click **"Coordinator Dashboard"** button (white button, top right)

---

### **For Participants:**
1. Browse hackathons → Register for a hackathon
2. After registration, see green banner: "You're registered as part of [Team Name]"
3. Click **"Team Details"** to manage team
4. **After organizer approves team:**
   - Green **"View Progress"** button appears
   - Click it → Opens **Team Progress** page
   - See current round, next steps, submission requirements
   - Track scores and progress through all rounds

---

## 🎯 Quick Access Routes

### All Users (Authenticated)
| Page | Route | Access |
|------|-------|--------|
| My Roles | `/my-roles` | Profile Menu → My Roles |
| Dashboard | `/dashboard` | Top nav or Profile Menu |

### Organizers
| Page | Route | Access |
|------|-------|--------|
| Organizer Dashboard | `/hackathons/:id/manage` | Hackathon page → Dashboard button |
| Manage Participants | `/hackathons/:id/participants` | Organizer Dashboard → View Participants |
| Edit Hackathon | `/hackathons/:id/edit` | Hackathon page → Edit button |
| Team Approvals | `/hackathons/:id/approvals` | Organizer Dashboard → Approve Teams |
| Coordinators Management | `/hackathons/:id/coordinators-management` | Organizer Dashboard → Manage Coordinators |
| Rounds Management | `/hackathons/:id/rounds` | Organizer Dashboard → Manage Rounds |

### Coordinators
| Page | Route | Access |
|------|-------|--------|
| Coordinator Dashboard | `/coordinator/:id` | Hackathon page → Coordinator Dashboard button |
| My Coordinations | Various | My Roles → Coordinator Roles → Open Dashboard |
| Invitations | `/invitations` | My Roles → View Invitations |

### Participants (Teams)
| Page | Route | Access |
|------|-------|--------|
| Team Details | `/teams/:id` | Hackathon page → Team Details button |
| Team Progress | `/teams/:id/progress` | Hackathon page → View Progress button (if approved) |
| My Teams | `/my-teams` | Dashboard or direct URL |

---

## 🔐 Role-Based Visibility

### What Each Role Sees:

#### **Organizer**
- ✅ Dashboard button (Settings icon)
- ✅ Edit button
- ✅ Full organizer dashboard with all stats
- ✅ Quick action buttons (Approve, Participants, Coordinators, Rounds, Settings)
- ✅ My Roles page shows all organized hackathons

#### **Coordinator**
- ✅ Coordinator Dashboard button (Shield icon)
- ✅ Limited management capabilities based on permissions
- ✅ My Roles page shows all coordinated hackathons
- ✅ Can view invitations

#### **Participant** (Student)
- ✅ Register Team button (if registration open)
- ✅ Team Details button (if registered)
- ✅ View Progress button (if team approved) ← **KEY FEATURE**
- ✅ My Roles page shows participant role

---

## 💡 Key Features Summary

### **Team Progress Page** (The most important addition)
**Solves:** "show user the next round and what need to do now"

**Shows:**
1. **Current Round Card** (highlighted in green)
   - Round name and description
   - Start and end dates
   - Submission deadline
   - Required files (configured by organizer)
   - Required links (project, demo, video, GitHub, presentation)
   - Custom fields (if any)
   - Submit button

2. **Next Round Preview**
   - What's coming next
   - When it starts
   - What to prepare

3. **Progress Timeline**
   - All rounds listed chronologically
   - Status indicators (pending/ongoing/completed/cancelled)
   - Submission status
   - Scores received
   - Elimination rounds marked

4. **Dynamic File Validation**
   - Organizer configures in Hackathon model:
     - `allowedFileTypes`
     - `maxFileSize`
     - `maxFiles`
   - Users see exactly what they can upload
   - Form validates based on organizer settings

---

## 🎨 Visual Indicators

### Button Colors & Icons
- **White buttons** = Primary actions for that role (Dashboard, Coordinator Dashboard)
- **Green buttons** = Progress/Success actions (View Progress, approved status)
- **Outline buttons** = Secondary actions (Edit, Team Details)
- **Settings icon** = Organizer Dashboard
- **Shield icon** = Coordinator Dashboard, My Roles
- **TrendingUp icon** = View Progress

### Status Banners
- **Green banner** = Team registered successfully
- Shows team name, member count, status
- Only appears when user is part of a team

---

## ✅ Implementation Complete

All navigation links have been added to:
- ✅ HackathonDetail.jsx (header buttons, team status banner)
- ✅ Navbar.jsx (My Roles in profile menu)
- ✅ MyRoles.jsx (links to all dashboards and pages)
- ✅ OrganizerDashboard.jsx (quick action buttons)

All pages are fully functional and connected!
