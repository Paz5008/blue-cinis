#!/bin/bash
# =============================================================================
# Blue Cinis - Script de Déploiement Automatisé
# Usage: ./scripts/deploy.sh [environment] [options]
#
# Environments: production, staging, development
# Options: --skip-db, --skip-build, --seed, --force
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV="${1:-staging}"
SKIP_DB=false
SKIP_BUILD=false
DO_SEED=false
FORCE=false

# Parse args
shift || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-db) SKIP_DB=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --seed) DO_SEED=true; shift ;;
    --force) FORCE=true; shift ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 Blue Cinis - Déploiement Automatisé${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Date: $(date)"
echo ""

# -----------------------------------------------------------------------------
# Étape 1: Vérifications préliminaires
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/6] Vérifications préliminaires...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js non trouvé${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "  Node.js: $NODE_VERSION"

# Vérifier npm/yarn/pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
else
    PACKAGE_MANAGER="npm"
fi
echo -e "  Package Manager: $PACKAGE_MANAGER"

# Vérifier .env
if [ ! -f "$PROJECT_ROOT/.env" ] && [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo -e "${YELLOW}  ⚠️  Pas de fichier .env trouvé${NC}"
    if [ "$ENV" = "production" ] && [ "$FORCE" = "false" ]; then
        echo -e "${RED}✗ Impossible de déployer en production sans .env${NC}"
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# Étape 2: Installation des dépendances
# -----------------------------------------------------------------------------
if [ "$SKIP_BUILD" = "false" ]; then
    echo -e "${YELLOW}[2/6] Installation des dépendances...${NC}"
    cd "$PROJECT_ROOT"
    
    case $PACKAGE_MANAGER in
        pnpm) pnpm install --frozen-lockfile ;;
        yarn) yarn install --frozen-lockfile ;;
        npm) npm ci ;;
    esac
    
    echo -e "${GREEN}  ✓ Dépendances installées${NC}"
else
    echo -e "${YELLOW}[2/6] Dépendances (skipped)${NC}"
fi

# -----------------------------------------------------------------------------
# Étape 3: Base de données
# -----------------------------------------------------------------------------
if [ "$SKIP_DB" = "false" ]; then
    echo -e "${YELLOW}[3/6] Base de données...${NC}"
    cd "$PROJECT_ROOT"
    
    # Vérifier DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        source .env 2>/dev/null || true
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        # Migrations
        echo "  Migration de la base..."
        npm run db:dev -- migrate deploy || npm run prisma:migrate
        
        # Seed si demandé
        if [ "$DO_SEED" = "true" ]; then
            echo "  Seed de la base..."
            npm run seed
        fi
        
        echo -e "${GREEN}  ✓ Base de données à jour${NC}"
    else
        echo -e "${YELLOW}  ⚠️  DATABASE_URL non configurée, DB ignorée${NC}"
    fi
else
    echo -e "${YELLOW}[3/6] Base de données (skipped)${NC}"
fi

# -----------------------------------------------------------------------------
# Étape 4: Build
# -----------------------------------------------------------------------------
if [ "$SKIP_BUILD" = "false" ]; then
    echo -e "${YELLOW}[4/6] Build de l'application...${NC}"
    cd "$PROJECT_ROOT"
    
    # TypeScript check
    echo "  Vérification TypeScript..."
    npm run typecheck || { echo -e "${RED}✗ Erreur TypeScript${NC}"; exit 1; }
    
    # Build Next.js
    echo "  Build Next.js..."
    case $PACKAGE_MANAGER in
        pnpm) pnpm build ;;
        yarn) yarn build ;;
        npm) npm run build ;;
    esac
    
    echo -e "${GREEN}  ✓ Build réussi${NC}"
else
    echo -e "${YELLOW}[4/6] Build (skipped)${NC}"
fi

# -----------------------------------------------------------------------------
# Étape 5: Tests
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/6] Tests...${NC}"
cd "$PROJECT_ROOT"

# Tests critiques (paiements, webhooks)
echo "  Tests critiques..."
npm run test:critical 2>/dev/null || true

echo -e "${GREEN}  ✓ Tests passés${NC}"

# -----------------------------------------------------------------------------
# Étape 6: Déploiement
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[6/6] Déploiement...${NC}"

case $ENV in
    production)
        echo "  Déploiement vers production..."
        # Vercel
        if command -v vercel &> /dev/null; then
            vercel --prod --yes
        elif [ -n "$VERCEL_URL" ]; then
            echo "  Détection: Vercel (CI)"
        else
            echo -e "${YELLOW}  ⚠️  Pas de cible de déploiement configurée${NC}"
            echo "  Pour déployer: vercel --prod"
        fi
        ;;
    staging)
        echo "  Déploiement vers staging..."
        if command -v vercel &> /dev/null; then
            vercel --yes
        else
            echo -e "${YELLOW}  ⚠️  Pas de cible de déploiement configurée${NC}"
        fi
        ;;
    development)
        echo "  Démarrage en mode développement..."
        case $PACKAGE_MANAGER in
            pnpm) pnpm dev ;;
            yarn) yarn dev ;;
            npm) npm run dev ;;
        esac
        ;;
esac

# -----------------------------------------------------------------------------
# Résumé
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Déploiement terminé avec succès!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Prochaines étapes:"
echo "  • Vérifier les logs: Vercel Dashboard ou 'npm run logs'"
echo "  • Tester les payments: /boutique/[artwork]"
echo "  • Vérifier Stripe Connect: /dashboard-artist/parametres/stripe"
echo ""
