#!/bin/bash

# =============================================================================
# DEAD FILE CLEANUP SCRIPT
# Kmetija Maroša - Farm E-commerce Website
# Generated from Codebase Audit - December 8, 2025
# =============================================================================
#
# This script removes dead/unused files identified during the codebase audit.
# RUN WITH CAUTION - Review the file list before executing!
#
# Usage: ./scripts/cleanup-dead-files.sh [--dry-run]
#

set -e

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be deleted"
    echo ""
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧹 Kmetija Maroša - Dead File Cleanup"
echo "======================================"
echo "Project root: $PROJECT_ROOT"
echo ""

# Count files to be removed
TOTAL_FILES=0

remove_file() {
    local file="$1"
    if [ -f "$file" ]; then
        TOTAL_FILES=$((TOTAL_FILES + 1))
        if [ "$DRY_RUN" = true ]; then
            echo "  Would delete: $file"
        else
            rm "$file"
            echo "  ✓ Deleted: $file"
        fi
    fi
}

remove_dir() {
    local dir="$1"
    if [ -d "$dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            local count=$(find "$dir" -type f | wc -l)
            echo "  Would delete directory: $dir ($count files)"
        else
            rm -rf "$dir"
            echo "  ✓ Deleted directory: $dir"
        fi
    fi
}

# =============================================================================
# ROOT LEVEL TEST SCRIPTS (30+ files)
# =============================================================================
echo ""
echo "📁 Removing root-level test scripts..."

TEST_SCRIPTS=(
    "checkout-steps-email-test.js"
    "complete-payment-test.js"
    "complete-verification-test.js"
    "comprehensive-checkout-email-test.js"
    "correct-flow-test.js"
    "debug-checkout-page.js"
    "debug-checkout-test.js"
    "email-confirmation-test.js"
    "email-debug-test.js"
    "exact-flow-test.js"
    "final-working-checkout.js"
    "fixed-checkout-test.js"
    "focused-ghost-buyer.js"
    "full-checkout-test.js"
    "ghost-user-test.js"
    "guest-vs-registered-email-test.js"
    "guest-vs-registered-test.js"
    "human-like-checkout.js"
    "multi-step-checkout-test.js"
    "production-ghost-buyer.js"
    "proof-ghost-buyer.js"
    "robust-email-test.js"
    "simple-checkout-test.js"
    "simple-ghost-buyer.js"
    "simple-guest-vs-registered.js"
    "smart-ghost-buyer.js"
    "working-ghost-buyer.js"
    "working-proof-test.js"
    "proof-ghost-buyer-2025-07-22.json"
    "smart-ghost-buyer-report-2025-07-22.json"
    "test-report.json"
)

for script in "${TEST_SCRIPTS[@]}"; do
    remove_file "$script"
done

# =============================================================================
# PDF/INVOICE CONVERTERS
# =============================================================================
echo ""
echo "📁 Removing PDF converter scripts..."

PDF_SCRIPTS=(
    "chrome-pdf-converter.js"
    "create-comprehensive-report-pdf.js"
    "create-final-corrected-pdfs.js"
    "create-final-invoice-27aug.js"
    "final-fixed-pdf.js"
    "fixed-header-pdf.js"
    "html-to-pdf-converter.js"
    "optimized-pdf-converter.js"
    "ultra-optimized-pdf.js"
    "update-final-pdfs.js"
    "update-invoice-date.js"
)

for script in "${PDF_SCRIPTS[@]}"; do
    remove_file "$script"
done

# =============================================================================
# EMPTY/DEAD FILES
# =============================================================================
echo ""
echo "📁 Removing empty/dead files..."

DEAD_FILES=(
    "check_all_products.js"
    "check_pegasti.js"
    "complete_trigger_fix.sql"
    "dev-server.log"
)

for file in "${DEAD_FILES[@]}"; do
    remove_file "$file"
done

# =============================================================================
# WORKSPACE FILES
# =============================================================================
echo ""
echo "📁 Removing workspace files..."

find . -maxdepth 1 -name "*.code-workspace" -type f | while read file; do
    remove_file "$file"
done

remove_file "src/context/zadnje.code-workspace"

# =============================================================================
# INVOICES DOCUMENTS DIRECTORY (SENSITIVE DATA)
# =============================================================================
echo ""
echo "📁 Removing invoices_documents directory (sensitive data)..."
remove_dir "invoices_documents"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "======================================"
if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN COMPLETE"
    echo "Total files that would be deleted: $TOTAL_FILES+"
    echo ""
    echo "To actually delete files, run:"
    echo "  ./scripts/cleanup-dead-files.sh"
else
    echo "✅ CLEANUP COMPLETE"
    echo "Total files deleted: $TOTAL_FILES+"
fi
echo ""

# =============================================================================
# UPDATE .gitignore
# =============================================================================
echo "📝 Updating .gitignore..."

GITIGNORE_ADDITIONS="
# =============================================================================
# Added by cleanup script - December 8, 2025
# =============================================================================

# Invoices and sensitive documents
invoices_documents/

# Test reports and artifacts
tests/reports/html/
tests/reports/*.json
tests/reports/screenshots/

# Workspace files
*.code-workspace

# Development test files
*-test.js
*-ghost-buyer.js
*-pdf*.js

# Log files
*.log
"

if [ "$DRY_RUN" = false ]; then
    echo "$GITIGNORE_ADDITIONS" >> .gitignore
    echo "  ✓ Updated .gitignore"
fi

echo ""
echo "🎉 Done! Run 'git status' to see changes."
