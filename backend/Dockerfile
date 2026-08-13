FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /data/uploads

ENV DATABASE_URL=sqlite:////data/typeform.db
ENV UPLOAD_DIR=/data/uploads
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "mkdir -p ${UPLOAD_DIR:-/data/uploads} && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
