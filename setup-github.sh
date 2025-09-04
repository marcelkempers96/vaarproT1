#!/bin/bash

# VaarPro GitHub Setup Script
# This script helps you push your local repository to GitHub

echo "🚢 VaarPro GitHub Setup"
echo "======================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Get repository URL from user
echo "Please enter your GitHub repository URL:"
echo "Example: https://github.com/yourusername/vaarpro.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Repository URL is required."
    exit 1
fi

echo ""
echo "🔄 Setting up GitHub remote..."

# Add remote origin
git remote add origin "$REO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "✅ Remote origin set to: $REPO_URL"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Sign in with your GitHub account"
    echo "3. Click 'New Project'"
    echo "4. Import your vaarpro repository"
    echo "5. Click 'Deploy'"
    echo ""
    echo "Your VaarPro app will be live in minutes! ⚓🌊"
else
    echo ""
    echo "❌ Failed to push to GitHub. Please check:"
    echo "- Your repository URL is correct"
    echo "- You have push permissions to the repository"
    echo "- Your GitHub credentials are set up"
fi
