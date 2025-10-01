@echo off
echo.
echo 🔍 DIAGNOSTIC AVANCE POSTGRESQL
echo =================================
echo.
echo Ce script va diagnostiquer en detail votre configuration PostgreSQL
echo et identifier les problemes d'authentification.
echo.

npx tsx diagnose-postgresql.ts

echo.
echo =================================
echo DIAGNOSTIC TERMINE
echo =================================
echo.
pause