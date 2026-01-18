#!/bin/bash
# GitHub 푸시 스크립트
# 사용법: ./push.sh YOUR_PERSONAL_ACCESS_TOKEN

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "사용법: ./push.sh YOUR_PERSONAL_ACCESS_TOKEN"
    echo ""
    echo "Personal Access Token 생성:"
    echo "https://github.com/settings/tokens/new"
    echo ""
    echo "Scopes: repo 체크"
    exit 1
fi

TOKEN=$1
git remote set-url origin https://${TOKEN}@github.com/saida-iseo/saida_ai.git
git push origin main

# 보안을 위해 원래 URL로 복원
git remote set-url origin https://github.com/saida-iseo/saida_ai.git

echo ""
echo "✅ 푸시 완료!"
echo "확인: https://github.com/saida-iseo/saida_ai"
