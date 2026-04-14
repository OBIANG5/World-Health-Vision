FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY services/analytics-service /app/services/analytics-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./services/analytics-service

EXPOSE 8000

ENTRYPOINT ["uvicorn", "analytics_service.api:app", "--host", "0.0.0.0", "--port", "8000"]
