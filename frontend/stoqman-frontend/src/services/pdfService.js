import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  
  /**
   * Generate PDF from HTML element
   */
  async generateFromHTML(element, filename = 'invoice.pdf') {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      throw error;
    }
  }

  /**
   * Generate PDF programmatically with better formatting
   */
  generateInvoicePDF(invoiceData, customerData, companyData = {}) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Company Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(34, 139, 34); // Green color
    pdf.text(companyData.name || 'STOQMAN', 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(companyData.tagline || 'Smart Inventory & Billing Management', 20, yPosition);

    // Company Details
    yPosition += 15;
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    if (companyData.address) pdf.text(companyData.address, 20, yPosition);
    yPosition += 4;
    if (companyData.phone) pdf.text(`Phone: ${companyData.phone}`, 20, yPosition);
    yPosition += 4;
    if (companyData.email) pdf.text(`Email: ${companyData.email}`, 20, yPosition);
    yPosition += 4;
    if (companyData.gstin) pdf.text(`GSTIN: ${companyData.gstin}`, 20, yPosition);

    // Invoice Title
    yPosition += 20;
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('INVOICE', pageWidth - 60, yPosition);

    // Invoice Details Box
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const invoiceDetailsX = pageWidth - 80;
    pdf.text(`Invoice #: ${invoiceData.invoice_number || 'N/A'}`, invoiceDetailsX, yPosition);
    yPosition += 5;
    pdf.text(`Date: ${this.formatDate(invoiceData.invoice_date)}`, invoiceDetailsX, yPosition);
    yPosition += 5;
    pdf.text(`Due Date: ${this.formatDate(invoiceData.due_date)}`, invoiceDetailsX, yPosition);
    yPosition += 5;
    
    // Status badge
    const status = invoiceData.status || 'draft';
    const statusColors = {
      paid: [34, 139, 34],
      due: [255, 165, 0],
      partial: [255, 193, 7],
      draft: [108, 117, 125],
      cancelled: [220, 53, 69]
    };
    const [r, g, b] = statusColors[status] || statusColors.draft;
    pdf.setFillColor(r, g, b);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(invoiceDetailsX, yPosition, 25, 6, 'F');
    pdf.text(status.toUpperCase(), invoiceDetailsX + 2, yPosition + 4);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Customer Details
    yPosition += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL TO:', 20, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    if (customerData) {
      pdf.text(customerData.name || 'N/A', 20, yPosition);
      yPosition += 5;
      if (customerData.email) {
        pdf.text(customerData.email, 20, yPosition);
        yPosition += 5;
      }
      if (customerData.phone) {
        pdf.text(customerData.phone, 20, yPosition);
        yPosition += 5;
      }
      if (customerData.address) {
        const addressLines = pdf.splitTextToSize(customerData.address, 80);
        pdf.text(addressLines, 20, yPosition);
        yPosition += addressLines.length * 5;
      }
      if (customerData.gstin) {
        pdf.text(`GSTIN: ${customerData.gstin}`, 20, yPosition);
        yPosition += 5;
      }
    }

    // Items Table
    yPosition += 15;
    this.drawTable(pdf, invoiceData.items || [], yPosition, pageWidth);

    // Calculate table height and update yPosition
    const tableHeight = (invoiceData.items?.length || 1) * 8 + 20;
    yPosition += tableHeight;

    // Totals Section
    yPosition = Math.max(yPosition, pageHeight - 60); // Ensure it's near bottom
    this.drawTotals(pdf, invoiceData, pageWidth, yPosition);

    // Footer
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Thank you for your business!', 20, footerY);
    pdf.text(`Generated on ${new Date().toLocaleDateString()} by Stoqman`, pageWidth - 80, footerY);

    return pdf;
  }

  /**
   * Draw items table
   */
  drawTable(pdf, items, startY, pageWidth) {
    const tableWidth = pageWidth - 40;
    const colWidths = [80, 20, 30, 25, 35]; // Description, Qty, Price, Tax, Total
    const headers = ['Description', 'Qty', 'Unit Price', 'Tax %', 'Total'];
    
    let currentY = startY;

    // Table Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, currentY, tableWidth, 8, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    
    let currentX = 25;
    headers.forEach((header, index) => {
      pdf.text(header, currentX, currentY + 5);
      currentX += colWidths[index];
    });

    currentY += 10;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    items.forEach((item, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, currentY, tableWidth, 8, 'F');
      }

      currentX = 25;
      const rowData = [
        item.product_name || item.description || 'N/A',
        (item.quantity || 0).toString(),
        this.formatCurrency(item.unit_price || 0),
        `${item.tax_rate || 0}%`,
        this.formatCurrency(item.total_with_tax || 0)
      ];

      rowData.forEach((data, colIndex) => {
        if (colIndex === 0) {
          // Description can be longer, wrap if needed
          const lines = pdf.splitTextToSize(data, colWidths[colIndex] - 5);
          pdf.text(lines, currentX, currentY + 5);
        } else {
          pdf.text(data, currentX, currentY + 5);
        }
        currentX += colWidths[colIndex];
      });

      currentY += 8;
    });

    // Table border
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(20, startY, tableWidth, currentY - startY);
  }

  /**
   * Draw totals section
   */
  drawTotals(pdf, invoiceData, pageWidth, startY) {
    const totalsX = pageWidth - 80;
    let currentY = startY;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // Subtotal
    pdf.text('Subtotal:', totalsX - 30, currentY);
    pdf.text(this.formatCurrency(invoiceData.subtotal || 0), totalsX, currentY);
    currentY += 6;

    // Tax
    pdf.text('Tax Amount:', totalsX - 30, currentY);
    pdf.text(this.formatCurrency(invoiceData.tax_amount || 0), totalsX, currentY);
    currentY += 6;

    // Discount
    if (invoiceData.discount_amount > 0) {
      pdf.text('Discount:', totalsX - 30, currentY);
      pdf.text(`-${this.formatCurrency(invoiceData.discount_amount)}`, totalsX, currentY);
      currentY += 6;
    }

    // Total line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(totalsX - 35, currentY, totalsX + 25, currentY);
    currentY += 3;

    // Total Amount
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Total:', totalsX - 30, currentY);
    pdf.setTextColor(34, 139, 34); // Green
    pdf.text(this.formatCurrency(invoiceData.total_amount || 0), totalsX, currentY);
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Utility functions
   */
  formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Download PDF
   */
  downloadPDF(pdf, filename = 'invoice.pdf') {
    pdf.save(filename);
  }

  /**
   * Print PDF
   */
  printPDF(pdf) {
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  /**
   * Get PDF as blob for email/upload
   */
  getPDFBlob(pdf) {
    return pdf.output('blob');
  }

  /**
   * Get PDF as base64 for API upload
   */
  getPDFBase64(pdf) {
    return pdf.output('datauristring');
  }
}

export default new PDFService();