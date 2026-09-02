#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# setup-vps.sh — Configuración inicial del VPS para Preoperacional
# Uso: ./scripts/setup-vps.sh [usuario]
# Ej:  ./scripts/setup-vps.sh deploy
# ──────────────────────────────────────────────────────────────

SUDO_USER="${1:-deploy}"
SUDO_HOME="/home/${SUDO_USER}"

echo "=== Setup VPS — Preoperacional ==="
echo "  Usuario deploy: ${SUDO_USER}"
echo "==================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Este script debe ejecutarse como root (sudo)."
  exit 1
fi

# ── 1. System update ────────────────────────────────────────
echo "[1/6] Actualizando sistema..."
apt update && apt upgrade -y

# ── 2. Instalar Docker y Docker Compose ────────────────────
echo "[2/6] Instalando Docker y Docker Compose..."
if ! command -v docker &>/dev/null; then
  apt install -y docker.io docker-compose-v2
  systemctl enable --now docker
else
  echo "  Docker ya instalado, saltando."
fi

# ── 3. Crear usuario deploy ────────────────────────────────
echo "[3/6] Creando usuario '${SUDO_USER}'..."
if id "${SUDO_USER}" &>/dev/null; then
  echo "  Usuario ya existe, saltando."
else
  useradd -m -s /bin/bash -G docker "${SUDO_USER}"
  passwd "${SUDO_USER}"
  echo "${SUDO_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/"${SUDO_USER}"
fi

# ── 4. Configurar firewall (ufw) ──────────────────────────
echo "[4/6] Configurando firewall..."
if command -v ufw &>/dev/null; then
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
else
  echo "  ufw no instalado — instalando..."
  apt install -y ufw
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

# ── 5. Crear directorios del proyecto ──────────────────────
echo "[5/6] Creando directorios del proyecto..."
mkdir -p "${SUDO_HOME}/preoperacional/backups"
mkdir -p "${SUDO_HOME}/preoperacional/scripts"
mkdir -p "${SUDO_HOME}/preoperacional/uploads"
mkdir -p "${SUDO_HOME}/preoperacional/deploy_backups"
chown -R "${SUDO_USER}:${SUDO_USER}" "${SUDO_HOME}"

# ── 6. Configurar SSH (solo llaves) ────────────────────────
echo "[6/6] Configurando acceso SSH..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Asegurar que existe el directorio .ssh del usuario
mkdir -p "${SUDO_HOME}/.ssh"
chmod 700 "${SUDO_HOME}/.ssh"

# Si hay una llave pública de root, copiarla al usuario deploy
if [ -f /root/.ssh/authorized_keys ] && [ ! -f "${SUDO_HOME}/.ssh/authorized_keys" ]; then
  cp /root/.ssh/authorized_keys "${SUDO_HOME}/.ssh/authorized_keys"
  chown -R "${SUDO_USER}:${SUDO_USER}" "${SUDO_HOME}/.ssh"
  chmod 600 "${SUDO_HOME}/.ssh/authorized_keys"
fi

# Deshabilitar login por password y root login
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' "${SSHD_CONFIG}"
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "${SSHD_CONFIG}"
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"

systemctl restart sshd || systemctl restart ssh

echo ""
echo "✓ Setup completado!"
echo "  Usuario: ${SUDO_USER}"
echo "  Próximo paso: copia tu llave SSH y deploya el proyecto."
echo "  ssh-copy-id ${SUDO_USER}@<IP_DEL_VPS>"
echo "  Luego corre: ./scripts/deploy.sh ${SUDO_USER} <IP> <DOMINIO>"
