#!/bin/bash

# Docker, Docker Compose, and Git Installation Script for Ubuntu
# This script installs Docker Engine, Docker Compose plugin, and Git

set -e  # Exit on any error

echo "=========================================="
echo "Docker, Docker Compose & Git Installer"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo or as root"
    exit 1
fi

# Update package index
echo "[1/6] Updating package index..."
apt-get update

# Install Git
echo "[2/6] Installing Git..."
apt-get install -y git
echo "Git version: $(git --version)"
echo ""

# Install prerequisites for Docker
echo "[3/6] Installing Docker prerequisites..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo "[4/6] Adding Docker's official GPG key..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo "[5/6] Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
apt-get update

# Install Docker Engine, CLI, containerd, and Docker Compose plugin
echo "[6/6] Installing Docker Engine and Docker Compose..."
apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""

# Display versions
echo "Installed versions:"
echo "  - Git: $(git --version)"
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker compose version)"
echo ""

# Add current user to docker group if not root
if [ -n "$SUDO_USER" ]; then
    echo "Adding user '$SUDO_USER' to docker group..."
    usermod -aG docker "$SUDO_USER"
    echo ""
    echo "IMPORTANT: You need to log out and log back in for group changes to take effect!"
    echo "Or run: newgrp docker"
fi

# Start and enable Docker service
echo "Starting Docker service..."
systemctl start docker
systemctl enable docker

echo ""
echo "=========================================="
echo "Setup complete! You're ready to use:"
echo "  - git"
echo "  - docker"
echo "  - docker compose"
echo "=========================================="
