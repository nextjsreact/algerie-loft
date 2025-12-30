"use client"

import React from 'react';
import { useSuperuserAuth } from '@/contexts/SuperuserAuthContext';
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth';

/**
 * Composant de test pour vérifier le système d'authentification superuser
 */
export function SuperuserAuthTest() {
  const superuserAuth = useSuperuserAuth();
  const enhancedAuth = useEnhancedAuth();

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Test Authentification Superuser</h2>
      
      {/* État de l'authentification */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">État d'authentification</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded">
            <strong>Enhanced Auth:</strong>
            <ul className="mt-2 text-sm">
              <li>Authentifié: {enhancedAuth.isAuthenticated ? '✅' : '❌'}</li>
              <li>Superuser: {enhancedAuth.isSuperuser ? '✅' : '❌'}</li>
              <li>Rôle: {enhancedAuth.userRole || 'N/A'}</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded">
            <strong>Superuser Auth:</strong>
            <ul className="mt-2 text-sm">
              <li>Authentifié: {superuserAuth.isAuthenticated ? '✅' : '❌'}</li>
              <li>Superuser: {superuserAuth.isSuperuser ? '✅' : '❌'}</li>
              <li>Permissions: {superuserAuth.permissions.length}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permissions */}
      {enhancedAuth.isSuperuser && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Permissions Superuser</h3>
          <div className="bg-white p-3 rounded">
            {enhancedAuth.permissions.length > 0 ? (
              <ul className="text-sm">
                {enhancedAuth.permissions.map(perm => (
                  <li key={perm} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {perm}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Aucune permission</p>
            )}
          </div>
        </div>
      )}

      {/* Tests de permissions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Tests de Permissions</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white p-2 rounded">
            Gestion utilisateurs: {enhancedAuth.hasPermission('USER_MANAGEMENT') ? '✅' : '❌'}
          </div>
          <div className="bg-white p-2 rounded">
            Gestion sauvegardes: {enhancedAuth.hasPermission('BACKUP_MANAGEMENT') ? '✅' : '❌'}
          </div>
        </div>
      </div>
    </div>
  );
}