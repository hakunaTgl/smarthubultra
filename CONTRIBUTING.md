# Contributing to Smart Hub Ultra

Thank you for your interest in contributing to Smart Hub Ultra! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We're building a community that values autonomy, privacy, and freedom.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Git
- A GitHub account
- Basic knowledge of JavaScript, HTML, and CSS

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/smarthubultra.git
   cd smarthubultra
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/hakunaTgl/smarthubultra.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Before You Start

1. Check existing issues to see if your idea is already being worked on
2. Open a new issue to discuss major changes before implementing
3. Keep changes focused - one feature or fix per pull request

### Making Changes

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run lint
   npm run format
   npm test  # when tests are available
   ```

4. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add voice command support for bot creation"
   git commit -m "fix: resolve authentication error on password reset"
   git commit -m "docs: update README with deployment instructions"
   ```

   Use conventional commit prefixes:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots/GIFs for UI changes
   - Testing steps performed

5. Wait for review and address any feedback

## Coding Standards

### JavaScript

- Use ES6+ features (const/let, arrow functions, destructuring)
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### HTML/CSS

- Use semantic HTML5 elements
- Follow BEM naming convention for CSS classes
- Ensure mobile responsiveness
- Test on multiple browsers
- Maintain accessibility standards (ARIA labels, keyboard navigation)

### File Organization

- Place new JavaScript modules in `js/`
- Add new styles to `css/`
- Keep bot templates in `bots/`
- Document new plugins in `plugins/`

## Testing

- Write unit tests for new features (when test framework is set up)
- Test on both desktop and mobile browsers
- Verify offline PWA functionality
- Test Firebase integration in development environment

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for public functions
- Update relevant markdown files in the project
- Include code examples where helpful

## Areas We Welcome Contributions

### High Priority

- Bug fixes (check open issues)
- Security improvements
- Performance optimizations
- Mobile/PWA enhancements
- Accessibility improvements

### Feature Ideas

- Enhanced bot templates
- New dashboard widgets
- Improved collaboration features
- Plugin development
- Voice command expansions
- AR mode enhancements

### Documentation

- Tutorial videos or written guides
- API documentation
- Architecture diagrams
- Troubleshooting guides

## Questions or Problems?

- Open an issue for bugs or feature requests
- Join discussions in GitHub Discussions (when enabled)
- Check existing documentation in the repo

## Recognition

All contributors will be recognized in our README and release notes. Your contributions help build a more autonomous and privacy-focused AI ecosystem.

## License

By contributing to Smart Hub Ultra, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Smart Hub Ultra!** 🚀
