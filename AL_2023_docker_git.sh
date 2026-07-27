#!/bin/bash

# Docker, Docker Compose, and Git Installation Script for Amazon Linux
# Supports both Amazon Linux 2 (yum) and Amazon Linux 2023 (dnf)

set -e  # Exit on any error

echo "=========================================="
echo "Docker, Docker Compose & Git Installer"
echo "         (Amazon Linux Edition)"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script with sudo or as root"
    exit 1
fi

# Detect Amazon Linux version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    AL_VERSION="$VERSION_ID"
else
    echo "Cannot detect OS version (/etc/os-release not found). Aborting."
    exit 1
fi

if [[ "$AL_VERSION" == "2" ]]; then
    PKG_MGR="yum"
    IS_AL2=true
    echo "Detected Amazon Linux 2"
elif [[ "$AL_VERSION" == "2023" ]]; then
    PKG_MGR="dnf"
    IS_AL2=false
    echo "Detected Amazon Linux 2023"
else
    echo "Unrecognized Amazon Linux version ($AL_VERSION). Attempting to proceed with dnf if available, else yum."
    if command -v dnf &> /dev/null; then
        PKG_MGR="dnf"
        IS_AL2=false
    else
        PKG_MGR="yum"
        IS_AL2=true
    fi
fi
echo ""

# Update package index
echo "[1/6] Updating package index..."
$PKG_MGR update -y

# Install Git
echo "[2/6] Installing Git..."
$PKG_MGR install -y git
echo "Git version: $(git --version)"
echo ""

# Install prerequisites
# Note: Amazon Linux 2023 ships "curl-minimal" by default, which conflicts
# with the full "curl" package. curl-minimal already provides a working
# curl binary, so we only install curl if no curl command exists at all.
echo "[3/6] Installing prerequisites..."
$PKG_MGR install -y ca-certificates gnupg
if ! command -v curl &> /dev/null; then
    $PKG_MGR install -y curl
fi

# Install Docker
echo "[4/6] Installing Docker Engine..."
if [ "$IS_AL2" = true ]; then
    # Amazon Linux 2: use amazon-linux-extras (provides an older but supported docker)
    if command -v amazon-linux-extras &> /dev/null; then
        amazon-linux-extras install docker -y
    else
        # Fallback: manually write Docker's CentOS 7 repo (AL2 is RHEL7-based).
        # NOTE: we hardcode the release version (7) instead of using
        # yum-config-manager --add-repo, because AL2's $releasever does not
        # match CentOS's numbering and produces a broken/404 URL.
        cat > /etc/yum.repos.d/docker-ce.repo <<'EOF'
[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://download.docker.com/linux/centos/7/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://download.docker.com/linux/centos/gpg
EOF
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
else
    # Amazon Linux 2023: manually write Docker's CentOS 9 repo.
    # NOTE: same issue as AL2 -- AL2023's $releasever (a date-based string
    # like "2023.12.20260710") does not exist on Docker's servers, so we
    # hardcode release version 9 (AL2023 is EL9-compatible) instead of using
    # dnf config-manager --add-repo, which substitutes the broken value.
    cat > /etc/yum.repos.d/docker-ce.repo <<'EOF'
[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://download.docker.com/linux/centos/9/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://download.docker.com/linux/centos/gpg
EOF
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Install Docker Compose plugin separately if not already present (amazon-linux-extras path)
echo "[5/6] Verifying Docker Compose plugin..."
if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found via package manager, installing manually..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
    mkdir -p "$DOCKER_CONFIG/cli-plugins"
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    ARCH=$(uname -m)
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
        -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
    chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
fi

echo ""
echo "[6/6] Starting and enabling Docker service..."
systemctl start docker
systemctl enable docker

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

echo ""
echo "=========================================="
echo "Setup complete! You're ready to use:"
echo "  - git"
echo "  - docker"
echo "  - docker compose"
echo "=========================================="
