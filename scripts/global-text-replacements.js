#!/usr/bin/env node

// Script pour corriger automatiquement les textes en dur les plus courants

import fs from 'fs';
import path from 'path';

const replacements = {
  '"Disponible"': 't("available")',
  '"Type de propriété"': 't("propertyType")',
  '"Description"': 't("description")',
  '"Propriétaire"': 't("owner")',
  '"الهاتف"': 't("phone")',
  '"المياه"': 't("water")',
  '"الكهرباء"': 't("electricity")',
  '"الغاز"': 't("gas")',
  '"الإنترنت"': 't("internet")',
  '"معرض الصور"': 't("photoGallery")',
  '"معلومات إضافية"': 't("additionalInfo")',
  '"تم الإنشاء في"': 't("createdOn")',
  '"آخر تحديث"': 't("lastUpdated")',
  '"إدارة الفواتير"': 't("billManagement")',
  '"غير محدد"': 't("undefined")',
  '"الفواتير القادمة"': 't("upcomingBills")'
};

// Cette fonction pourrait être utilisée pour corriger automatiquement les fichiers
// Mais il faut faire attention au contexte et aux namespaces
console.log('Remplacements suggérés:');
Object.entries(replacements).forEach(([old, new_]) => {
  console.log(`  ${old} → ${new_}`);
});
