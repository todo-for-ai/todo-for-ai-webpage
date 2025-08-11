# Todo for AI Frontend

[中文版本](README_zh.md) | **English**

A modern React-based frontend application for the Todo for AI task management system, built with TypeScript, Vite, and Ant Design.

> 🚀 **Try it now**: Visit [https://todo4ai.org/](https://todo4ai.org/) to experience our product!

## ✨ Features

- 🎨 **Modern UI**: Built with Ant Design components and responsive design
- 🌐 **Internationalization**: Support for English and Chinese languages
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔐 **Authentication**: Google and GitHub OAuth integration
- 📊 **Project Management**: Complete project lifecycle management
- ✅ **Task Management**: Advanced task tracking with Kanban board
- 📝 **Rich Text Editor**: Milkdown-powered markdown editor with multiple themes
- 🤖 **AI Integration**: MCP (Model Context Protocol) support for AI assistants
- 📈 **Analytics**: Google Analytics 4 integration for user behavior tracking
- 🎯 **Context Rules**: Custom prompts and context management
- 🔍 **Advanced Search**: Powerful filtering and sorting capabilities
- 🌙 **Theme Support**: Multiple themes including typewriter mode
- ⚡ **Performance**: Optimized with Vite for fast development and builds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Todo for AI API server running

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/todo-for-ai/todo-for-ai-webpage.git
cd todo-for-ai-webpage
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:50111`

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:50110/todo-for-ai/api/v1
VITE_MCP_SERVER_URL=http://localhost:50110

# Application Configuration
VITE_APP_TITLE="Todo for AI"
VITE_APP_VERSION="1.0.0"

# Google Analytics Configuration
VITE_GA_ENABLED=true
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Development Configuration
VITE_DEBUG_MODE=true
VITE_PERFORMANCE_MONITORING=false

# Feature Flags
VITE_ENABLE_EXPERIMENTAL_FEATURES=false
VITE_ENABLE_ERROR_BOUNDARY=true

# Third-party Services
VITE_SENTRY_DSN=
VITE_HOTJAR_ID=
VITE_MIXPANEL_TOKEN=
```

### Google Analytics Setup

1. Create a Google Analytics 4 property
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Set `VITE_GA_ENABLED=true` and `VITE_GA_MEASUREMENT_ID` in your `.env` file

## 🏗️ Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Ant Design 5
- **State Management**: Zustand
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Internationalization**: i18next
- **Rich Text Editor**: Milkdown
- **Drag & Drop**: @dnd-kit
- **Analytics**: Google Analytics 4
- **Code Quality**: ESLint + Prettier

## 📁 Project Structure

```
todo-for-ai-webpage/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout/        # Application layout components
│   │   ├── AuthGuard/     # Authentication guard
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── Dashboard/     # Dashboard page
│   │   ├── Projects/      # Projects management
│   │   ├── Tasks/         # Task management
│   │   ├── Kanban/        # Kanban board
│   │   └── ...
│   ├── stores/            # Zustand stores
│   │   ├── useAuthStore.ts
│   │   ├── useProjectStore.ts
│   │   └── ...
│   ├── services/          # API services
│   │   ├── api.ts         # API client
│   │   ├── auth.ts        # Authentication service
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── ThemeContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ...
│   ├── utils/             # Utility functions
│   ├── themes/            # Theme configurations
│   ├── i18n/              # Internationalization
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Documentation
├── .env.example           # Environment variables template
├── vite.config.ts         # Vite configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎨 Key Features

### Dashboard
- Real-time project and task statistics
- Recent activity timeline
- Quick action buttons
- Performance metrics

### Project Management
- Create, edit, and delete projects
- Project status tracking
- Team collaboration features
- Project templates

### Task Management
- Advanced task creation with rich metadata
- Task status workflow (Todo → In Progress → Review → Done)
- Priority levels and due dates
- Task assignments and comments
- Bulk operations

### Kanban Board
- Drag-and-drop task management
- Customizable columns
- Real-time updates
- Filtering and search

### Rich Text Editor
- Milkdown-powered markdown editor
- Multiple themes including typewriter mode
- Syntax highlighting
- Live preview
- Export capabilities

### Context Rules & AI Integration
- Custom prompt management
- Context rule marketplace
- MCP server integration
- AI assistant configuration

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run build:no-check  # Build without TypeScript checking
npm run preview         # Preview production build
npm run lint            # Run ESLint

# Testing
npm run test            # Run tests (when configured)
npm run test:coverage   # Run tests with coverage
```

### Development Server

The development server includes:
- Hot Module Replacement (HMR)
- API proxy to backend server
- TypeScript checking
- ESLint integration

### Code Quality

- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Git hooks for quality gates (when configured)

## 🚀 Building and Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Docker Deployment

```bash
# Build Docker image
docker build -t todo-for-ai-frontend:latest .

# Run container
docker run -d --name todo-for-ai-frontend \
  -p 80:80 \
  -e VITE_API_BASE_URL="https://your-api-domain.com/api/v1" \
  todo-for-ai-frontend:latest
```

### Environment-specific Builds

```bash
# Development build
VITE_API_BASE_URL=http://localhost:50110/todo-for-ai/api/v1 npm run build

# Production build
VITE_API_BASE_URL=https://todo4ai.org/todo-for-ai/api/v1 npm run build
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if the API server is running
   - Verify `VITE_API_BASE_URL` in `.env`
   - Check network connectivity

2. **Authentication Issues**
   - Ensure OAuth is properly configured
   - Check browser console for errors
   - Verify API server OAuth settings

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript errors: `npm run build`
   - Update dependencies: `npm update`

4. **Performance Issues**
   - Enable production mode: `NODE_ENV=production`
   - Check bundle size: `npm run build` and analyze `dist/` folder
   - Optimize images and assets

### Debug Mode

Enable debug mode for detailed logging:

```bash
VITE_DEBUG_MODE=true npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Update documentation for significant changes
- Test your changes thoroughly
- Keep components small and focused

## 📄 License

MIT License

---

**🌟 Ready to boost your productivity?** Visit [https://todo4ai.org/](https://todo4ai.org/) and experience the future of AI-powered task management!
