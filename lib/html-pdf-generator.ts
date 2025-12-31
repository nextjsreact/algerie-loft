/**
 * GÉNÉRATEUR DE RAPPORTS HTML-TO-PDF
 * ==================================
 * 
 * Alternative à jsPDF qui utilise la fonctionnalité d'impression du navigateur
 * pour générer des PDFs sans dépendances problématiques
 */

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface Transaction {
  id: string
  amount: number
  description: string
  transaction_type: 'income' | 'expense'
  category: string
  date: string
  loft_id?: string
  loft_name?: string
  owner_name?: string
  currency?: string
}

export interface Loft {
  id: string
  name: string
  address: string
  owner_name: string
  price_per_month: number
}

export interface Owner {
  id: string
  name: string
  email?: string
  phone?: string
  lofts_count: number
}

export interface ReportSummary {
  totalIncome: number
  totalExpenses: number
  netResult: number
  transactionCount: number
  period: {
    start: string
    end: string
  }
}

export interface ReportOptions {
  title: string
  subtitle?: string
  period: {
    start: Date
    end: Date
  }
  includeDetails: boolean
  includeSummary: boolean
  groupBy?: 'category' | 'loft' | 'owner' | 'month'
  currency: string
}

export class HTMLPDFGenerator {
  /**
   * Génère un rapport HTML qui peut être imprimé en PDF
   */
  async generateLoftReport(
    loft: Loft,
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<void> {
    const htmlContent = this.generateLoftHTML(loft, transactions, options)
    this.openPrintWindow(htmlContent, `rapport_loft_${loft.name.replace(/\s+/g, '_')}`)
  }

  async generateOwnerReport(
    owner: Owner,
    lofts: Loft[],
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<void> {
    const htmlContent = this.generateOwnerHTML(owner, lofts, transactions, options)
    this.openPrintWindow(htmlContent, `rapport_proprietaire_${owner.name.replace(/\s+/g, '_')}`)
  }

  async generateGlobalReport(
    lofts: Loft[],
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<void> {
    const htmlContent = this.generateGlobalHTML(lofts, transactions, options)
    this.openPrintWindow(htmlContent, 'rapport_global')
  }

  private generateLoftHTML(loft: Loft, transactions: Transaction[], options: ReportOptions): string {
    const summary = this.calculateSummary(transactions)
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Financier - ${loft.name}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHeader(`Rapport Financier - ${loft.name}`, options.subtitle)}
        
        <div class="section">
            <h2>Informations du Loft</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Nom:</strong> ${loft.name}
                </div>
                <div class="info-item">
                    <strong>Adresse:</strong> ${loft.address}
                </div>
                <div class="info-item">
                    <strong>Propriétaire:</strong> ${loft.owner_name}
                </div>
                <div class="info-item">
                    <strong>Loyer mensuel:</strong> ${loft.price_per_month.toLocaleString()} DA
                </div>
            </div>
        </div>

        ${this.generatePeriodSection(options.period)}
        ${this.generateSummarySection(summary, options.currency)}
        
        ${options.includeDetails ? this.generateTransactionDetails(transactions, options) : ''}
        ${options.includeSummary ? this.generateCategorySummary(transactions, options.currency) : ''}
        
        ${this.generateFooter()}
    </div>
</body>
</html>
    `
  }

  private generateOwnerHTML(owner: Owner, lofts: Loft[], transactions: Transaction[], options: ReportOptions): string {
    const summary = this.calculateSummary(transactions)
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Propriétaire - ${owner.name}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHeader(`Rapport Propriétaire - ${owner.name}`, options.subtitle)}
        
        <div class="section">
            <h2>Informations du Propriétaire</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Nom:</strong> ${owner.name}
                </div>
                <div class="info-item">
                    <strong>Email:</strong> ${owner.email || 'Non renseigné'}
                </div>
                <div class="info-item">
                    <strong>Téléphone:</strong> ${owner.phone || 'Non renseigné'}
                </div>
                <div class="info-item">
                    <strong>Nombre de lofts:</strong> ${owner.lofts_count}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Lofts du Propriétaire</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nom du Loft</th>
                        <th>Adresse</th>
                        <th>Loyer Mensuel</th>
                    </tr>
                </thead>
                <tbody>
                    ${lofts.map(loft => `
                        <tr>
                            <td>${loft.name}</td>
                            <td>${loft.address}</td>
                            <td>${loft.price_per_month.toLocaleString()} DA</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.generatePeriodSection(options.period)}
        ${this.generateSummarySection(summary, options.currency)}
        
        ${options.includeDetails ? this.generateLoftBreakdown(lofts, transactions, options) : ''}
        
        ${this.generateFooter()}
    </div>
</body>
</html>
    `
  }

  private generateGlobalHTML(lofts: Loft[], transactions: Transaction[], options: ReportOptions): string {
    const summary = this.calculateSummary(transactions)
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Global - Tous les Lofts</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHeader('Rapport Global - Tous les Lofts', options.subtitle)}
        
        <div class="section">
            <h2>Statistiques Générales</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>Nombre total de lofts:</strong> ${lofts.length}
                </div>
                <div class="stat-item">
                    <strong>Nombre de transactions:</strong> ${transactions.length}
                </div>
                <div class="stat-item">
                    <strong>Lofts avec activité:</strong> ${new Set(transactions.map(t => t.loft_id)).size}
                </div>
                <div class="stat-item">
                    <strong>Revenus locatifs théoriques:</strong> ${lofts.reduce((sum, loft) => sum + loft.price_per_month, 0).toLocaleString()} DA/mois
                </div>
            </div>
        </div>

        ${this.generatePeriodSection(options.period)}
        ${this.generateSummarySection(summary, options.currency)}
        
        ${options.includeDetails ? this.generateLoftPerformance(lofts, transactions, options) : ''}
        ${options.includeSummary ? this.generateCategorySummary(transactions, options.currency) : ''}
        
        ${this.generateFooter()}
    </div>
</body>
</html>
    `
  }

  private generateHeader(title: string, subtitle?: string): string {
    return `
        <div class="header">
            <div class="company-info">
                <h1>LOFT ALGÉRIE</h1>
                <p>Gestion Immobilière</p>
            </div>
            <div class="report-info">
                <h2>${title}</h2>
                ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
                <p class="generation-date">Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            </div>
        </div>
    `
  }

  private generatePeriodSection(period: { start: Date; end: Date }): string {
    return `
        <div class="section">
            <h2>Période du Rapport</h2>
            <p>Du ${format(period.start, 'dd/MM/yyyy', { locale: fr })} au ${format(period.end, 'dd/MM/yyyy', { locale: fr })}</p>
        </div>
    `
  }

  private generateSummarySection(summary: ReportSummary, currency: string): string {
    return `
        <div class="section">
            <h2>Résumé Financier</h2>
            <div class="summary-grid">
                <div class="summary-item positive">
                    <strong>Total des Revenus</strong>
                    <span>${summary.totalIncome.toLocaleString()} ${currency}</span>
                </div>
                <div class="summary-item negative">
                    <strong>Total des Dépenses</strong>
                    <span>${summary.totalExpenses.toLocaleString()} ${currency}</span>
                </div>
                <div class="summary-item ${summary.netResult >= 0 ? 'positive' : 'negative'}">
                    <strong>Résultat Net</strong>
                    <span>${summary.netResult.toLocaleString()} ${currency}</span>
                </div>
                <div class="summary-item neutral">
                    <strong>Nombre de Transactions</strong>
                    <span>${summary.transactionCount}</span>
                </div>
            </div>
        </div>
    `
  }

  private generateTransactionDetails(transactions: Transaction[], options: ReportOptions): string {
    return `
        <div class="section">
            <h2>Détail des Transactions</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(transaction => `
                        <tr>
                            <td>${format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                            <td>${transaction.description}</td>
                            <td>${transaction.category}</td>
                            <td class="${transaction.transaction_type}">${transaction.transaction_type === 'income' ? 'Revenus' : 'Dépenses'}</td>
                            <td class="amount ${transaction.transaction_type}">${transaction.amount.toLocaleString()} ${options.currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
  }

  private generateCategorySummary(transactions: Transaction[], currency: string): string {
    const categoryTotals = this.calculateCategoryTotals(transactions)
    
    return `
        <div class="section">
            <h2>Synthèse par Catégorie</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Nb Trans.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(categoryTotals).map(([category, data]) => `
                        <tr>
                            <td>${category}</td>
                            <td class="${data.type}">${data.type === 'income' ? 'Revenus' : 'Dépenses'}</td>
                            <td>${data.count}</td>
                            <td class="amount ${data.type}">${data.total.toLocaleString()} ${currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
  }

  private generateLoftBreakdown(lofts: Loft[], transactions: Transaction[], options: ReportOptions): string {
    return `
        <div class="section">
            <h2>Détail par Loft</h2>
            ${lofts.map(loft => {
                const loftTransactions = transactions.filter(t => t.loft_id === loft.id)
                if (loftTransactions.length === 0) return ''
                
                const loftSummary = this.calculateSummary(loftTransactions)
                
                return `
                    <div class="loft-breakdown">
                        <h3>${loft.name}</h3>
                        <div class="mini-summary">
                            <span class="positive">Revenus: ${loftSummary.totalIncome.toLocaleString()} ${options.currency}</span>
                            <span class="negative">Dépenses: ${loftSummary.totalExpenses.toLocaleString()} ${options.currency}</span>
                            <span class="${loftSummary.netResult >= 0 ? 'positive' : 'negative'}">Net: ${loftSummary.netResult.toLocaleString()} ${options.currency}</span>
                        </div>
                    </div>
                `
            }).join('')}
        </div>
    `
  }

  private generateLoftPerformance(lofts: Loft[], transactions: Transaction[], options: ReportOptions): string {
    return `
        <div class="section">
            <h2>Performance par Loft</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Loft</th>
                        <th>Propriétaire</th>
                        <th>Revenus</th>
                        <th>Dépenses</th>
                        <th>Net</th>
                        <th>Nb Trans.</th>
                    </tr>
                </thead>
                <tbody>
                    ${lofts.map(loft => {
                        const loftTransactions = transactions.filter(t => t.loft_id === loft.id)
                        const summary = this.calculateSummary(loftTransactions)
                        
                        return `
                            <tr>
                                <td>${loft.name}</td>
                                <td>${loft.owner_name}</td>
                                <td class="amount positive">${summary.totalIncome.toLocaleString()}</td>
                                <td class="amount negative">${summary.totalExpenses.toLocaleString()}</td>
                                <td class="amount ${summary.netResult >= 0 ? 'positive' : 'negative'}">${summary.netResult.toLocaleString()}</td>
                                <td>${summary.transactionCount}</td>
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>
        </div>
    `
  }

  private generateFooter(): string {
    return `
        <div class="footer">
            <p>Loft Algérie - Système de Gestion Immobilière</p>
            <p>Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
        </div>
    `
  }

  private getReportCSS(): string {
    return `
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .report-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
        }
        
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .company-info h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        
        .company-info p {
            color: #6b7280;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        
        .report-info {
            text-align: right;
        }
        
        .report-info h2 {
            color: #1f2937;
            margin: 0;
            font-size: 20px;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
        }
        
        .generation-date {
            color: #9ca3af;
            font-size: 12px;
            margin: 10px 0 0 0;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .info-grid, .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item, .stat-item {
            padding: 10px;
            background: #f9fafb;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-item {
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
        }
        
        .summary-item.positive {
            background: #dcfce7;
            border-left: 4px solid #16a34a;
            color: #15803d;
        }
        
        .summary-item.negative {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            color: #dc2626;
        }
        
        .summary-item.neutral {
            background: #f1f5f9;
            border-left: 4px solid #64748b;
            color: #475569;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .data-table th {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            color: #374151;
        }
        
        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 10px 8px;
        }
        
        .data-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .amount {
            text-align: right;
            font-weight: 600;
        }
        
        .positive, .income {
            color: #16a34a;
        }
        
        .negative, .expense {
            color: #dc2626;
        }
        
        .loft-breakdown {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .loft-breakdown h3 {
            margin: 0 0 10px 0;
            color: #1f2937;
        }
        
        .mini-summary {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .mini-summary span {
            font-weight: 600;
            font-size: 14px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        @page {
            margin: 2cm;
            size: A4;
        }
    `
  }

  private openPrintWindow(htmlContent: string, filename: string): void {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour générer le rapport PDF')
      return
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        
        // Fermer la fenêtre après impression (optionnel)
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }, 500)
    }
  }

  private calculateSummary(transactions: Transaction[]): ReportSummary {
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netResult: income - expenses,
      transactionCount: transactions.length,
      period: {
        start: transactions.length > 0 ? transactions[0].date : '',
        end: transactions.length > 0 ? transactions[transactions.length - 1].date : ''
      }
    }
  }

  private calculateCategoryTotals(transactions: Transaction[]): { [category: string]: { total: number; count: number; type: string } } {
    const totals: { [category: string]: { total: number; count: number; type: string } } = {}
    
    transactions.forEach(transaction => {
      if (!totals[transaction.category]) {
        totals[transaction.category] = {
          total: 0,
          count: 0,
          type: transaction.transaction_type
        }
      }
      
      totals[transaction.category].total += transaction.amount
      totals[transaction.category].count += 1
    })
    
    return totals
  }
}