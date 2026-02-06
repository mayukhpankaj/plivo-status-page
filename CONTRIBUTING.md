# Contributing to Status Page

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/plivo-status.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Follow the [Setup Guide](docs/setup-guide.md) to get your development environment running

## Development Workflow

1. Make your changes
2. Test thoroughly (both frontend and backend)
3. Ensure code follows existing style
4. Commit with clear, descriptive messages
5. Push to your fork
6. Open a Pull Request

## Code Style

### Backend (Node.js)
- Use ES6+ features
- Use async/await over callbacks
- Follow existing file structure
- Add error handling
- Comment complex logic

### Frontend (React)
- Use functional components with hooks
- Follow existing component structure
- Use Tailwind CSS for styling
- Keep components focused and reusable
- Add PropTypes or TypeScript types

### Database
- Document schema changes
- Create migration files
- Test with sample data
- Consider performance implications

## Testing

Before submitting:
- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] Authentication works
- [ ] CRUD operations function correctly
- [ ] Public status page displays properly
- [ ] No console errors

## Pull Request Process

1. Update README.md if needed
2. Update documentation for new features
3. Describe changes in PR description
4. Reference any related issues
5. Wait for review and address feedback

## Reporting Bugs

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)

## Feature Requests

- Check if feature already exists
- Describe the use case
- Explain why it would be valuable
- Consider implementation approach

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Questions?

Open an issue with the "question" label.

Thank you for contributing! 🎉
