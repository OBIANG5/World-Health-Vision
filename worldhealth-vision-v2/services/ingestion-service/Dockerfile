FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY services/ingestion-service /app/services/ingestion-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./services/ingestion-service

EXPOSE 8000

ENTRYPOINT ["uvicorn", "ingestion_service.api:app", "--host", "0.0.0.0", "--port", "8000"]
