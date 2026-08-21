.PHONY: dev-up dev-down dev-reset frontend-dev backend-dev db-migrate db-revision test-frontend test-backend test lint init-db reset-db

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

dev-reset:
	docker-compose down -v
	docker-compose up -d

frontend-dev:
	cd frontend && npm run dev

backend-dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

db-migrate:
	cd backend && alembic upgrade head

db-revision:
	cd backend && alembic revision --autogenerate -m "$(msg)"

test-frontend:
	cd frontend && npm test

test-backend:
	cd backend && python -m pytest -v

test:
	$(MAKE) test-backend
	$(MAKE) test-frontend

lint:
	cd backend && python -m ruff check .
	cd frontend && npm run lint

init-db:
	cd backend && alembic upgrade head

reset-db:
	cd backend && del /f pcc.db 2>nul & alembic upgrade head

clean:
	@rmdir /s /q .pytest_cache .ruff_cache 2>nul || true
	@cd backend && rmdir /s /q .pytest_cache .ruff_cache 2>nul || true


