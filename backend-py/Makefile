all: install run-dev

install:
	python install -r requirements.txt

run-dev:
	PYTHONPATH=src fastapi dev src/main.py

run-dev_win:
	PYTHONPATH=src python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

build:
	docker build -t eu-ldt-data-platform-backend .

run:
	docker run --rm -p 8000:8000 eu-ldt-data-platform-backend

migrate-new:
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini revision --autogenerate -m "$(msg)"

migrate-upgrade:
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini  upgrade head

migrate-new-revision:
	revision_name="update contexts and entities tables"; \
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini revision --autogenerate -m "$$revision_name"

migrate-init:
	cd src && PYTHONPATH=src && python -m alembic init migrations

migrate-current:
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini current

migrate-revert:
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini downgrade -1

migrate-history:
	cd src && PYTHONPATH=src && python -m alembic --config config/alembic.ini history
