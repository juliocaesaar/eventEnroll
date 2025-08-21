# EventFlow SaaS Platform

## Overview

EventFlow is a comprehensive SaaS platform for event management that enables organizers to create, manage, and monetize events of all types. Built with modern web technologies, the platform provides a complete ecosystem connecting event organizers with attendees through professional-grade tools including a drag-and-drop editor, integrated payment systems, analytics, and template management.

The application follows a full-stack architecture with React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, and integrates Brazilian payment methods including PIX. The platform democratizes access to professional event management tools, allowing anyone to create events with enterprise-level functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Authentication**: Replit Auth integration with session-based authentication using connect-pg-simple
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL store for scalable session handling
- **API Design**: RESTful endpoints organized by resource (events, users, templates, registrations)

### Database Design
- **ORM**: Drizzle with schema-first approach ensuring type safety across the stack
- **Tables**: Users, events, tickets, registrations, templates, event categories, and sessions
- **Relationships**: Proper foreign key relationships between users-events, events-tickets, events-registrations
- **Migration System**: Drizzle-kit for database schema migrations and version control

### Component Architecture
- **Design System**: shadcn/ui components with Radix UI primitives for accessibility
- **Layout Strategy**: Responsive design with mobile-first approach and dedicated mobile navigation
- **State Flow**: Unidirectional data flow with query invalidation for real-time updates
- **Error Handling**: Centralized error boundaries with user-friendly error messages

### Authentication & Authorization
- **Provider**: Replit Auth for OAuth-based authentication
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Route Protection**: Middleware-based authentication checks on protected routes
- **User Management**: Complete user profile management with role-based access patterns

### Editor System
- **Drag-and-Drop**: Custom component-based page builder for event landing pages
- **Template Engine**: Reusable templates with customizable components (header, text, image, button)
- **Preview Mode**: Real-time preview of event pages during editing
- **Component Library**: Extensible component system for future additions

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form for frontend development
- **Routing & Navigation**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Form Validation**: Zod for schema validation and type inference

### UI & Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling Framework**: Tailwind CSS for utility-first styling approach
- **Design System**: shadcn/ui for pre-built, customizable component patterns
- **Icons**: Lucide React for consistent iconography

### Backend Infrastructure
- **Web Framework**: Express.js for REST API development
- **Database**: PostgreSQL with Neon serverless database hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full TypeScript support across frontend and backend
- **Package Management**: npm with lockfile for dependency management
- **Database Migrations**: Drizzle-kit for schema migrations

### Email Services
- **Provider**: SendGrid for transactional email delivery
- **Use Cases**: Event confirmations, registration notifications, marketing communications
- **Integration**: API-based integration with template support

### Payment Processing (Planned)
- **Brazilian Market**: PIX integration for instant payments
- **Credit Cards**: Traditional payment gateway integration
- **Boleto**: Brazilian banking slip payment method

### Monitoring & Analytics (Future)
- **Performance**: Built-in analytics system for event performance tracking
- **Error Tracking**: Centralized error logging and monitoring
- **User Analytics**: Event registration and engagement metrics