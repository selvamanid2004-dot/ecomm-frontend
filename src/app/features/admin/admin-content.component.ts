import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ExportService } from '../../core/services/export.service';

export interface SiteContent {
  announcement_text: string;
  announcement_badge: string;
  brand_name: string;
  brand_tag: string;
  hero_badge: string;
  hero_heading: string;
  hero_subheading: string;
  products_section_title: string;
  products_section_subtitle: string;
  footer_text: string;
}

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-content-page">
      <!-- Page Header -->
      <div class="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title text-2xl font-extrabold text-slate-900">Website Content Management</h1>
          <p class="text-xs text-muted mt-1">Dynamically customize storefront headlines, announcements, and promotional copy without editing code.</p>
        </div>

        <div class="header-actions flex items-center gap-2 flex-wrap">
          <button (click)="exportPdf()" type="button" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export CMS configuration as PDF">
            <span>📄</span> Export PDF
          </button>
          <button (click)="exportExcel()" type="button" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export CMS configuration as Excel">
            <span>📊</span> Export Excel
          </button>
          <button (click)="resetDefaults()" type="button" class="btn btn-secondary btn-sm font-bold">
            Reset Defaults
          </button>
          <button (click)="saveContent()" [disabled]="saving()" type="button" class="btn btn-brand btn-sm font-bold">
            {{ saving() ? 'Publishing...' : 'Save & Publish Live' }}
          </button>
        </div>
      </div>

      <!-- Success Notification Alert -->
      <div *ngIf="successMessage()" class="admin-alert-success mb-6">
        <div class="flex items-center gap-2">
          <span class="text-base">✅</span>
          <span class="text-xs font-bold">{{ successMessage() }}</span>
        </div>
        <button (click)="successMessage.set(null)" class="modal-close-btn" title="Dismiss">&times;</button>
      </div>

      <div class="content-grid">
        <!-- Editor Forms Column -->
        <div class="editor-col flex flex-col gap-4">
          <!-- 1. Top Announcement Bar -->
          <div class="card p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>📢</span> Top Announcement Banner
            </h2>
            <div class="form-group mb-3">
              <label class="form-label">Announcement Text</label>
              <input
                type="text"
                [(ngModel)]="content.announcement_text"
                class="form-control"
                placeholder="e.g. ✨ COMPLIMENTARY EXPRESS DELIVERY OVER ₹1,500"
              />
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Badge Label</label>
              <input
                type="text"
                [(ngModel)]="content.announcement_badge"
                class="form-control"
                placeholder="e.g. LIMITED DIRECT RELEASE"
              />
            </div>
          </div>

          <!-- 2. Brand Identity -->
          <div class="card p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>✨</span> Storefront Brand Identity
            </h2>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label">Brand Name</label>
                <input
                  type="text"
                  [(ngModel)]="content.brand_name"
                  class="form-control"
                  placeholder="e.g. LUXE"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Brand Tagline</label>
                <input
                  type="text"
                  [(ngModel)]="content.brand_tag"
                  class="form-control"
                  placeholder="e.g. STUDIO"
                />
              </div>
            </div>
          </div>

          <!-- 3. Hero Showcase -->
          <div class="card p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🎯</span> Hero Headline &amp; Subtitle
            </h2>
            <div class="form-group mb-3">
              <label class="form-label">Hero Badge</label>
              <input
                type="text"
                [(ngModel)]="content.hero_badge"
                class="form-control"
                placeholder="e.g. THE EXCLUSIVE CURATION"
              />
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Main Hero Title</label>
              <input
                type="text"
                [(ngModel)]="content.hero_heading"
                class="form-control"
                placeholder="e.g. Crafted for the Discerning"
              />
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Hero Description Subheading</label>
              <textarea
                [(ngModel)]="content.hero_subheading"
                rows="3"
                class="form-control"
                placeholder="Describe your boutique curation..."
              ></textarea>
            </div>
          </div>

          <!-- 4. Catalog & Footer Section -->
          <div class="card p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🛍️</span> Products Section &amp; Footer
            </h2>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="form-group mb-0">
                <label class="form-label">Section Heading</label>
                <input
                  type="text"
                  [(ngModel)]="content.products_section_title"
                  class="form-control"
                  placeholder="e.g. Featured Creations"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Section Subtitle</label>
                <input
                  type="text"
                  [(ngModel)]="content.products_section_subtitle"
                  class="form-control"
                  placeholder="e.g. Select quantity and proceed directly to bag."
                />
              </div>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Footer Signature</label>
              <input
                type="text"
                [(ngModel)]="content.footer_text"
                class="form-control"
                placeholder="e.g. LUXE STUDIO BOUTIQUE • Direct Experience"
              />
            </div>
          </div>
        </div>

        <!-- Live Preview Column -->
        <div class="preview-col">
          <div class="card p-5 sticky-top shadow-sm">
            <div class="flex-between mb-3 border-b pb-2">
              <span class="text-xs font-bold text-slate-800">📱 LIVE STOREFRONT PREVIEW</span>
              <span class="badge badge-gold text-xs">Instant Reflection</span>
            </div>

            <!-- Mini Storefront Simulation Container -->
            <div class="preview-stage rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 p-4">
              <!-- Announcement -->
              <div class="preview-bar text-xs py-1.5 px-2.5 bg-slate-900 rounded mb-3 flex-between text-slate-300">
                <span class="truncate text-xs">{{ content.announcement_text }}</span>
                <span class="text-amber-500 font-bold text-xs ml-2 shrink-0">{{ content.announcement_badge }}</span>
              </div>

              <!-- Brand Header -->
              <div class="flex-between py-2 border-b border-slate-800 mb-4">
                <div class="flex items-center gap-1">
                  <span class="text-base font-black text-white tracking-wider">{{ content.brand_name }}</span>
                  <span class="text-xs font-semibold text-amber-500 tracking-widest">{{ content.brand_tag }}</span>
                </div>
                <span class="text-xs text-slate-400">🛍️ Bag (₹0.00)</span>
              </div>

              <!-- Hero -->
              <div class="text-center py-4 px-2">
                <span class="badge badge-gold text-xs mb-2">{{ content.hero_badge }}</span>
                <h3 class="text-base font-black text-white mb-2">{{ content.hero_heading }}</h3>
                <p class="text-xs text-slate-400 max-w-xs mx-auto line-clamp-3">
                  {{ content.hero_subheading }}
                </p>
              </div>

              <!-- Products title preview -->
              <div class="border-t border-slate-800 pt-3 mt-2">
                <h4 class="text-xs font-bold text-white">{{ content.products_section_title }}</h4>
                <p class="text-xs text-slate-400">{{ content.products_section_subtitle }}</p>
              </div>

              <!-- Footer preview -->
              <div class="border-t border-slate-800 pt-2 mt-4 text-center">
                <span class="text-xs text-slate-500 font-mono">{{ content.footer_text }}</span>
              </div>
            </div>

            <div class="mt-4">
              <button (click)="saveContent()" [disabled]="saving()" class="btn btn-brand w-full font-bold py-2.5">
                {{ saving() ? 'Publishing Changes...' : 'Save & Publish Live' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .sticky-top {
      position: sticky;
      top: 5.5rem;
    }
    .w-full { width: 100%; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .preview-stage {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
    }
    .grid-cols-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .shrink-0 { flex-shrink: 0; }
    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
      .sticky-top { position: static; }
    }
  `],
})
export class AdminContentComponent implements OnInit {
  private http = inject(HttpClient);
  private exportService = inject(ExportService);
  private contentUrl = `${environment.apiUrl}/content/storefront`;
  private adminContentUrl = `${environment.apiUrl}/admin/content/storefront`;

  content: SiteContent = {
    announcement_text: '✨ COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY • BESPOKE COLLECTION',
    announcement_badge: 'LIMITED DIRECT RELEASE',
    brand_name: 'LUXE',
    brand_tag: 'STUDIO',
    hero_badge: 'THE EXCLUSIVE CURATION',
    hero_heading: 'Crafted for the Discerning',
    hero_subheading: 'Experience our meticulously engineered collection. Select your desired quantities, review your bag, and complete checkout seamlessly in one place.',
    products_section_title: 'Available Creations',
    products_section_subtitle: 'Select quantity and proceed directly to purchase.',
    footer_text: 'LUXE STUDIO BOUTIQUE • Direct Single Page Experience',
  };

  saving = signal(false);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchContent();
  }

  fetchContent(): void {
    this.http.get<{ success: boolean; data: SiteContent }>(this.contentUrl).subscribe({
      next: (res) => {
        if (res.data) {
          this.content = { ...this.content, ...res.data };
        }
      },
    });
  }

  saveContent(): void {
    this.saving.set(true);
    this.successMessage.set(null);

    this.http.put<{ success: boolean; message: string; data: SiteContent }>(this.adminContentUrl, this.content).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data) this.content = res.data;
        this.successMessage.set('Storefront content successfully updated and published!');
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  resetDefaults(): void {
    this.content = {
      announcement_text: '✨ COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY • BESPOKE COLLECTION',
      announcement_badge: 'LIMITED DIRECT RELEASE',
      brand_name: 'LUXE',
      brand_tag: 'STUDIO',
      hero_badge: 'THE EXCLUSIVE CURATION',
      hero_heading: 'Crafted for the Discerning',
      hero_subheading: 'Experience our meticulously engineered collection. Select your desired quantities, review your bag, and complete checkout seamlessly in one place.',
      products_section_title: 'Available Creations',
      products_section_subtitle: 'Select quantity and proceed directly to purchase.',
      footer_text: 'LUXE STUDIO BOUTIQUE • Direct Single Page Experience',
    };
    this.saveContent();
  }

  exportPdf(): void {
    const c = this.content;
    const headers = ['CMS Section', 'Configuration Field', 'Configured Value / Text Copy'];
    const rows = [
      ['Top Announcement Bar', 'Announcement Text', c.announcement_text || '—'],
      ['Top Announcement Bar', 'Badge Label', c.announcement_badge || '—'],
      ['Brand Identity', 'Store Brand Name', c.brand_name || '—'],
      ['Brand Identity', 'Brand Tagline', c.brand_tag || '—'],
      ['Hero Showcase', 'Hero Badge', c.hero_badge || '—'],
      ['Hero Showcase', 'Hero Heading', c.hero_heading || '—'],
      ['Hero Showcase', 'Hero Subheading', c.hero_subheading || '—'],
      ['Creations Section', 'Section Title', c.products_section_title || '—'],
      ['Creations Section', 'Section Subtitle', c.products_section_subtitle || '—'],
      ['Footer & Legal Notice', 'Footer Legal Text', c.footer_text || '—'],
    ];

    this.exportService.exportTableToPdf({
      filename: `Website_Content_Config_${Date.now()}`,
      title: 'Storefront CMS & Website Content Configuration Report',
      subtitle: 'Official live copy, promotional badges, and brand headlines',
      headers,
      rows,
      orientation: 'l',
    });
  }

  exportExcel(): void {
    const c = this.content;
    const headers = ['Section', 'Field Key', 'Description', 'Current Value'];
    const rows: (string | number)[][] = [
      ['Announcement', 'announcement_text', 'Top banner promotional copy', c.announcement_text || ''],
      ['Announcement', 'announcement_badge', 'Badge highlight text', c.announcement_badge || ''],
      ['Branding', 'brand_name', 'Primary boutique brand name', c.brand_name || ''],
      ['Branding', 'brand_tag', 'Brand category tag', c.brand_tag || ''],
      ['Hero', 'hero_badge', 'Curated collection badge', c.hero_badge || ''],
      ['Hero', 'hero_heading', 'Main hero headline', c.hero_heading || ''],
      ['Hero', 'hero_subheading', 'Hero narrative description', c.hero_subheading || ''],
      ['Products Section', 'products_section_title', 'Creations section header', c.products_section_title || ''],
      ['Products Section', 'products_section_subtitle', 'Creations section subtitle', c.products_section_subtitle || ''],
      ['Footer', 'footer_text', 'Footer boutique notice & copyright', c.footer_text || ''],
    ];

    this.exportService.exportTableToExcel({
      filename: `Website_Content_Config_${Date.now()}`,
      sheetName: 'Content Settings',
      title: 'Storefront CMS & Website Content Configuration',
      headers,
      rows,
    });
  }
}
