# Broos Project FSM

A comprehensive project management application built with Next.js 15, TypeScript, and Firebase. The application provides role-based access control, real-time project tracking, team collaboration, and analytics capabilities.

## 🚀 Features

- **User Authentication & Authorization** - Secure login with Firebase Auth
- **Role-Based Access Control** - Employee, Manager, and Admin roles
- **Project Management** - Comprehensive project tracking and management
- **Task Management** - Work order and task assignment system
- **Warehouse Management** - Inventory and resource tracking
- **Vacation Management** - Leave request and approval system
- **WebGIS Integration** - Geographic information system
- **Real-time Collaboration** - Live updates and communication tools
- **Responsive Dashboard** - Mobile-first design with modern UI
- **Analytics & Reporting** - Data-driven insights and metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Firebase (Auth, Firestore)
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Deployment**: Vercel, Docker support

## 📚 Documentation

This project includes comprehensive documentation to help developers understand and work with the codebase:

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference, components, and usage examples
- **[Component Reference](COMPONENT_REFERENCE.md)** - Quick reference for all UI components
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Setup, workflow, and development best practices
- **[Translation System](TRANSLATION_SYSTEM.md)** - Multi-language support documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- npm 9.0 or later
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ofsm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Add your Firebase configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
ofsm/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   ├── pending-approval/ # User approval
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── Sidebar.tsx       # Navigation sidebar
├── lib/                   # Utilities and config
│   ├── firebase.js       # Firebase setup
│   └── utils.ts          # Utility functions
├── public/                # Static assets
├── components.json        # shadcn/ui config
├── next.config.ts         # Next.js config
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## 🔐 User Roles & Permissions

### Employee
- Basic dashboard access
- Task management
- Vacation requests
- Limited project access

### Manager
- All employee permissions
- Team management
- Project oversight
- Warehouse management
- Report generation

### Admin
- All manager permissions
- User approval system
- System configuration
- Full access to all modules

## 🎨 UI Components

The application uses shadcn/ui components built on Radix UI primitives:

- **Form Components**: Button, Input, Label, Select, Textarea
- **Layout Components**: Card, Dialog, Popover, Tabs
- **Data Components**: Table, Calendar, Badge
- **Navigation**: Sidebar, Breadcrumbs
- **Feedback**: Toast notifications, Tooltips

## 🔥 Firebase Integration

- **Authentication**: Email/password with role-based access
- **Firestore**: Real-time database for projects, tasks, and users
- **Security Rules**: Role-based data access control
- **Real-time Updates**: Live data synchronization

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive sidebar that collapses on mobile
- Touch-friendly interface elements
- Optimized for all screen sizes

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Component management
npx shadcn@latest add [component]  # Add new UI components
```

## 🌍 Internationalization

The application supports multiple languages with a built-in translation system. See [TRANSLATION_SYSTEM.md](TRANSLATION_SYSTEM.md) for details.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
docker build -t broos-fsm .
docker run -p 3000:3000 broos-fsm
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Created by**: Hady Safaei
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui components
- **Backend**: Firebase services

## 📞 Support

For support and questions:

1. Check the [documentation](API_DOCUMENTATION.md)
2. Review the [development guide](DEVELOPMENT_GUIDE.md)
3. Check existing [issues](../../issues)
4. Create a new [issue](../../issues/new)

## 🔗 Links

- [Live Demo](https://your-demo-url.com)
- [API Documentation](API_DOCUMENTATION.md)
- [Component Reference](COMPONENT_REFERENCE.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)
- [Translation System](TRANSLATION_SYSTEM.md)

---

**Built with ❤️ using Next.js, TypeScript, and Firebase**
