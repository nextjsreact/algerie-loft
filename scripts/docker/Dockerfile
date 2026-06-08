# ============================================================================
# Dockerfile pour Airbnb Scraper avec CloakBrowser
# ============================================================================
# Image de base: Python 3.11 slim
FROM python:3.11-slim

# Métadonnées
LABEL maintainer="Loft Algérie"
LABEL description="Airbnb Scraper avec CloakBrowser et API Next.js"
LABEL version="2.0.1"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Installer Playwright et ses navigateurs
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps chromium

# Copier les fichiers du scraper
COPY airbnb_scraper.py .
COPY airbnb_api_client.py .
COPY .env .

# Créer le répertoire de sortie
RUN mkdir -p /app/output

# Exposer le volume pour les données
VOLUME ["/app/output"]

# Commande par défaut
CMD ["python", "airbnb_scraper.py"]
