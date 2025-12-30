"use client"

import React from "react"
import { ThemeProvider } from "next-themes"
import SupabaseProvider from "./supabase-provider"
import AuthProvider from "./auth-provider"

interface SimpleProvidersProps {
  children: React.ReactNode;
}

export default function SimpleProviders({ children }: SimpleProvidersProps) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}