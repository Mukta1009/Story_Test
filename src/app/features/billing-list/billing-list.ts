import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../services/billing';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './billing-list.html',
  styleUrls: ['./billing-list.css']
})
export class BillingList implements OnInit {

  //private billingService = inject(BillingService);

  bills: any[] = [];

  constructor(private billingService: BillingService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  // if (this.bills.length > 0) {
  //   console.log('[BillingList] Bills already loaded, skipping API call.');
  //   return;
  // }
//
  //console.log('[BillingList] First load — fetching bills');
  this.billingService.getBills().subscribe({
    next: (data) => {
      this.bills = data;
      console.log('[BillingList] Bills loaded:', data);
      this.cdr.detectChanges();
    }
  });
}


searchValue: string = '';
notFoundMessage: string = '';

searchBillById() {
  if (!this.searchValue){
    this.billingService.getBills().subscribe({
      next: (data) => {
        this.bills = data;
        this.notFoundMessage = '';
        this.cdr.detectChanges();
      }
    });
    return;
  }
  this.billingService.getBillById(this.searchValue).subscribe({
    next: (bill) => {
      if (bill) {
        this.bills = [bill];
        this.notFoundMessage = '';
      } else {
        this.bills = [];
        this.notFoundMessage = `Bill not found with ID: ${this.searchValue}`;
      }
      this.cdr.detectChanges();
    },
    error: () => {
      this.bills = [];
      this.notFoundMessage = `Bill not found with ID: ${this.searchValue}`;
      this.cdr.detectChanges();
    }
  });
}

showDropdown = false;
filterStartDate: string = '';
filterEndDate: string = '';
filterMinAmount: number | null = null;
filterMaxAmount: number | null = null;

toggleDropdown() {
  this.showDropdown = !this.showDropdown;
}

applyFilters() {
  if (this.filterStartDate && this.filterEndDate) {
    console.log("\nStart date: " + this.filterStartDate);
    console.log("\nEnd date: " + this.filterEndDate);
    this.billingService.getBillsByDateRange(this.filterStartDate, this.filterEndDate).subscribe({
      next: (data) => {
        this.bills = data.filter(bill => {
          const inAmountRange = (!this.filterMinAmount || bill.totalAmount >= this.filterMinAmount) &&
            (!this.filterMaxAmount || bill.totalAmount <= this.filterMaxAmount);
          return inAmountRange;
        });
        this.notFoundMessage = this.bills.length === 0 ? 'No bills found for selected filters.' : '';
        this.showDropdown = false;
        //this.cdr.detectChanges();
      },
      error: () => {
        this.bills = [];
        this.notFoundMessage = 'No bills found for selected filters.';
        this.showDropdown = false;
        //this.cdr.detectChanges();
      }
    });
  }
}

clearFilters() {
  this.filterStartDate = '';
  this.filterEndDate = '';
  this.filterMinAmount = null;
  this.filterMaxAmount = null;
  this.showDropdown = false;
  // Reload all bills
  this.billingService.getBills().subscribe({
    next: (data) => {
      this.bills = data;
      this.notFoundMessage = '';
      this.cdr.detectChanges();
    }
  });
}

showDeleteModal = false;
deleteBillId: string | null = null;

deleteBill(id: string) {
  console.log("\nBill to be deleted: "+ id);
  this.deleteBillId = id;
  this.showDeleteModal = true;
}

/* confirmDelete() {
  if (this.deleteBillId) {
    this.billingService.deleteBill(this.deleteBillId).subscribe({
      next: () => {
      this.bills = this.bills.filter(bill => bill.billId !== this.deleteBillId);
      this.showDeleteModal = false;
      this.deleteBillId = null;
    },
      error: err => {
        alert('Failed to delete bill.');
        this.showDeleteModal = false;
        this.deleteBillId = null;
      }
    });
  }
}
 */
cancelDelete() {
  this.showDeleteModal = false;
  this.deleteBillId = null;
}

showSuccessBanner = false;
bannerTimerPercent = 100;
bannerTimerInterval: any;

showBanner() {
  this.showSuccessBanner = true;
  this.bannerTimerPercent = 100;
  let elapsed = 0;
  const duration = 3000; // 3 seconds
  const interval = 30;
  clearInterval(this.bannerTimerInterval);
  this.bannerTimerInterval = setInterval(() => {
    elapsed += interval;
    this.bannerTimerPercent = Math.max(100 - (elapsed / duration) * 100, 0);
    this.cdr.detectChanges(); // Ensure timer bar updates
    if (elapsed >= duration) {
      this.closeBanner();
    }
  }, interval);
}

closeBanner() {
  this.showSuccessBanner = false;
  clearInterval(this.bannerTimerInterval);
  this.bannerTimerPercent = 100;
  this.cdr.detectChanges();
}
confirmDelete() {
  if (this.deleteBillId) {
    this.billingService.deleteBill(this.deleteBillId).subscribe({
      next: () => {
        this.bills = this.bills.filter(bill => bill.billId !== this.deleteBillId);
        this.showDeleteModal = false;
        this.deleteBillId = null;
        this.showBanner(); // Show success banner
      },
      error: err => {
        alert('Failed to delete bill.');
        this.showDeleteModal = false;
        this.deleteBillId = null;
      }
    });
  }
}
}
