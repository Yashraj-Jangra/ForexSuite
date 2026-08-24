import { CashMemoData, InvoiceTemplateId } from './types';
import { renderModernInvoice } from './invoice-modern';
import { renderExecutiveInvoice } from './invoice-executive';
import { renderClassicInvoice } from './invoice-classic';
import { renderMinimalInvoice } from './invoice-minimal';
import { renderCorporateInvoice } from './invoice-corporate';

export * from './types';

export function renderInvoiceHtml(data: CashMemoData): string {
  const template: InvoiceTemplateId = data.template || 'modern';

  switch (template) {
    case 'executive':
      return renderExecutiveInvoice(data);
    case 'classic':
      return renderClassicInvoice(data);
    case 'minimal':
      return renderMinimalInvoice(data);
    case 'corporate':
      return renderCorporateInvoice(data);
    case 'modern':
    default:
      return renderModernInvoice(data);
  }
}