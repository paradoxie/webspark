# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebSpark.club is a full-stack web application for showcasing and discovering web development projects. It's built as a community platform where developers can submit their work, browse others' projects, and interact through likes, bookmarks, comments, and comprehensive analytics.

## Architecture

This is a monorepo with separate frontend and backend applications:

### Frontend (Next.js App Router)
- **Location**: `frontend/`
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js with GitHub OAuth
- **Styling**: Tailwind CSS with dark theme support
- **Data Fetching**: SWR for client-side, direct API calls for server-side
- **Charts**: Chart.js with React Chart.js 2
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Cloudflare Pages

### Backend (Express + Prisma)
- **Location**: `backend/`
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens via NextAuth integration
- **Security**: Enterprise-grade security with CSRF, XSS, SQL injection protection
- **Analytics**: Comprehensive user behavior and traffic analysis
- **Email**: Nodemailer for notifications
- **File Upload**: Multer + Sharp for image processing
- **Deployment**: Baota Panel + PM2

## Development Commands

### Prerequisites
```bash
# Ensure you have the required versions
node --version  # Should be 18+
npm --version   # Latest stable version
```

### Initial Setup
```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Database setup (from backend/)
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### Development Workflow
```bash
# Start both servers (run in separate terminals)
# Terminal 1: Frontend (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2: Backend (http://localhost:3001)
cd backend && npm run dev

# Production builds and validation
cd frontend && npm run build && npm run lint && npm run type-check
cd backend && npm run build && npm run lint
```

### Database Management
```bash
# All commands run from backend/ directory
npm run db:generate   # Generate Prisma client after schema changes
npm run db:migrate    # Create and apply new migrations
npm run db:deploy     # Deploy migrations to production
npm run db:seed       # Seed database with initial data
npm run db:studio     # Open Prisma Studio GUI for database inspection
```

### Key Scripts Explained
- **Frontend `npm run dev`**: Starts Next.js development server with hot reload
- **Backend `npm run dev`**: Uses `tsx watch` for TypeScript execution with hot reload
- **`npm run build`**: Compiles TypeScript and creates production builds
- **`npm run lint`**: Runs ESLint with project-specific configurations
- **`npm run type-check`**: Validates TypeScript without emitting files

## High-Level Architecture

### Authentication & Authorization Flow
1. **Frontend Authentication**: NextAuth.js handles GitHub OAuth with custom JWT token generation
2. **Token Format**: Base64-encoded JSON containing user info (id, email, name, role)
3. **Backend Validation**: Custom middleware validates tokens and populates `req.user`
4. **Role-Based Access**: Three roles (USER, MODERATOR, ADMIN) with hierarchical permissions
5. **API Protection**: Critical endpoints use `authenticate` and `requireAdmin` middleware

### Core Business Logic Patterns

#### Website Submission & Approval Pipeline
```
User submits → PENDING status → Admin review → APPROVED/REJECTED → User notification
```
- Submissions require authentication
- Automatic slug generation and URL validation
- Email notifications for status changes
- Audit trail for all admin actions

#### Smart Sorting Algorithm
The platform uses a hybrid algorithm for content ranking:
```typescript
score = (likeCount * 5) + (timestamp / 10000)
```
This balances popularity with recency, preventing old popular content from dominating.

#### User Interaction System
- **Optimistic Updates**: UI updates immediately, with server sync
- **Batch Queries**: N+1 query prevention using bulk operations
- **Real-time Counts**: Like/bookmark counts update across all views

### Security Architecture
- **Input Validation**: Joi schemas on backend, Zod schemas on frontend
- **CSRF Protection**: Custom token-based protection for state-changing operations
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content sanitization and proper escaping
- **Security Audit**: Comprehensive logging of security events

### Data Consistency Patterns
- **Soft Deletes**: Uses `deletedAt` timestamps instead of hard deletes
- **Transactional Operations**: Critical operations wrapped in database transactions
- **Cache Invalidation**: Strategic cache busting for real-time features
- **Migration Strategy**: Prisma migrations with rollback capabilities

## Key Technical Concepts

### Frontend Architecture Patterns
- **App Router**: All pages use Next.js 13+ App Router conventions
- **API Proxy Pattern**: Frontend API routes proxy to backend for authentication
- **Theme System**: CSS variables + Tailwind for consistent dark/light themes
- **Component Composition**: Reusable components with consistent props interfaces
- **Error Boundaries**: Graceful error handling with fallback UIs

### Backend Architecture Patterns
- **Middleware Pipeline**: Authentication → Validation → Business Logic → Response
- **Service Layer**: Business logic separated from route handlers
- **Database Layer**: Prisma client with custom query optimization
- **Security Layer**: Multiple validation layers and audit logging

### State Management Strategy
- **Server State**: SWR for caching and synchronization
- **Form State**: React Hook Form for complex forms
- **UI State**: React Context for theme and global UI state
- **Authentication State**: NextAuth session management

## Critical Implementation Details

### Database Schema Relationships
```sql
User 1:N Website (author)
User N:M Website (likes, bookmarks)
Website N:M Tag
Website 1:N Comment
Comment 1:N Comment (nested replies)
User 1:N Notification
```

### API Route Patterns
- **REST Conventions**: `/api/resource` for collections, `/api/resource/id` for items
- **Nested Resources**: `/api/websites/id/comments` for related data
- **Custom Actions**: `/api/websites/id/like` for specific operations
- **Admin Routes**: `/api/admin/*` with special authentication

### Security Middleware Chain
1. **Rate Limiting**: Prevents abuse of public endpoints
2. **CORS Configuration**: Specific origins and methods allowed
3. **Input Validation**: All inputs validated before processing
4. **Authentication**: JWT token validation and user context
5. **Authorization**: Role-based access control for sensitive operations

### Performance Optimization Strategies
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: Includes/selects to minimize data transfer
- **Image Processing**: Sharp for efficient image resizing and optimization
- **Caching Strategy**: Multiple layers including browser, CDN, and application cache

## Common Development Patterns

### Adding New Features
1. **Schema First**: Update `backend/prisma/schema.prisma` for data changes
2. **Migration**: Generate and test database migrations
3. **Backend API**: Implement routes with proper validation and security
4. **Frontend Integration**: Create API clients and UI components
5. **Testing**: Manual testing of complete user flows

### Error Handling Strategy
- **Backend**: Consistent error objects with codes and messages
- **Frontend**: Toast notifications and inline error displays
- **Logging**: Structured logging with correlation IDs
- **Monitoring**: Error tracking and performance monitoring

### Security Implementation Checklist
- ✅ Input validation on all endpoints
- ✅ Authentication middleware on protected routes
- ✅ Role-based authorization for admin functions
- ✅ CSRF protection on state-changing operations
- ✅ Security audit logging for sensitive actions
- ✅ Environment variable management for secrets

This architecture enables rapid development while maintaining security, performance, and scalability. The modular design allows features to be developed independently while ensuring consistency across the platform.