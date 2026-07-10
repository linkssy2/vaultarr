FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    LOCALAPPDATA=/config

WORKDIR /app

LABEL org.opencontainers.image.title="Vaultarr" \
      org.opencontainers.image.description="A digital museum for game preservation." \
      org.opencontainers.image.source="https://github.com/linkssy2/vaultarr" \
      org.opencontainers.image.url="https://github.com/linkssy2/vaultarr" \
      org.opencontainers.image.documentation="https://github.com/linkssy2/vaultarr#readme" \
      org.opencontainers.image.version="1.1.2" \
      org.opencontainers.image.vendor="Vaultarr" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.icon="/app/app/static/icons/vaultarr-icon.png"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8787
CMD ["python", "-m", "app.main"]
