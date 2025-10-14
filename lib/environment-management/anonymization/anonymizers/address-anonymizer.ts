/**
 * Address anonymization implementation
 */

import { BaseAnonymizer } from './base-anonymizer';
import { AnonymizationRule, AnonymizationContext } from '../types';

export class AddressAnonymizer extends BaseAnonymizer {
  private readonly algerianCities = [
    'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif',
    'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El Oued', 'Skikda', 'Tiaret', 'Béjaïa',
    'Tlemcen', 'Ouargla', 'Mostaganem', 'Bordj Bou Arréridj', 'Chlef', 'Médéa',
    'El Tarf', 'Relizane', 'Mascara', 'Ouled Djellal', 'Khenchela', 'Souk Ahras',
    'El Bayadh', 'Ghardaïa'
  ];

  private readonly streetTypes = [
    'Rue', 'Avenue', 'Boulevard', 'Place', 'Impasse', 'Allée', 'Chemin', 'Route'
  ];

  private readonly streetNames = [
    '1er Novembre', 'Didouche Mourad', 'Larbi Ben M\'hidi', 'Emir Abdelkader',
    'Ahmed Zabana', 'Hassiba Ben Bouali', 'Colonel Amirouche', 'Frantz Fanon',
    'Abane Ramdane', 'Krim Belkacem', 'Ben Bella', 'Boumediene', 'Soummam',
    'ALN', 'FLN', 'Martyrs', 'Indépendance', 'République', 'Liberté', 'Paix'
  ];

  private readonly neighborhoods = [
    'Centre-ville', 'Hydra', 'El Biar', 'Kouba', 'Bir Mourad Raïs', 'Dély Ibrahim',
    'Cheraga', 'Draria', 'El Achour', 'Ouled Fayet', 'Saoula', 'Baraki',
    'Hussein Dey', 'El Harrach', 'Rouiba', 'Reghaia', 'Bordj El Kiffan'
  ];

  anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      return value;
    }

    const originalAddress = value.trim();
    
    if (rule.preserveFormat) {
      return this.preserveAddressStructure(originalAddress, context);
    }

    // Generate completely new address
    return this.generateRandomAddress(originalAddress, context);
  }

  private preserveAddressStructure(originalAddress: string, context: AnonymizationContext): string {
    // Try to detect address components
    const components = this.parseAddressComponents(originalAddress);
    
    return this.generateStructuredAddress(components, context);
  }

  private parseAddressComponents(address: string): {
    hasNumber: boolean;
    hasStreetType: boolean;
    hasCity: boolean;
    hasPostalCode: boolean;
    structure: string;
  } {
    const hasNumber = /^\d+/.test(address.trim());
    const hasStreetType = this.streetTypes.some(type => 
      address.toLowerCase().includes(type.toLowerCase())
    );
    const hasCity = this.algerianCities.some(city => 
      address.toLowerCase().includes(city.toLowerCase())
    );
    const hasPostalCode = /\d{5}/.test(address);

    return {
      hasNumber,
      hasStreetType,
      hasCity,
      hasPostalCode,
      structure: address
    };
  }

  private generateStructuredAddress(
    components: ReturnType<typeof this.parseAddressComponents>,
    context: AnonymizationContext
  ): string {
    const hash = this.generateHash(components.structure, context.tableName);
    let address = '';

    // Generate number if original had one
    if (components.hasNumber) {
      const number = (parseInt(hash.slice(0, 2), 36) % 999) + 1;
      address += `${number} `;
    }

    // Generate street
    const streetTypeIndex = parseInt(hash.slice(2, 3), 36) % this.streetTypes.length;
    const streetNameIndex = parseInt(hash.slice(3, 4), 36) % this.streetNames.length;
    
    address += `${this.streetTypes[streetTypeIndex]} ${this.streetNames[streetNameIndex]}`;

    // Add neighborhood if structure suggests it
    if (components.structure.includes(',') || components.structure.length > 30) {
      const neighborhoodIndex = parseInt(hash.slice(4, 5), 36) % this.neighborhoods.length;
      address += `, ${this.neighborhoods[neighborhoodIndex]}`;
    }

    // Add city if original had one
    if (components.hasCity) {
      const cityIndex = parseInt(hash.slice(5, 6), 36) % this.algerianCities.length;
      address += `, ${this.algerianCities[cityIndex]}`;
    }

    // Add postal code if original had one
    if (components.hasPostalCode) {
      const postalCode = this.generatePostalCode(hash);
      address += ` ${postalCode}`;
    }

    return address;
  }

  private generateRandomAddress(originalAddress: string, context: AnonymizationContext): string {
    const hash = this.generateHash(originalAddress, context.tableName);
    
    // Generate basic address components
    const number = (parseInt(hash.slice(0, 2), 36) % 999) + 1;
    const streetTypeIndex = parseInt(hash.slice(2, 3), 36) % this.streetTypes.length;
    const streetNameIndex = parseInt(hash.slice(3, 4), 36) % this.streetNames.length;
    const cityIndex = parseInt(hash.slice(5, 6), 36) % this.algerianCities.length;

    return `${number} ${this.streetTypes[streetTypeIndex]} ${this.streetNames[streetNameIndex]}, ${this.algerianCities[cityIndex]}`;
  }

  private generatePostalCode(hash: string): string {
    // Algerian postal codes are 5 digits
    const code = parseInt(hash.slice(0, 5), 36) % 99999;
    return code.toString().padStart(5, '0');
  }

  /**
   * Generate address for specific roles or contexts
   */
  generateRoleAddress(role: string, index: number = 0): string {
    const baseAddresses = {
      admin: '1 Rue de l\'Administration, Centre-ville, Alger',
      manager: '15 Avenue des Managers, Hydra, Alger',
      member: '25 Rue des Employés, Kouba, Alger',
      guest: '10 Boulevard des Visiteurs, El Biar, Alger'
    };

    let address = baseAddresses[role as keyof typeof baseAddresses] || baseAddresses.member;
    
    // Modify number based on index
    if (index > 0) {
      const newNumber = (parseInt(address.split(' ')[0]) + index).toString();
      address = address.replace(/^\d+/, newNumber);
    }

    return address;
  }

  /**
   * Generate guest address for reservations
   */
  generateGuestAddress(guestName?: string, reservationId?: string): string {
    let seed = 'guest';
    
    if (guestName) {
      seed = guestName;
    } else if (reservationId) {
      seed = reservationId;
    }

    const hash = this.generateHash(seed, 'guest-address');
    const number = (parseInt(hash.slice(0, 2), 36) % 999) + 1;
    const streetTypeIndex = parseInt(hash.slice(2, 3), 36) % this.streetTypes.length;
    const streetNameIndex = parseInt(hash.slice(3, 4), 36) % this.streetNames.length;
    const cityIndex = parseInt(hash.slice(5, 6), 36) % this.algerianCities.length;

    return `${number} ${this.streetTypes[streetTypeIndex]} ${this.streetNames[streetNameIndex]}, ${this.algerianCities[cityIndex]}`;
  }

  /**
   * Anonymize specific address components
   */
  anonymizeCity(originalCity: string, context: AnonymizationContext): string {
    const hash = this.generateHash(originalCity, context.tableName);
    const cityIndex = parseInt(hash.slice(0, 2), 36) % this.algerianCities.length;
    return this.algerianCities[cityIndex];
  }

  anonymizeStreet(originalStreet: string, context: AnonymizationContext): string {
    const hash = this.generateHash(originalStreet, context.tableName);
    const streetTypeIndex = parseInt(hash.slice(0, 1), 36) % this.streetTypes.length;
    const streetNameIndex = parseInt(hash.slice(1, 2), 36) % this.streetNames.length;
    
    return `${this.streetTypes[streetTypeIndex]} ${this.streetNames[streetNameIndex]}`;
  }

  /**
   * Generate realistic Algerian address with proper formatting
   */
  generateRealisticAddress(seed?: string): string {
    const hash = this.generateHash(seed || Date.now().toString(), 'realistic');
    
    const number = (parseInt(hash.slice(0, 2), 36) % 999) + 1;
    const streetTypeIndex = parseInt(hash.slice(2, 3), 36) % this.streetTypes.length;
    const streetNameIndex = parseInt(hash.slice(3, 4), 36) % this.streetNames.length;
    const neighborhoodIndex = parseInt(hash.slice(4, 5), 36) % this.neighborhoods.length;
    const cityIndex = parseInt(hash.slice(5, 6), 36) % this.algerianCities.length;
    const postalCode = this.generatePostalCode(hash);

    return `${number} ${this.streetTypes[streetTypeIndex]} ${this.streetNames[streetNameIndex]}, ${this.neighborhoods[neighborhoodIndex]}, ${this.algerianCities[cityIndex]} ${postalCode}`;
  }
}