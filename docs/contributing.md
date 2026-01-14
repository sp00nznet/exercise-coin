# Contributing Guide

Thank you for your interest in contributing to Exercise Coin!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience. Please:

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Accept responsibility for mistakes

---

## Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/exercise-coin.git
cd exercise-coin
```

### 3. Set Up Development Environment

```bash
# Install dependencies
npm run install:all

# Start development servers
cd server && npm run dev
# In another terminal
cd mobile-app && npm start
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-leaderboard` |
| Bug Fix | `fix/description` | `fix/login-error` |
| Docs | `docs/description` | `docs/api-examples` |
| Refactor | `refactor/description` | `refactor/auth-flow` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**

```
feat(api): add endpoint for session history

fix(mobile): resolve step counter crash on iOS

docs(readme): update installation instructions
```

---

## Coding Standards

### JavaScript/Node.js

```javascript
// Use ES6+ features
const getValue = () => {
  // Use const/let, not var
  const result = someFunction();
  return result;
};

// Async/await over callbacks
async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    logger.error('Failed to fetch:', error);
    throw error;
  }
}

// Descriptive names
const calculateMiningDuration = (exerciseSeconds) => {
  return exerciseSeconds * MINING_RATIO;
};
```

### React Native

```javascript
// Functional components with hooks
export default function ExerciseScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Side effects here
  }, [dependency]);

  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
}

// StyleSheet at bottom of file
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### File Organization

```
// Imports order
1. Node.js built-ins
2. External packages
3. Internal modules
4. Types (if TypeScript)

// Example
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const User = require('./models/User');
```

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Server tests
cd server && npm test

# With coverage
npm run test:coverage
```

### Writing Tests

```javascript
// server/tests/exercise.test.js
describe('ExerciseDetectionService', () => {
  describe('analyzeExerciseSession', () => {
    it('should validate exercise lasting 60+ seconds', () => {
      const stepData = generateValidStepData(65);
      const result = service.analyzeExerciseSession(stepData);

      expect(result.isValid).toBe(true);
      expect(result.validSeconds).toBeGreaterThanOrEqual(60);
    });

    it('should reject exercise under 60 seconds', () => {
      const stepData = generateValidStepData(45);
      const result = service.analyzeExerciseSession(stepData);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too short');
    });
  });
});
```

### Test Coverage

Aim for:
- 80% overall coverage
- 100% for critical paths (auth, payments)
- All edge cases covered

---

## Pull Request Process

### 1. Prepare Your Changes

```bash
# Ensure tests pass
npm test

# Lint code
npm run lint

# Update documentation if needed
```

### 2. Create Pull Request

- Use the PR template
- Link related issues
- Describe changes clearly
- Include screenshots for UI changes

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Follows coding standards
```

### 4. Review Process

1. Automated checks run (tests, lint)
2. Maintainer reviews code
3. Address feedback
4. Approval and merge

---

## Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - New features, backward compatible
1.1.1 - Bug fixes
2.0.0 - Breaking changes
```

### Release Steps

1. Update version in `package.json` files
2. Update CHANGELOG.md
3. Create release commit
4. Tag release: `git tag v1.1.0`
5. Push with tags: `git push --tags`
6. Create GitHub release

---

## Questions?

- Open a [GitHub Issue](https://github.com/sp00nznet/exercise-coin/issues)
- Check existing issues for answers
- Be specific and provide context

Thank you for contributing!
