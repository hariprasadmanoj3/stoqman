import React, { useRef, useState } from 'react';
import { XMarkIcon, PrinterIcon, PencilIcon, DocumentDuplicateIcon, CheckCircleIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import PrintableInvoice from './PrintableInvoice';
import PDFService from '../../services/pdfService';

const InvoiceDetailModal = ({ invoice, customers = [], onClose, onEdit, onMarkPaid, onDuplicate }) => {
  const printRef = useRef();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!invoice || !invoice.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Invoice Data</h2>
          <p className="text-gray-600 mb-6">Invoice information is not available.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const customer = customers.find(c => c && c.id === invoice.customer);
  
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status, dueDate) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = (status === 'due' || status === 'partial') && dueDate && dueDate < today;
    
    if (isOverdue) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'due': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // PDF Generation Functions
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const pdf = PDFService.generateInvoicePDF(invoice, customer);
      const filename = `Invoice_${invoice.invoice_number || invoice.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      PDFService.downloadPDF(pdf, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (printRef.current) {
      setPdfLoading(true);
      try {
        const pdf = await PDFService.generateFromHTML(printRef.current);
        PDFService.printPDF(pdf);
      } catch (error) {
        console.error('Error printing invoice:', error);
        // Fallback to browser print
        window.print();
      } finally {
        setPdfLoading(false);
      }
    }
  };

  const handlePreviewPDF = async () => {
    setPdfLoading(true);
    try {
      const pdf = PDFService.generateInvoicePDF(invoice, customer);
      const pdfBlob = PDFService.getPDFBlob(pdf);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Failed to preview PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl shadow-sm z-10">
            <h2 className="text-xl font-semibold text-gray-900">📄 Invoice Details</h2>
            <div className="flex items-center space-x-3">
              
              {/* PDF Actions */}
              <Button 
                variant="outline" 
                onClick={handlePreviewPDF}
                disabled={pdfLoading}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </Button>

              <Button 
                variant="outline" 
                onClick={handlePrintInvoice}
                disabled={pdfLoading}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <PrinterIcon className="w-4 h-4 mr-2" />
                Print
              </Button>

              {/* Other Actions */}
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              
              <Button variant="outline" onClick={() => onDuplicate && onDuplicate(invoice)}>
                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              
              {invoice.status !== 'paid' && onMarkPaid && (
                <Button onClick={() => onMarkPaid(invoice.id)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Mark Paid
                </Button>
              )}
              
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* PDF Loading Indicator */}
            {pdfLoading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700 font-medium">Generating PDF... Please wait</span>
                </div>
              </div>
            )}

            {/* Printable Invoice Component */}
            <PrintableInvoice 
              ref={printRef}
              invoice={invoice}
              customer={customer}
            />
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </>
  );
};

export default InvoiceDetailModal;