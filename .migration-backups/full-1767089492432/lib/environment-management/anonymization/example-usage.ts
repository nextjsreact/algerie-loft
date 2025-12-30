/**
 * Example usage of the anonymization system
 */

import { 
  AnonymizationOrchestrator, 
  AnonymizationConfig, 
  RelationalData,
  ForeignKeyRelationship 
} from './index';

// Example usage of the anonymization system
export async function exampleAnonymization() {
  const orchestrator = new AnonymizationOrchestrator();

  // Sample data structure
  const sampleData: RelationalData[] = [
    {
      tableName: 'users',
      data: [
        { id: 1, email: 'john@example.com', full_name: 'John Doe', phone: '0551234567' },
        { id: 2, email: 'jane@example.com', full_name: 'Jane Smith', phone: '0661234567' }
      ],
      relationships: []
    },
    {
      tableName: 'lofts',
      data: [
        { id: 1, owner_id: 1, name: 'Beautiful Apartment', price_per_night: 15000 },
        { id: 2, owner_id: 2, name: 'Cozy Studio', price_per_night: 8000 }
      ],
      relationships: [
        { sourceTable: 'lofts', sourceColumn: 'owner_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' }
      ]
    },
    {
      tableName: 'reservations',
      data: [
        { id: 1, loft_id: 1, user_id: 2, guest_name: 'Alice Johnson', guest_email: 'alice@gmail.com', total_amount: 45000 },
        { id: 2, loft_id: 2, user_id: 1, guest_name: 'Bob Wilson', guest_email: 'bob@yahoo.com', total_amount: 24000 }
      ],
      relationships: [
        { sourceTable: 'reservations', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
        { sourceTable: 'reservations', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' }
      ]
    }
  ];

  // Configuration
  const config: AnonymizationConfig = {
    preserveRelationships: true,
    generateRealisticData: true,
    financialRanges: {
      'price': { min: 5000, max: 50000 },
      'amount': { min: 10000, max: 100000 }
    },
    excludeTables: [], // Don't exclude any tables
    excludeColumns: ['id'] // Don't anonymize primary keys
  };

  // Run anonymization
  const result = await orchestrator.anonymizeDataset(sampleData, config);

  console.log('Anonymization Result:', {
    success: result.success,
    processedTables: result.processedTables,
    duration: result.duration,
    relationshipStats: result.relationshipStats,
    errors: result.errors
  });

  // Print anonymized data
  for (const tableData of sampleData) {
    console.log(`\n${tableData.tableName}:`);
    console.table(tableData.data);
  }

  return result;
}

// Example of using individual components
export async function exampleIndividualComponents() {
  const { CoreAnonymizationEngine, FakeDataGenerator, RelationshipManager } = await import('./index');

  // Core engine example
  const coreEngine = new CoreAnonymizationEngine();
  const emailResult = await coreEngine.anonymizeValue(
    'user@example.com',
    {
      tableName: 'users',
      columnName: 'email',
      anonymizationType: 'email'
    },
    {
      tableName: 'users',
      columnName: 'email',
      originalValue: 'user@example.com',
      rowData: {},
      preserveRelationships: false
    }
  );
  console.log('Anonymized email:', emailResult.anonymizedValue);

  // Fake data generator example
  const fakeGenerator = new FakeDataGenerator();
  const fakePhone = fakeGenerator.generateFakeData(
    'string',
    '0551234567',
    {
      tableName: 'users',
      columnName: 'phone',
      originalValue: '0551234567',
      rowData: {},
      preserveRelationships: false
    },
    { contextAware: true }
  );
  console.log('Generated fake phone:', fakePhone);

  // Relationship manager example
  const relationshipManager = new RelationshipManager();
  const relationships: ForeignKeyRelationship[] = [
    { sourceTable: 'orders', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' }
  ];
  relationshipManager.registerRelationships(relationships);
  
  const mapping = relationshipManager.createIdMapping('users', 'id', [1, 2, 3, 4, 5]);
  console.log('ID mapping created:', mapping.size, 'mappings');
}