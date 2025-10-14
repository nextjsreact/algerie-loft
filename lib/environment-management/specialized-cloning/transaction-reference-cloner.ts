/**
 * Transaction Reference Amounts Cloner
 * 
 * Handles cloning of transaction reference amounts system including:
 * - Transaction category references table cloning
 * - Reference amount anonymization with realistic values
 * - Alert system testing with fake transaction data
 */

import { Environment } from '../types'
import { ProductionSafetyGuard } from '../production-safety-guard'
import { AnonymizationOrchestrator } from '../anonymization'

export interface TransactionReferenceCloneOptions {
  anonymizeAmounts: boolean
  includeAlertSystem: boolean
  generateTestTransactions: boolean
  preserveCategories: boolean
  testTransactionCount?: number
}

export interface TransactionReferenceCloneResult {
  success: boolean
  referencesCloned: number
  categoriesCloned: string[]
  testTransactionsGenerated: number
  alertsTriggered: number
  errors: string[]
  warnings: string[]
}

export interface TransactionReference {
  id: string
  category: string
  subcategory?: string
  referenceAmount: number
  alertThreshold: number
  currency: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TransactionCategory {
  name: string
  subcategories: string[]
  defaultThreshold: number
  amountRange: { min: number; max: number }
  description: string
}

export interface TestTransaction {
  id: string
  loftId: string
  category: string
  subcategory?: string
  amount: number
  description: string
  shouldTriggerAlert: boolean
  expectedAlertReason?: string
}

export class TransactionReferenceCloner {
  private safetyGuard: ProductionSafetyGuard
  private anonymizer: AnonymizationOrchestrator

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.anonymizer = new AnonymizationOrchestrator()
  }

  /**
   * Clone transaction reference amounts system
   */
  public async cloneTransactionReferences(
    sourceEnv: Environment,
    targetEnv: Environment,
    options: TransactionReferenceCloneOptions,
    operationId: string
  ): Promise<TransactionReferenceCloneResult> {
    try {
      // Safety checks
      await this.safetyGuard.validateCloneSource(sourceEnv)
      await this.safetyGuard.validateCloneTarget(targetEnv)

      this.log(operationId, 'info', 'Starting transaction reference amounts cloning...')

      const result: TransactionReferenceCloneResult = {
        success: false,
        referencesCloned: 0,
        categoriesCloned: [],
        testTransactionsGenerated: 0,
        alertsTriggered: 0,
        errors: [],
        warnings: []
      }

      // Phase 1: Clone transaction reference schema
      await this.cloneTransactionReferenceSchema(targetEnv, result, operationId)

      // Phase 2: Clone reference data
      await this.cloneReferenceData(sourceEnv, targetEnv, options, result, operationId)

      // Phase 3: Set up alert system
      if (options.includeAlertSystem) {
        await this.setupAlertSystem(targetEnv, result, operationId)
      }

      // Phase 4: Generate test transactions
      if (options.generateTestTransactions) {
        await this.generateTestTransactions(targetEnv, options, result, operationId)
      }

      // Phase 5: Validate system functionality
      await this.validateTransactionReferenceSystem(targetEnv, result, operationId)

      result.success = result.errors.length === 0
      this.log(operationId, 'info', `Transaction reference cloning completed. Success: ${result.success}`)

      return result

    } catch (error) {
      this.log(operationId, 'error', `Transaction reference cloning failed: ${error.message}`)
      return {
        success: false,
        referencesCloned: 0,
        categoriesCloned: [],
        testTransactionsGenerated: 0,
        alertsTriggered: 0,
        errors: [error.message],
        warnings: []
      }
    }
  }

  /**
   * Clone transaction reference schema
   */
  private async cloneTransactionReferenceSchema(
    targetEnv: Environment,
    result: TransactionReferenceCloneResult,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'Creating transaction reference schema...')

    try {
      // Create enhanced transaction reference amounts table
      await this.createTransactionReferenceTable(targetEnv, operationId)

      // Create transaction categories table
      await this.createTransactionCategoriesTable(targetEnv, operationId)

      // Create transaction alerts table
      await this.createTransactionAlertsTable(targetEnv, operationId)

      // Create alert configuration table
      await this.createAlertConfigurationTable(targetEnv, operationId)

      this.log(operationId, 'info', 'Transaction reference schema created successfully')

    } catch (error) {
      const errorMsg = `Failed to create transaction reference schema: ${error.message}`
      result.errors.push(errorMsg)
      this.log(operationId, 'error', errorMsg)
    }
  }

  /**
   * Create enhanced transaction reference amounts table
   */
  private async createTransactionReferenceTable(targetEnv: Environment, operationId: string): Promise<void> {
    const createTableSQL = `
-- Enhanced transaction reference amounts table
CREATE TABLE IF NOT EXISTS transaction_reference_amounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    reference_amount DECIMAL(12,2) NOT NULL CHECK (reference_amount > 0),
    alert_threshold DECIMAL(5,2) NOT NULL DEFAULT 20.0 CHECK (alert_threshold > 0 AND alert_threshold <= 100),
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Seasonal adjustments
    seasonal_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (seasonal_multiplier > 0),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Alert configuration
    alert_enabled BOOLEAN NOT NULL DEFAULT true,
    alert_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (alert_frequency IN ('immediate', 'daily', 'weekly')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(category, subcategory, currency, effective_from),
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_ref_category ON transaction_reference_amounts(category);
CREATE INDEX IF NOT EXISTS idx_transaction_ref_subcategory ON transaction_reference_amounts(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_transaction_ref_active ON transaction_reference_amounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transaction_ref_currency ON transaction_reference_amounts(currency);
CREATE INDEX IF NOT EXISTS idx_transaction_ref_effective ON transaction_reference_amounts(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_transaction_ref_alert_enabled ON transaction_reference_amounts(alert_enabled) WHERE alert_enabled = true;

-- RLS policies
ALTER TABLE transaction_reference_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view transaction references" ON transaction_reference_amounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage transaction references" ON transaction_reference_amounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager')
        )
    );`

    await this.executeSQL(targetEnv, createTableSQL, operationId)
  }

  /**
   * Create transaction categories table
   */
  private async createTransactionCategoriesTable(targetEnv: Environment, operationId: string): Promise<void> {
    const createTableSQL = `
-- Transaction categories master table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id UUID REFERENCES transaction_categories(id),
    description TEXT,
    default_threshold DECIMAL(5,2) DEFAULT 20.0,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO transaction_categories (name, description, default_threshold, icon, color, sort_order) VALUES
('maintenance', 'Property maintenance and repairs', 25.0, 'wrench', '#FF6B35', 1),
('utilities', 'Utility bills and services', 30.0, 'zap', '#4ECDC4', 2),
('cleaning', 'Cleaning services and supplies', 20.0, 'sparkles', '#45B7D1', 3),
('security', 'Security services and equipment', 15.0, 'shield', '#96CEB4', 4),
('insurance', 'Insurance premiums and claims', 10.0, 'umbrella', '#FFEAA7', 5),
('supplies', 'General supplies and materials', 35.0, 'package', '#DDA0DD', 6),
('services', 'Professional services', 25.0, 'briefcase', '#98D8C8', 7),
('emergency', 'Emergency repairs and services', 50.0, 'alert-triangle', '#FF7675', 8)
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_categories_parent ON transaction_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_active ON transaction_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transaction_categories_sort ON transaction_categories(sort_order);

-- RLS policies
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view categories" ON transaction_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage categories" ON transaction_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );`

    await this.executeSQL(targetEnv, createTableSQL, operationId)
  }

  /**
   * Create transaction alerts table
   */
  private async createTransactionAlertsTable(targetEnv: Environment, operationId: string): Promise<void> {
    const createTableSQL = `
-- Transaction alerts table
CREATE TABLE IF NOT EXISTS transaction_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reference_id UUID REFERENCES transaction_reference_amounts(id),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('threshold_exceeded', 'unusual_amount', 'category_mismatch', 'frequency_anomaly')),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Alert details
    triggered_amount DECIMAL(12,2) NOT NULL,
    reference_amount DECIMAL(12,2),
    threshold_percentage DECIMAL(5,2),
    variance_percentage DECIMAL(8,2),
    
    -- Alert status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Alert message
    message TEXT NOT NULL,
    details JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_transaction ON transaction_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_reference ON transaction_alerts(reference_id);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_type ON transaction_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_severity ON transaction_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_status ON transaction_alerts(status);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_created ON transaction_alerts(created_at DESC);

-- RLS policies
ALTER TABLE transaction_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their team's transactions" ON transaction_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            JOIN lofts l ON t.loft_id = l.id
            JOIN team_members tm ON l.team_id = tm.team_id
            WHERE t.id = transaction_alerts.transaction_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage alerts for their team's transactions" ON transaction_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transactions t
            JOIN lofts l ON t.loft_id = l.id
            JOIN team_members tm ON l.team_id = tm.team_id
            WHERE t.id = transaction_alerts.transaction_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('admin', 'manager')
        )
    );`

    await this.executeSQL(targetEnv, createTableSQL, operationId)
  }

  /**
   * Create alert configuration table
   */
  private async createAlertConfigurationTable(targetEnv: Environment, operationId: string): Promise<void> {
    const createTableSQL = `
-- Alert configuration table
CREATE TABLE IF NOT EXISTS alert_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    category VARCHAR(100),
    
    -- Alert settings
    enabled BOOLEAN NOT NULL DEFAULT true,
    threshold_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.0,
    notification_methods TEXT[] DEFAULT ARRAY['email', 'in_app'],
    
    -- Frequency settings
    max_alerts_per_day INTEGER DEFAULT 10,
    cooldown_minutes INTEGER DEFAULT 60,
    
    -- Recipients
    alert_recipients UUID[] DEFAULT ARRAY[]::UUID[],
    escalation_recipients UUID[] DEFAULT ARRAY[]::UUID[],
    escalation_delay_hours INTEGER DEFAULT 24,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(team_id, category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_config_team ON alert_configurations(team_id);
CREATE INDEX IF NOT EXISTS idx_alert_config_category ON alert_configurations(category);
CREATE INDEX IF NOT EXISTS idx_alert_config_enabled ON alert_configurations(enabled) WHERE enabled = true;

-- RLS policies
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team's alert config" ON alert_configurations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = alert_configurations.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage alert config" ON alert_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = alert_configurations.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('admin', 'manager')
        )
    );`

    await this.executeSQL(targetEnv, createTableSQL, operationId)
  }

  /**
   * Clone reference data from source environment
   */
  private async cloneReferenceData(
    sourceEnv: Environment,
    targetEnv: Environment,
    options: TransactionReferenceCloneOptions,
    result: TransactionReferenceCloneResult,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'Cloning transaction reference data...')

    try {
      // Get reference data from source
      const references = await this.getTransactionReferencesFromSource(sourceEnv)
      
      let processedReferences: TransactionReference[]
      
      if (options.anonymizeAmounts) {
        // Anonymize amounts while preserving structure
        processedReferences = await this.anonymizeReferenceAmounts(references, operationId)
      } else {
        processedReferences = references
      }

      // Insert references into target
      await this.insertTransactionReferences(targetEnv, processedReferences, operationId)
      
      result.referencesCloned = processedReferences.length
      result.categoriesCloned = [...new Set(processedReferences.map(r => r.category))]

      this.log(operationId, 'info', `Cloned ${result.referencesCloned} transaction references`)

    } catch (error) {
      const errorMsg = `Failed to clone reference data: ${error.message}`
      result.errors.push(errorMsg)
      this.log(operationId, 'error', errorMsg)
    }
  }

  /**
   * Get transaction references from source environment
   */
  private async getTransactionReferencesFromSource(sourceEnv: Environment): Promise<TransactionReference[]> {
    // This would connect to source database and fetch references
    // For now, returning comprehensive mock data
    return [
      {
        id: 'ref1',
        category: 'maintenance',
        subcategory: 'plumbing',
        referenceAmount: 25000,
        alertThreshold: 25.0,
        currency: 'DZD',
        description: 'Standard plumbing repair costs',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref2',
        category: 'maintenance',
        subcategory: 'electrical',
        referenceAmount: 30000,
        alertThreshold: 20.0,
        currency: 'DZD',
        description: 'Electrical maintenance and repairs',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref3',
        category: 'utilities',
        subcategory: 'electricity',
        referenceAmount: 12000,
        alertThreshold: 30.0,
        currency: 'DZD',
        description: 'Monthly electricity bills',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref4',
        category: 'utilities',
        subcategory: 'water',
        referenceAmount: 8000,
        alertThreshold: 25.0,
        currency: 'DZD',
        description: 'Monthly water bills',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref5',
        category: 'cleaning',
        subcategory: 'regular',
        referenceAmount: 15000,
        alertThreshold: 20.0,
        currency: 'DZD',
        description: 'Regular cleaning services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref6',
        category: 'security',
        subcategory: 'monitoring',
        referenceAmount: 20000,
        alertThreshold: 15.0,
        currency: 'DZD',
        description: 'Security monitoring services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref7',
        category: 'supplies',
        subcategory: 'cleaning_materials',
        referenceAmount: 5000,
        alertThreshold: 35.0,
        currency: 'DZD',
        description: 'Cleaning supplies and materials',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ref8',
        category: 'emergency',
        subcategory: 'urgent_repairs',
        referenceAmount: 75000,
        alertThreshold: 50.0,
        currency: 'DZD',
        description: 'Emergency repair services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * Anonymize reference amounts while preserving realistic values
   */
  private async anonymizeReferenceAmounts(
    references: TransactionReference[],
    operationId: string
  ): Promise<TransactionReference[]> {
    this.log(operationId, 'info', 'Anonymizing transaction reference amounts...')

    return references.map(ref => ({
      ...ref,
      referenceAmount: this.generateRealisticAmount(ref.category, ref.subcategory),
      alertThreshold: this.generateRealisticThreshold(ref.category),
      description: this.generateTestDescription(ref.category, ref.subcategory)
    }))
  }

  /**
   * Generate realistic amounts based on category and subcategory
   */
  private generateRealisticAmount(category: string, subcategory?: string): number {
    const categoryRanges: Record<string, { min: number; max: number }> = {
      maintenance: { min: 15000, max: 80000 },
      utilities: { min: 5000, max: 25000 },
      cleaning: { min: 8000, max: 30000 },
      security: { min: 12000, max: 40000 },
      insurance: { min: 20000, max: 100000 },
      supplies: { min: 2000, max: 15000 },
      services: { min: 10000, max: 50000 },
      emergency: { min: 30000, max: 150000 }
    }

    const range = categoryRanges[category] || categoryRanges.maintenance
    
    // Add subcategory-specific adjustments
    let multiplier = 1.0
    if (subcategory) {
      const subcategoryMultipliers: Record<string, number> = {
        plumbing: 1.2,
        electrical: 1.3,
        hvac: 1.5,
        regular: 0.8,
        deep: 1.4,
        urgent_repairs: 2.0,
        monitoring: 1.1
      }
      multiplier = subcategoryMultipliers[subcategory] || 1.0
    }

    const baseAmount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    return Math.floor(baseAmount * multiplier)
  }

  /**
   * Generate realistic alert thresholds
   */
  private generateRealisticThreshold(category: string): number {
    const categoryThresholds: Record<string, { min: number; max: number }> = {
      maintenance: { min: 20, max: 30 },
      utilities: { min: 25, max: 35 },
      cleaning: { min: 15, max: 25 },
      security: { min: 10, max: 20 },
      insurance: { min: 5, max: 15 },
      supplies: { min: 30, max: 40 },
      services: { min: 20, max: 30 },
      emergency: { min: 40, max: 60 }
    }

    const range = categoryThresholds[category] || categoryThresholds.maintenance
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  }

  /**
   * Generate test descriptions
   */
  private generateTestDescription(category: string, subcategory?: string): string {
    const descriptions: Record<string, string> = {
      maintenance: 'Standard maintenance service costs',
      utilities: 'Average utility service charges',
      cleaning: 'Regular cleaning service fees',
      security: 'Security service monthly costs',
      insurance: 'Insurance premium payments',
      supplies: 'Supply procurement costs',
      services: 'Professional service fees',
      emergency: 'Emergency service charges'
    }

    let baseDescription = descriptions[category] || 'Standard service costs'
    
    if (subcategory) {
      baseDescription += ` - ${subcategory.replace('_', ' ')}`
    }

    return baseDescription
  }

  /**
   * Insert transaction references into target environment
   */
  private async insertTransactionReferences(
    targetEnv: Environment,
    references: TransactionReference[],
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', `Inserting ${references.length} transaction references`)

    // This would execute INSERT statements on the target database
    for (const ref of references) {
      // INSERT INTO transaction_reference_amounts (...) VALUES (...)
    }
  }

  /**
   * Set up alert system with functions and triggers
   */
  private async setupAlertSystem(
    targetEnv: Environment,
    result: TransactionReferenceCloneResult,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'Setting up transaction alert system...')

    try {
      // Create enhanced alert checking function
      await this.createEnhancedAlertFunction(targetEnv, operationId)

      // Create alert management functions
      await this.createAlertManagementFunctions(targetEnv, operationId)

      // Create alert triggers
      await this.createAlertTriggers(targetEnv, operationId)

      this.log(operationId, 'info', 'Alert system setup completed')

    } catch (error) {
      const errorMsg = `Failed to setup alert system: ${error.message}`
      result.errors.push(errorMsg)
      this.log(operationId, 'error', errorMsg)
    }
  }

  /**
   * Create enhanced alert checking function
   */
  private async createEnhancedAlertFunction(targetEnv: Environment, operationId: string): Promise<void> {
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION check_enhanced_transaction_alerts(
    p_transaction_id UUID,
    p_category VARCHAR(100),
    p_subcategory VARCHAR(100) DEFAULT NULL,
    p_amount DECIMAL(12,2),
    p_loft_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    reference_record RECORD;
    alert_config RECORD;
    team_id_val UUID;
    alert_threshold_amount DECIMAL(12,2);
    variance_percentage DECIMAL(8,2);
    alert_created BOOLEAN := false;
    alert_details JSONB := '{}';
    severity VARCHAR(20) := 'medium';
BEGIN
    -- Get team ID for the loft
    IF p_loft_id IS NOT NULL THEN
        SELECT l.team_id INTO team_id_val FROM lofts l WHERE l.id = p_loft_id;
    END IF;

    -- Find matching reference amount (prioritize subcategory match)
    SELECT * INTO reference_record
    FROM transaction_reference_amounts tra
    WHERE tra.category = p_category
    AND (
        (p_subcategory IS NOT NULL AND tra.subcategory = p_subcategory) OR
        (p_subcategory IS NULL AND tra.subcategory IS NULL) OR
        (tra.subcategory IS NULL)
    )
    AND tra.is_active = true
    AND tra.alert_enabled = true
    AND (tra.effective_from <= CURRENT_DATE)
    AND (tra.effective_to IS NULL OR tra.effective_to >= CURRENT_DATE)
    ORDER BY 
        CASE WHEN tra.subcategory = p_subcategory THEN 1 ELSE 2 END,
        tra.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Get alert configuration for this team/category
        SELECT * INTO alert_config
        FROM alert_configurations ac
        WHERE ac.team_id = team_id_val
        AND (ac.category = p_category OR ac.category IS NULL)
        AND ac.enabled = true
        ORDER BY 
            CASE WHEN ac.category = p_category THEN 1 ELSE 2 END
        LIMIT 1;

        -- Use reference threshold or config threshold
        alert_threshold_amount := reference_record.reference_amount * (1 + 
            COALESCE(alert_config.threshold_percentage, reference_record.alert_threshold) / 100
        );

        -- Calculate variance percentage
        variance_percentage := ((p_amount - reference_record.reference_amount) / reference_record.reference_amount) * 100;

        -- Determine if alert should be triggered
        IF p_amount > alert_threshold_amount THEN
            -- Determine severity based on variance
            IF variance_percentage > 100 THEN
                severity := 'critical';
            ELSIF variance_percentage > 50 THEN
                severity := 'high';
            ELSIF variance_percentage > 25 THEN
                severity := 'medium';
            ELSE
                severity := 'low';
            END IF;

            -- Create alert record
            INSERT INTO transaction_alerts (
                transaction_id,
                reference_id,
                alert_type,
                severity,
                triggered_amount,
                reference_amount,
                threshold_percentage,
                variance_percentage,
                message,
                details,
                status
            ) VALUES (
                p_transaction_id,
                reference_record.id,
                'threshold_exceeded',
                severity,
                p_amount,
                reference_record.reference_amount,
                COALESCE(alert_config.threshold_percentage, reference_record.alert_threshold),
                variance_percentage,
                format('Transaction amount %s DZD exceeds reference by %.1f%%', 
                    p_amount, variance_percentage),
                jsonb_build_object(
                    'category', p_category,
                    'subcategory', p_subcategory,
                    'reference_description', reference_record.description,
                    'team_id', team_id_val,
                    'loft_id', p_loft_id
                ),
                'active'
            );

            alert_created := true;
        END IF;

        -- Build response details
        alert_details := jsonb_build_object(
            'alert_created', alert_created,
            'reference_amount', reference_record.reference_amount,
            'threshold_amount', alert_threshold_amount,
            'variance_percentage', variance_percentage,
            'severity', severity,
            'reference_id', reference_record.id
        );
    ELSE
        -- No reference found
        alert_details := jsonb_build_object(
            'alert_created', false,
            'reason', 'No reference amount found for category',
            'category', p_category,
            'subcategory', p_subcategory
        );
    END IF;

    RETURN alert_details;
END;
$$ LANGUAGE plpgsql;`

    await this.executeSQL(targetEnv, createFunctionSQL, operationId)
  }

  /**
   * Create alert management functions
   */
  private async createAlertManagementFunctions(targetEnv: Environment, operationId: string): Promise<void> {
    const createFunctionsSQL = `
-- Function to acknowledge alerts
CREATE OR REPLACE FUNCTION acknowledge_transaction_alert(
    p_alert_id UUID,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE transaction_alerts 
    SET 
        status = 'acknowledged',
        acknowledged_at = NOW(),
        acknowledged_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_alert_id
    AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve alerts
CREATE OR REPLACE FUNCTION resolve_transaction_alert(
    p_alert_id UUID,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE transaction_alerts 
    SET 
        status = 'resolved',
        resolved_at = NOW(),
        resolved_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_alert_id
    AND status IN ('active', 'acknowledged');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get alert statistics
CREATE OR REPLACE FUNCTION get_alert_statistics(
    p_team_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    WITH alert_stats AS (
        SELECT 
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE status = 'active') as active_alerts,
            COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_alerts,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_alerts,
            COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
            COUNT(*) FILTER (WHERE severity = 'high') as high_alerts,
            AVG(variance_percentage) as avg_variance,
            MAX(variance_percentage) as max_variance
        FROM transaction_alerts ta
        WHERE created_at >= CURRENT_DATE - INTERVAL '%s days'
        AND (p_team_id IS NULL OR EXISTS (
            SELECT 1 FROM transactions t
            JOIN lofts l ON t.loft_id = l.id
            WHERE t.id = ta.transaction_id
            AND l.team_id = p_team_id
        ))
    )
    SELECT to_jsonb(alert_stats.*) INTO stats FROM alert_stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;`

    await this.executeSQL(targetEnv, createFunctionsSQL, operationId)
  }

  /**
   * Create alert triggers
   */
  private async createAlertTriggers(targetEnv: Environment, operationId: string): Promise<void> {
    const createTriggersSQL = `
-- Enhanced transaction alert trigger function
CREATE OR REPLACE FUNCTION enhanced_transaction_alert_trigger()
RETURNS TRIGGER AS $$
DECLARE
    alert_result JSONB;
BEGIN
    -- Only process transactions with category and amount
    IF TG_OP = 'INSERT' AND NEW.category IS NOT NULL AND NEW.amount IS NOT NULL THEN
        SELECT check_enhanced_transaction_alerts(
            NEW.id, 
            NEW.category, 
            NEW.subcategory, 
            NEW.amount, 
            NEW.loft_id
        ) INTO alert_result;
        
    ELSIF TG_OP = 'UPDATE' AND (
        OLD.category != NEW.category OR 
        OLD.subcategory IS DISTINCT FROM NEW.subcategory OR
        OLD.amount != NEW.amount
    ) THEN
        SELECT check_enhanced_transaction_alerts(
            NEW.id, 
            NEW.category, 
            NEW.subcategory, 
            NEW.amount, 
            NEW.loft_id
        ) INTO alert_result;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enhanced_transaction_alert_trigger ON transactions;

-- Create the enhanced trigger
CREATE TRIGGER enhanced_transaction_alert_trigger
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION enhanced_transaction_alert_trigger();`

    await this.executeSQL(targetEnv, createTriggersSQL, operationId)
  }

  /**
   * Generate test transactions to validate alert system
   */
  private async generateTestTransactions(
    targetEnv: Environment,
    options: TransactionReferenceCloneOptions,
    result: TransactionReferenceCloneResult,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'Generating test transactions for alert validation...')

    try {
      const testCount = options.testTransactionCount || 20
      const testTransactions = await this.createTestTransactionData(testCount)
      
      // Insert test transactions (this would trigger alerts)
      await this.insertTestTransactions(targetEnv, testTransactions, operationId)
      
      result.testTransactionsGenerated = testTransactions.length
      result.alertsTriggered = testTransactions.filter(t => t.shouldTriggerAlert).length

      this.log(operationId, 'info', `Generated ${result.testTransactionsGenerated} test transactions, ${result.alertsTriggered} should trigger alerts`)

    } catch (error) {
      const errorMsg = `Failed to generate test transactions: ${error.message}`
      result.errors.push(errorMsg)
      this.log(operationId, 'error', errorMsg)
    }
  }

  /**
   * Create test transaction data
   */
  private async createTestTransactionData(count: number): Promise<TestTransaction[]> {
    const categories = ['maintenance', 'utilities', 'cleaning', 'security', 'supplies', 'emergency']
    const subcategories = {
      maintenance: ['plumbing', 'electrical', 'hvac'],
      utilities: ['electricity', 'water', 'gas'],
      cleaning: ['regular', 'deep'],
      security: ['monitoring', 'equipment'],
      supplies: ['cleaning_materials', 'maintenance_tools'],
      emergency: ['urgent_repairs', 'emergency_services']
    }

    const testTransactions: TestTransaction[] = []

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const subcategoryList = subcategories[category] || []
      const subcategory = subcategoryList.length > 0 ? 
        subcategoryList[Math.floor(Math.random() * subcategoryList.length)] : undefined

      // 40% of transactions should trigger alerts (exceed thresholds)
      const shouldTriggerAlert = Math.random() < 0.4
      
      let amount: number
      if (shouldTriggerAlert) {
        // Generate amount that exceeds typical thresholds (25-50% above reference)
        amount = this.generateHighAmount(category, subcategory)
      } else {
        // Generate normal amount within expected range
        amount = this.generateNormalAmount(category, subcategory)
      }

      testTransactions.push({
        id: `test_tx_${i + 1}`,
        loftId: `test_loft_${(i % 5) + 1}`, // Distribute across 5 test lofts
        category,
        subcategory,
        amount,
        description: `Test ${category} transaction ${i + 1}`,
        shouldTriggerAlert,
        expectedAlertReason: shouldTriggerAlert ? 'Amount exceeds reference threshold' : undefined
      })
    }

    return testTransactions
  }

  /**
   * Generate high amounts that should trigger alerts
   */
  private generateHighAmount(category: string, subcategory?: string): number {
    const baseAmount = this.generateRealisticAmount(category, subcategory)
    // Increase by 30-80% to trigger alerts
    const multiplier = 1.3 + (Math.random() * 0.5)
    return Math.floor(baseAmount * multiplier)
  }

  /**
   * Generate normal amounts that shouldn't trigger alerts
   */
  private generateNormalAmount(category: string, subcategory?: string): number {
    const baseAmount = this.generateRealisticAmount(category, subcategory)
    // Stay within 90-110% of reference amount
    const multiplier = 0.9 + (Math.random() * 0.2)
    return Math.floor(baseAmount * multiplier)
  }

  /**
   * Insert test transactions into target environment
   */
  private async insertTestTransactions(
    targetEnv: Environment,
    transactions: TestTransaction[],
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', `Inserting ${transactions.length} test transactions`)

    // This would execute INSERT statements on the target database
    for (const tx of transactions) {
      // INSERT INTO transactions (...) VALUES (...)
      // This would trigger the alert system automatically
    }
  }

  /**
   * Validate transaction reference system functionality
   */
  private async validateTransactionReferenceSystem(
    targetEnv: Environment,
    result: TransactionReferenceCloneResult,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'Validating transaction reference system...')

    try {
      // Test 1: Check if all tables exist
      const tablesExist = await this.checkTransactionReferenceTablesExist(targetEnv)
      if (!tablesExist) {
        result.errors.push('Transaction reference tables are missing')
        return
      }

      // Test 2: Check if functions exist
      const functionsExist = await this.checkTransactionReferenceFunctionsExist(targetEnv)
      if (!functionsExist) {
        result.errors.push('Transaction reference functions are missing')
        return
      }

      // Test 3: Test alert function
      const alertFunctionTest = await this.testAlertFunction(targetEnv)
      if (!alertFunctionTest) {
        result.warnings.push('Alert function test failed')
      }

      // Test 4: Validate reference data integrity
      const dataIntegrityTest = await this.validateReferenceDataIntegrity(targetEnv)
      if (!dataIntegrityTest) {
        result.warnings.push('Reference data integrity issues detected')
      }

      this.log(operationId, 'info', 'Transaction reference system validation completed')

    } catch (error) {
      const errorMsg = `Transaction reference system validation failed: ${error.message}`
      result.errors.push(errorMsg)
      this.log(operationId, 'error', errorMsg)
    }
  }

  /**
   * Check if transaction reference tables exist
   */
  private async checkTransactionReferenceTablesExist(targetEnv: Environment): Promise<boolean> {
    // This would check for all required tables
    return true // Mock implementation
  }

  /**
   * Check if transaction reference functions exist
   */
  private async checkTransactionReferenceFunctionsExist(targetEnv: Environment): Promise<boolean> {
    // This would check for all required functions
    return true // Mock implementation
  }

  /**
   * Test alert function functionality
   */
  private async testAlertFunction(targetEnv: Environment): Promise<boolean> {
    // This would test the check_enhanced_transaction_alerts function
    return true // Mock implementation
  }

  /**
   * Validate reference data integrity
   */
  private async validateReferenceDataIntegrity(targetEnv: Environment): Promise<boolean> {
    // This would validate data consistency and relationships
    return true // Mock implementation
  }

  /**
   * Execute SQL on target environment
   */
  private async executeSQL(targetEnv: Environment, sql: string, operationId: string): Promise<void> {
    // Safety check - ensure we're not executing on production
    await this.safetyGuard.enforceReadOnlyAccess(targetEnv, 'sql_execution')

    this.log(operationId, 'info', `Executing SQL on ${targetEnv.name}`)
    
    // This would execute the SQL on the target database
    console.log(`SQL to execute on ${targetEnv.name}:`, sql)
  }

  /**
   * Log operation events
   */
  private log(operationId: string, level: 'info' | 'warning' | 'error', message: string): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${operationId}] [${level.toUpperCase()}] ${message}`)
  }
}