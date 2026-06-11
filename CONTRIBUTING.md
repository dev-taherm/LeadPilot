# Contributing to LeadFlow AI

Thank you for your interest in contributing! This document outlines the process and guidelines for contributing to this project.

---

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-lead-follow-up.git
   cd ai-lead-follow-up
   ```
3. Create a branch for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Code Style

### Python (Backend)

- Follow **PEP 8** conventions
- Use **type hints** where practical
- Run the linter before committing:
  ```bash
  ruff check .
  ruff format .
  ```
- Keep functions focused and under 50 lines where possible
- Use descriptive variable and function names

### TypeScript / React (Frontend)

- Follow the existing **ESLint** configuration
- Use **functional components** with hooks
- Prefer **Zustand** for state management (existing pattern)
- Use **Tailwind CSS** utility classes for styling

### General

- Do not add comments unless the logic is genuinely non-obvious
- Keep commits atomic: one logical change per commit
- Write descriptive commit messages following conventional commits

---

## Testing

### Backend Tests

Tests use **pytest** with **factory-boy** and **faker**.

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=term-missing

# Run a specific test file
pytest apps/leads/tests/test_models.py

# Run a specific test
pytest apps/leads/tests/test_models.py::TestLead::test_lead_creation -v
```

### Frontend Tests

```bash
cd frontend
npm run lint
```

### Writing Tests

- Place test files in `tests/` directories within each app
- Use `factory-boy` to create test fixtures (see existing factories)
- Use `faker` for generating realistic test data
- Each test should be independent and not rely on other tests
- Aim for meaningful coverage, not just high percentages

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   # Backend
   cd backend
   ruff check .
   pytest

   # Frontend
   cd frontend
   npm run lint
   ```

3. **Review your diff**:
   ```bash
   git status
   git diff --staged
   ```

### PR Requirements

- **Title**: Use conventional commit format (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)
- **Description**: Clearly explain what changed and why
- **Tests**: Include tests for new functionality or bug fixes
- **No secrets**: Ensure no API keys, passwords, or secrets are committed
- **One concern per PR**: Keep PRs focused on a single change

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Other

## Testing
[How was this tested?]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] No secrets or credentials committed
- [ ] Documentation updated (if applicable)
```

---

## Project Structure

When adding a new feature:

1. **Backend app**: Create under `backend/apps/` following the existing pattern
   - `models.py` - Database models
   - `serializers.py` - DRF serializers
   - `views.py` - API views
   - `urls.py` - URL routing
   - `admin.py` - Django admin registration
   - `apps.py` - App configuration
   - `tests/` - Test suite

2. **Frontend page**: Create under `frontend/src/app/` following Next.js App Router conventions

3. **Register the app** in `config/settings.py` under `INSTALLED_APPS`

4. **Add URL routing** in `config/urls.py`

---

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce the issue
- Include expected vs actual behavior
- Include your environment details (OS, Python version, Node version)

---

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help others learn and grow

---

## Questions?

If you have questions about contributing, feel free to open a discussion or reach out to the maintainers.
