FROM python:3.11-slim

WORKDIR /app
COPY ml/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ml/ .

ENV MODEL_PATH=/app/models/tx_model.joblib
ENV MODEL_VERSION=tx-risk-v1
ENV TRAIN_ON_START=true

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
