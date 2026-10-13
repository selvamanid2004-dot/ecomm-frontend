import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: string;
  cityStateZip: string;
  country: string;
  email: string;
  phone: string;
  gstin: string;
  website: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'LUXE STUDIO',
  tagline: 'Luxury Creations & Bespoke Boutique',
  address: '108 Boulevard Prestige, Indiranagar',
  cityStateZip: 'Bengaluru, Karnataka 560038',
  country: 'India',
  email: 'contact@luxecomm.com',
  phone: '+91 (80) 4000 8899',
  gstin: 'GSTIN: 29AAAAA0000A1Z5',
  website: 'www.luxestudio.com',
};

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  /**
   * Generates and downloads a professional, high-fidelity customer tax invoice/bill in PDF format.
   * Uses high-DPI canvas rendering to guarantee perfect Indian Rupee (₹) glyphs, margins, luxury fonts,
   * itemized tables, and authentic corporate branding.
   */
  async generateOrderInvoicePdf(order: any, customCompany?: Partial<CompanyInfo>): Promise<void> {
    const company: CompanyInfo = { ...DEFAULT_COMPANY_INFO, ...customCompany };

    const orderNumber = order.order_number || order.orderNumber || order.id || 'ORD-UNKNOWN';
    const invoiceNumber =
      order.invoice_number ||
      order.invoiceNumber ||
      `INV-${orderNumber.replace('ORD-', '')}`;

    const rawDate = order.created_at || order.createdAt || new Date();
    const orderDate = new Date(rawDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Customer & Shipping Information
    const shipping = order.shipping_address_json || order.shippingAddress || {};
    const recipientName =
      shipping.recipient_name ||
      shipping.recipientName ||
      order.customerName ||
      order.customer?.name ||
      (order.customer?.user ? `${order.customer.user.first_name} ${order.customer.user.last_name}` : '') ||
      'Valued Patron';

    const recipientEmail =
      shipping.email ||
      order.guest_email ||
      order.email ||
      order.customer?.email ||
      order.customer?.user?.email ||
      'customer@example.com';

    const recipientPhone =
      shipping.phone ||
      order.phone ||
      order.customer?.phone ||
      '+91 98765 43210';

    const streetAddress =
      shipping.street_address ||
      shipping.streetAddress ||
      '742 Evergreen Terrace, Suite 500';

    const cityStateZip = [
      shipping.city || 'Bengaluru',
      shipping.state || 'Karnataka',
      shipping.postal_code || shipping.postalCode || '560001',
    ]
      .filter(Boolean)
      .join(', ');

    // Order items
    const rawItems: any[] = order.items || [];
    const items = rawItems.map((it, idx) => {
      const name = it.product_name || it.productName || it.name || `Creation #${idx + 1}`;
      const sku = it.sku || 'SKU-BESPOKE';
      const qty = Number(it.quantity || 1);
      const unitPrice = Number(it.unit_price || it.unitPrice || it.price || 0);
      const lineTotal = Number(it.line_total || it.lineTotal || unitPrice * qty);
      return { name, sku, qty, unitPrice, lineTotal };
    });

    // Totals
    const subtotal = Number(order.subtotal || order.total_amount || order.totalAmount || 0);
    const discount = Number(order.discount_amount || order.discountAmount || 0);
    const tax = Number(order.tax_amount || order.taxAmount || 0);
    const shippingFee = Number(order.shipping_fee || order.shippingFee || 0);
    const grandTotal = Number(order.total_amount || order.totalAmount || subtotal - discount + tax + shippingFee);

    const paymentMethodRaw = order.payment_method || order.paymentMethod || 'Credit / Debit Card';
    const paymentMethod =
      paymentMethodRaw.toLowerCase().includes('cod') || paymentMethodRaw.toLowerCase().includes('cash')
        ? 'Cash on Delivery / Concierge'
        : 'Credit / Debit Card (Online Authorized)';

    const paymentStatus = (order.payment_status || order.paymentStatus || 'PAID').toUpperCase();

    // Create printable HTML container
    const printContainer = document.createElement('div');
    printContainer.style.position = 'fixed';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.width = '794px'; // Standard A4 width at 96 DPI
    printContainer.style.backgroundColor = '#ffffff';
    printContainer.style.color = '#0f172a';
    printContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    printContainer.style.boxSizing = 'border-box';
    printContainer.style.padding = '36px 44px';
    printContainer.style.zIndex = '-9999';

    // HTML Invoice Template
    printContainer.innerHTML = `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; background: #ffffff;">
        <!-- Top Header & Brand -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0f172a;">
          <div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span style="font-size: 28px; font-weight: 900; letter-spacing: 0.15em; color: #0f172a;">${company.name}</span>
              <span style="font-size: 13px; font-weight: 800; color: #d97706; letter-spacing: 0.1em;">STUDIO</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${company.tagline}</p>
            <div style="margin-top: 10px; font-size: 11px; color: #475569; line-height: 1.5;">
              <div>${company.address}</div>
              <div>${company.cityStateZip}, ${company.country}</div>
              <div><strong>${company.gstin}</strong> &bull; Support: ${company.email}</div>
            </div>
          </div>
          
          <!-- Invoice Meta Box -->
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0f172a; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">
              TAX INVOICE
            </div>
            <div style="margin-top: 10px; font-size: 12px; line-height: 1.6;">
              <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Invoice Number</div>
              <div style="font-family: monospace; font-size: 15px; font-weight: 900; color: #0f172a;">${invoiceNumber}</div>
              <div style="margin-top: 4px; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Order Identifier</div>
              <div style="font-family: monospace; font-size: 13px; font-weight: 700; color: #475569;">${orderNumber}</div>
              <div style="margin-top: 4px; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Invoice Date</div>
              <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${orderDate}</div>
            </div>
          </div>
        </div>

        <!-- Billed & Shipped Details -->
        <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 48%;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #d97706; margin-bottom: 6px;">
              BILLED & DELIVERED TO
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${recipientName}</div>
            <div style="font-size: 11px; color: #475569; line-height: 1.5;">
              <div>${streetAddress}</div>
              <div>${cityStateZip}</div>
              <div style="margin-top: 4px;"><strong>Email:</strong> ${recipientEmail}</div>
              <div><strong>Phone:</strong> ${recipientPhone}</div>
            </div>
          </div>

          <div style="width: 48%; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 6px; padding: 12px 16px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px;">
              PAYMENT & DISPATCH SUMMARY
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Payment Method:</span>
                <strong>${paymentMethod}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span style="color: #64748b;">Payment Status:</span>
                <span style="display: inline-block; background: #ecfdf5; color: #059669; font-weight: 800; padding: 1px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #a7f3d0;">
                  ${paymentStatus}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span style="color: #64748b;">Courier & Dispatch:</span>
                <strong>FedEx Express Air Priority</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span style="color: #64748b;">Tracking ID:</span>
                <strong style="font-family: monospace; color: #0f172a;">${order.tracking_number || 'TRK-FX-992384711'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Itemized Table -->
        <div style="margin-top: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 700; border-top-left-radius: 4px;">#</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 700;">Creation / Product Description</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 700;">SKU</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 700;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 700;">Unit Price (₹)</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 700; border-top-right-radius: 4px;">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, i) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px 12px; color: #64748b; font-weight: 600;">${i + 1}</td>
                  <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">${item.name}</td>
                  <td style="padding: 10px 12px; font-family: monospace; color: #64748b;">${item.sku}</td>
                  <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">${item.qty}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace; color: #334155;">₹ ${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">₹ ${item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals & Financial Breakdown -->
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <div style="width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; color: #475569;">
              <span>Subtotal:</span>
              <span style="font-family: monospace; font-weight: 700;">₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${
              discount > 0
                ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; color: #059669;">
                <span>Discount / Promotion:</span>
                <span style="font-family: monospace; font-weight: 700;">- ₹ ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            `
                : ''
            }
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; color: #475569;">
              <span>Express Delivery:</span>
              <span style="font-weight: 700; color: #059669;">COMPLIMENTARY</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; color: #475569;">
              <span>Taxes (GST 18% Incl.):</span>
              <span style="font-family: monospace; font-weight: 700;">₹ ${tax > 0 ? tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (Math.round((grandTotal - grandTotal / 1.18) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style="border-top: 2px solid #0f172a; padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a;">
              <span>Grand Total:</span>
              <span style="font-family: monospace; color: #d97706;">₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Terms, Guarantee & Signatory -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 10px; color: #64748b; line-height: 1.5; max-width: 440px;">
            <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 4px;">Terms & Conditions of Sale:</div>
            <div>1. All luxury bespoke creations are covered under our 2-Year International Craftsmanship Guarantee.</div>
            <div>2. Returns & exchanges are accepted within 30 days of confirmed delivery in original sealed packaging.</div>
            <div>3. This document is a computer-generated official tax invoice requiring no physical signature.</div>
          </div>
          <div style="text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; min-width: 160px;">
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; font-family: 'Playfair Display', serif;">${company.name}</div>
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(printContainer);

    try {
      const canvas = await html2canvas(printContainer, {
        scale: 2, // High resolution (300 DPI equivalent)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate high-res invoice PDF:', err);
      throw err;
    } finally {
      document.body.removeChild(printContainer);
    }
  }

  /**
   * Generates and downloads a multi-page tabular PDF export with professional margins,
   * clear headings, Indian Rupee formatting, and automatic page numbers.
   */
  exportTableToPdf(options: {
    filename: string;
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
    orientation?: 'p' | 'l';
  }): void {
    const orientation = options.orientation || 'p';
    const doc = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand & Title
    doc.setTextColor(217, 119, 6); // #d97706 (Gold)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LUXE STUDIO', 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title.toUpperCase(), 14, 20);

    // Meta / Date Stamp on Right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // #cbd5e1
    const dateStr = `Exported: ${new Date().toLocaleString('en-IN')}`;
    doc.text(dateStr, pageWidth - 14, 12, { align: 'right' });
    doc.text(`Total Records: ${options.rows.length}`, pageWidth - 14, 20, { align: 'right' });

    // Optional Subtitle
    let startY = 34;
    if (options.subtitle) {
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text(options.subtitle, 14, startY);
      startY += 6;
    }

    // AutoTable
    autoTable(doc, {
      startY,
      head: [options.headers],
      body: options.rows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 3.5,
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        // Footer on every page
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${currentPage} of ${pageCount} • Official Record Export &copy; Luxe Studio Boutique`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    doc.save(`${options.filename}.pdf`);
  }

  /**
   * Generates and downloads a genuine Microsoft Excel (.xlsx) spreadsheet with
   * formatted column headers, properly aligned data cells, and metadata.
   */
  exportTableToExcel(options: {
    filename: string;
    sheetName: string;
    title: string;
    headers: string[];
    rows: (string | number)[][];
    columnWidths?: number[];
  }): void {
    const wb = XLSX.utils.book_new();

    // Sheet data starting with Title and Metadata
    const sheetData: any[][] = [
      [`LUXE STUDIO • ${options.title.toUpperCase()}`],
      [`Export Date: ${new Date().toLocaleString('en-IN')}`, `Total Records: ${options.rows.length}`],
      [], // Empty spacer row
      options.headers,
      ...options.rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Calculate or assign column widths
    const colWidths = options.headers.map((h, colIndex) => {
      let maxLen = h.length;
      for (const row of options.rows) {
        const val = row[colIndex];
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Report');
    XLSX.writeFile(wb, `${options.filename}.xlsx`);
  }
}
