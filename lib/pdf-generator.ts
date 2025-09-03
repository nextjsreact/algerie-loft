/**
 * GÉNÉRATEUR DE RAPPORTS PDF
 * ==========================
 * 
 * Système complet de génération de rapports PDF pour les mouvements financiers
 * Supporte les rapports par loft, par propriétaire, et globaux
 */

import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Extension des types jsPDF pour autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: { finalY: number }
  }
}

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

export class PDFReportGenerator {
  private doc: jsPDF
  private pageHeight: number
  private pageWidth: number
  private margin: number
  private currentY: number
  private lineHeight: number

  constructor() {
    this.doc = new jsPDF()
    this.pageHeight = this.doc.internal.pageSize.height
    this.pageWidth = this.doc.internal.pageSize.width
    this.margin = 20
    this.currentY = this.margin
    this.lineHeight = 7
  }

  /**
   * Génère un rapport complet par loft
   */
  async generateLoftReport(
    loft: Loft,
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<Uint8Array> {
    this.initializeDocument()
    
    // En-tête du rapport
    this.addHeader(`Rapport Financier - ${loft.name}`, options.subtitle)
    
    // Informations du loft
    this.addLoftInfo(loft)
    
    // Période du rapport
    this.addPeriodInfo(options.period)
    
    // Résumé financier
    const summary = this.calculateSummary(transactions)
    this.addFinancialSummary(summary, options.currency)
    
    if (options.includeDetails) {
      // Détails des transactions
      this.addTransactionDetails(transactions, options)
    }
    
    if (options.includeSummary) {
      // Synthèse par catégorie
      this.addCategorySummary(transactions, options.currency)
    }
    
    // Pied de page
    this.addFooter()
    
    return this.doc.output('arraybuffer')
  }

  /**
   * Génère un rapport par propriétaire
   */
  async generateOwnerReport(
    owner: Owner,
    lofts: Loft[],
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<Uint8Array> {
    this.initializeDocument()
    
    // En-tête du rapport
    this.addHeader(`Rapport Propriétaire - ${owner.name}`, options.subtitle)
    
    // Informations du propriétaire
    this.addOwnerInfo(owner)
    
    // Liste des lofts
    this.addOwnerLofts(lofts)
    
    // Période du rapport
    this.addPeriodInfo(options.period)
    
    // Résumé financier global
    const summary = this.calculateSummary(transactions)
    this.addFinancialSummary(summary, options.currency)
    
    if (options.includeDetails) {
      // Détails par loft
      this.addLoftBreakdown(lofts, transactions, options)
    }
    
    if (options.includeSummary) {
      // Synthèse globale
      this.addOwnerSummary(lofts, transactions, options.currency)
    }
    
    // Pied de page
    this.addFooter()
    
    return this.doc.output('arraybuffer')
  }

  /**
   * Génère un rapport global de tous les lofts
   */
  async generateGlobalReport(
    lofts: Loft[],
    transactions: Transaction[],
    options: ReportOptions
  ): Promise<Uint8Array> {
    this.initializeDocument()
    
    // En-tête du rapport
    this.addHeader('Rapport Global - Tous les Lofts', options.subtitle)
    
    // Période du rapport
    this.addPeriodInfo(options.period)
    
    // Statistiques générales
    this.addGlobalStats(lofts, transactions)
    
    // Résumé financier global
    const summary = this.calculateSummary(transactions)
    this.addFinancialSummary(summary, options.currency)
    
    if (options.includeDetails) {
      // Performance par loft
      this.addLoftPerformance(lofts, transactions, options)
    }
    
    if (options.includeSummary) {
      // Synthèses multiples
      this.addGlobalSummaries(transactions, options.currency)
    }
    
    // Pied de page
    this.addFooter()
    
    return this.doc.output('arraybuffer')
  }

  private initializeDocument(): void {
    this.doc = new jsPDF()
    this.currentY = this.margin
    
    // Configuration des polices
    this.doc.setFont('helvetica')
  }

  private addHeader(title: string, subtitle?: string): void {
    // Logo ou en-tête de l'entreprise
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('LOFT ALGÉRIE', this.margin, this.currentY)
    
    this.currentY += 10
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Gestion Immobilière', this.margin, this.currentY)
    
    // Ligne de séparation
    this.currentY += 10
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    
    // Titre du rapport
    this.currentY += 15
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    
    if (subtitle) {
      this.currentY += 8
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, this.margin, this.currentY)
    }
    
    // Date de génération
    this.currentY += 15
    this.doc.setFontSize(10)
    this.doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      this.pageWidth - this.margin - 60,
      this.currentY
    )
    
    this.currentY += 10
  }

  private addLoftInfo(loft: Loft): void {
    this.checkPageBreak(40)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Informations du Loft', this.margin, this.currentY)
    
    this.currentY += 10
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const info = [
      ['Nom:', loft.name],
      ['Adresse:', loft.address],
      ['Propriétaire:', loft.owner_name],
      ['Loyer mensuel:', `${loft.price_per_month.toLocaleString()} DA`]
    ]
    
    info.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY)
      this.doc.text(value, this.margin + 40, this.currentY)
      this.currentY += this.lineHeight
    })
    
    this.currentY += 5
  }

  private addOwnerInfo(owner: Owner): void {
    this.checkPageBreak(40)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Informations du Propriétaire', this.margin, this.currentY)
    
    this.currentY += 10
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const info = [
      ['Nom:', owner.name],
      ['Email:', owner.email || 'Non renseigné'],
      ['Téléphone:', owner.phone || 'Non renseigné'],
      ['Nombre de lofts:', owner.lofts_count.toString()]
    ]
    
    info.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY)
      this.doc.text(value, this.margin + 40, this.currentY)
      this.currentY += this.lineHeight
    })
    
    this.currentY += 5
  }

  private addOwnerLofts(lofts: Loft[]): void {
    this.checkPageBreak(60)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Lofts du Propriétaire', this.margin, this.currentY)
    
    this.currentY += 10
    
    const tableData = lofts.map(loft => [
      loft.name,
      loft.address,
      `${loft.price_per_month.toLocaleString()} DA`
    ])
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Nom du Loft', 'Adresse', 'Loyer Mensuel']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addPeriodInfo(period: { start: Date; end: Date }): void {
    this.checkPageBreak(20)
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Période du Rapport', this.margin, this.currentY)
    
    this.currentY += 8
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const periodText = `Du ${format(period.start, 'dd/MM/yyyy', { locale: fr })} au ${format(period.end, 'dd/MM/yyyy', { locale: fr })}`
    this.doc.text(periodText, this.margin, this.currentY)
    
    this.currentY += 10
  }

  private addFinancialSummary(summary: ReportSummary, currency: string): void {
    this.checkPageBreak(80)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Résumé Financier', this.margin, this.currentY)
    
    this.currentY += 15
    
    // Tableau du résumé
    const summaryData = [
      ['Total des Revenus', `${summary.totalIncome.toLocaleString()} ${currency}`, '#2ECC71'],
      ['Total des Dépenses', `${summary.totalExpenses.toLocaleString()} ${currency}`, '#E74C3C'],
      ['Résultat Net', `${summary.netResult.toLocaleString()} ${currency}`, summary.netResult >= 0 ? '#2ECC71' : '#E74C3C'],
      ['Nombre de Transactions', summary.transactionCount.toString(), '#3498DB']
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      body: summaryData,
      theme: 'plain',
      styles: { 
        fontSize: 11,
        cellPadding: 5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { fontStyle: 'bold', halign: 'right', cellWidth: 60 }
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addTransactionDetails(transactions: Transaction[], options: ReportOptions): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Détail des Transactions', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Grouper les transactions si nécessaire
    const groupedTransactions = this.groupTransactions(transactions, options.groupBy)
    
    Object.entries(groupedTransactions).forEach(([groupName, groupTransactions]) => {
      if (options.groupBy && groupName !== 'all') {
        this.checkPageBreak(30)
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(`${this.getGroupLabel(options.groupBy)}: ${groupName}`, this.margin, this.currentY)
        this.currentY += 8
      }
      
      const tableData = groupTransactions.map(transaction => [
        format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr }),
        transaction.description,
        transaction.category,
        transaction.transaction_type === 'income' ? 'Revenus' : 'Dépenses',
        `${transaction.amount.toLocaleString()} ${options.currency}`
      ])
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['Date', 'Description', 'Catégorie', 'Type', 'Montant']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          4: { halign: 'right' }
        }
      })
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    })
  }

  private addCategorySummary(transactions: Transaction[], currency: string): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Synthèse par Catégorie', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Calculer les totaux par catégorie
    const categoryTotals = this.calculateCategoryTotals(transactions)
    
    const tableData = Object.entries(categoryTotals).map(([category, data]) => [
      category,
      data.type === 'income' ? 'Revenus' : 'Dépenses',
      data.count.toString(),
      `${data.total.toLocaleString()} ${currency}`
    ])
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Catégorie', 'Type', 'Nb Trans.', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [155, 89, 182] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' }
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addLoftBreakdown(lofts: Loft[], transactions: Transaction[], options: ReportOptions): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Détail par Loft', this.margin, this.currentY)
    
    this.currentY += 10
    
    lofts.forEach(loft => {
      const loftTransactions = transactions.filter(t => t.loft_id === loft.id)
      
      if (loftTransactions.length > 0) {
        this.checkPageBreak(60)
        
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(loft.name, this.margin, this.currentY)
        
        this.currentY += 8
        
        const loftSummary = this.calculateSummary(loftTransactions)
        
        const summaryData = [
          ['Revenus', `${loftSummary.totalIncome.toLocaleString()} ${options.currency}`],
          ['Dépenses', `${loftSummary.totalExpenses.toLocaleString()} ${options.currency}`],
          ['Net', `${loftSummary.netResult.toLocaleString()} ${options.currency}`]
        ]
        
        this.doc.autoTable({
          startY: this.currentY,
          body: summaryData,
          theme: 'plain',
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { halign: 'right', cellWidth: 50 }
          }
        })
        
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10
      }
    })
  }

  private addGlobalStats(lofts: Loft[], transactions: Transaction[]): void {
    this.checkPageBreak(60)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Statistiques Générales', this.margin, this.currentY)
    
    this.currentY += 10
    
    const stats = [
      ['Nombre total de lofts', lofts.length.toString()],
      ['Nombre de transactions', transactions.length.toString()],
      ['Lofts avec activité', new Set(transactions.map(t => t.loft_id)).size.toString()],
      ['Revenus locatifs théoriques', `${lofts.reduce((sum, loft) => sum + loft.price_per_month, 0).toLocaleString()} DA/mois`]
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      body: stats,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 60 }
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addLoftPerformance(lofts: Loft[], transactions: Transaction[], options: ReportOptions): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Performance par Loft', this.margin, this.currentY)
    
    this.currentY += 10
    
    const performanceData = lofts.map(loft => {
      const loftTransactions = transactions.filter(t => t.loft_id === loft.id)
      const summary = this.calculateSummary(loftTransactions)
      
      return [
        loft.name,
        loft.owner_name,
        `${summary.totalIncome.toLocaleString()}`,
        `${summary.totalExpenses.toLocaleString()}`,
        `${summary.netResult.toLocaleString()}`,
        summary.transactionCount.toString()
      ]
    })
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Loft', 'Propriétaire', 'Revenus', 'Dépenses', 'Net', 'Nb Trans.']],
      body: performanceData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [230, 126, 34] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' }
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addOwnerSummary(lofts: Loft[], transactions: Transaction[], currency: string): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Synthèse du Propriétaire', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Performance par loft
    const performanceData = lofts.map(loft => {
      const loftTransactions = transactions.filter(t => t.loft_id === loft.id)
      const summary = this.calculateSummary(loftTransactions)
      
      return [
        loft.name,
        `${summary.totalIncome.toLocaleString()}`,
        `${summary.totalExpenses.toLocaleString()}`,
        `${summary.netResult.toLocaleString()}`,
        summary.transactionCount.toString()
      ]
    })
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Loft', 'Revenus', 'Dépenses', 'Net', 'Nb Trans.']],
      body: performanceData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [142, 68, 173] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    })
    
    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addGlobalSummaries(transactions: Transaction[], currency: string): void {
    // Synthèse par catégorie
    this.addCategorySummary(transactions, currency)
    
    // Synthèse par mois
    this.addMonthlySummary(transactions, currency)
  }

  private addMonthlySummary(transactions: Transaction[], currency: string): void {
    this.checkPageBreak(100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Synthèse Mensuelle', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Grouper par mois
    const monthlyData = this.groupTransactionsByMonth(transactions)
    
    const tableData = Object.entries(monthlyData).map(([month, data]) => [
      month,
      `${data.income.toLocaleString()}`,
      `${data.expenses.toLocaleString()}`,
      `${(data.income - data.expenses).toLocaleString()}`,
      data.count.toString()
    ])
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Mois', 'Revenus', 'Dépenses', 'Net', 'Nb Trans.']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 204, 113] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Ligne de séparation
      this.doc.line(this.margin, this.pageHeight - 25, this.pageWidth - this.margin, this.pageHeight - 25)
      
      // Informations de pied de page
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Loft Algérie - Système de Gestion Immobilière', this.margin, this.pageHeight - 15)
      this.doc.text(`Page ${i} sur ${pageCount}`, this.pageWidth - this.margin - 30, this.pageHeight - 15)
      this.doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, this.margin, this.pageHeight - 8)
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = this.margin
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

  private groupTransactions(transactions: Transaction[], groupBy?: string): { [key: string]: Transaction[] } {
    if (!groupBy) {
      return { all: transactions }
    }
    
    const grouped: { [key: string]: Transaction[] } = {}
    
    transactions.forEach(transaction => {
      let key = 'other'
      
      switch (groupBy) {
        case 'category':
          key = transaction.category
          break
        case 'loft':
          key = transaction.loft_name || 'Sans loft'
          break
        case 'owner':
          key = transaction.owner_name || 'Sans propriétaire'
          break
        case 'month':
          key = format(new Date(transaction.date), 'MM/yyyy', { locale: fr })
          break
      }
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      
      grouped[key].push(transaction)
    })
    
    return grouped
  }

  private groupTransactionsByMonth(transactions: Transaction[]): { [month: string]: { income: number; expenses: number; count: number } } {
    const monthly: { [month: string]: { income: number; expenses: number; count: number } } = {}
    
    transactions.forEach(transaction => {
      const month = format(new Date(transaction.date), 'MM/yyyy', { locale: fr })
      
      if (!monthly[month]) {
        monthly[month] = { income: 0, expenses: 0, count: 0 }
      }
      
      if (transaction.transaction_type === 'income') {
        monthly[month].income += transaction.amount
      } else {
        monthly[month].expenses += transaction.amount
      }
      
      monthly[month].count += 1
    })
    
    return monthly
  }

  private getGroupLabel(groupBy: string): string {
    switch (groupBy) {
      case 'category': return 'Catégorie'
      case 'loft': return 'Loft'
      case 'owner': return 'Propriétaire'
      case 'month': return 'Mois'
      default: return 'Groupe'
    }
  }
}