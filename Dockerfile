FROM python:3.12-slim
LABEL org.opencontainers.image.title="Vaultarr" \
      org.opencontainers.image.description="A self-hosted digital museum for game preservation" \
      org.opencontainers.image.version="1.1.7" \
      org.opencontainers.image.source="https://github.com/linkssy2/vaultarr" \
      org.opencontainers.image.url="https://github.com/linkssy2/vaultarr" \
      org.opencontainers.image.vendor="Vaultarr"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    LOCALAPPDATA=/config

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8787
CMD ["python", "-m", "app.main"]
