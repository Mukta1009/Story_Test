import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-generate-bill',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './generate-bill.html',
  styleUrl: './generate-bill.css'
})
export class GenerateBill implements OnInit {

  // --- All previous properties are the same ---
  isAskingForPatientId = false;
  patientIdToGenerate: number | null = null;
  generatedBill: any = null;
  originalBillBackup: any = null;
  isLoading = false;
  isFetching = false;
  errorMessage: string | null = null;
  public hasUnsavedChanges: boolean = false;
  
  isMiscChargeModalVisible: boolean = false;
  newItem = {
    itemName: '',
    itemType: 'MISCELLANEOUS',
    quantity: 1,
    unitPrice: null as number | null
  };

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.startBillGeneration(); }
  startBillGeneration(): void {
    this.isAskingForPatientId = true;
    this.generatedBill = null;
    this.originalBillBackup = null;
    this.errorMessage = null;
    this.patientIdToGenerate = null;
    this.hasUnsavedChanges = false;
  }
  
  // ... onGenerateBill, fetchGeneratedBill, removeItem, recalculateTotal are unchanged ...
  onGenerateBill(): void {
    if (!this.patientIdToGenerate) {
      this.errorMessage = 'Please enter a Patient ID.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.isAskingForPatientId = false;
    this.billingService.generateBillByPatientId(this.patientIdToGenerate).subscribe({
      next: (billId) => this.fetchGeneratedBill(billId),
      error: (err) => {
        console.error('Error during bill generation:', err);
        this.errorMessage = 'Failed to generate bill. The patient may have no unbilled appointments.';
        this.isLoading = false;
        this.isAskingForPatientId = true;
        this.cdr.detectChanges();
      },
      complete: () => this.isLoading = false
    });
  }

  private fetchGeneratedBill(billId: number): void {
    this.isFetching = true;
    this.billingService.getBillById(billId.toString()).subscribe({
      next: (billData) => {
        this.generatedBill = billData;
        this.originalBillBackup = JSON.parse(JSON.stringify(billData));
        this.hasUnsavedChanges = false; 
        this.isFetching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching bill details:', err);
        this.errorMessage = `Bill was generated (ID: ${billId}), but failed to fetch details.`;
        this.isFetching = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  removeItem(itemToRemove: any): void {
    if (!this.generatedBill?.billItems) return;
    this.generatedBill.billItems = this.generatedBill.billItems.filter(
      (item: any) => item !== itemToRemove
    );
    this.recalculateTotal();
    this.hasUnsavedChanges = true; 
  }

  private recalculateTotal(): void {
    if (!this.generatedBill?.billItems) {
      if (this.generatedBill) this.generatedBill.totalAmount = 0;
      return;
    }
    const total = this.generatedBill.billItems.reduce(
      (sum: number, item: any) => sum + (item.totalPrice || 0), 0
    );
    this.generatedBill.totalAmount = total;
  }
  
  // NEW: A single function to toggle the status
  toggleStatus(): void {
    if (!this.generatedBill) return;
    const newStatus = this.generatedBill.status === 'PAID' ? 'PENDING' : 'PAID';
    this.generatedBill.status = newStatus;
    this.hasUnsavedChanges = true;
  }
  
  // ... modal functions are unchanged ...
  openMiscChargeModal(): void {
    this.isMiscChargeModalVisible = true;
  }

  closeMiscChargeModal(): void {
    this.isMiscChargeModalVisible = false;
    // Reset form fields to default
    this.newItem = {
      itemName: '',
      itemType: 'MISCELLANEOUS',
      quantity: 1,
      unitPrice: null
    };
  }

  addMiscChargeItem(): void {
    if (!this.newItem.itemName.trim() || !this.newItem.unitPrice || this.newItem.unitPrice <= 0 || !this.newItem.quantity || this.newItem.quantity <= 0) {
      alert('Please enter a valid item name, a positive quantity, and a positive price.');
      return;
    }
    const itemToAdd = {
      ...this.newItem,
      totalPrice: this.newItem.unitPrice * this.newItem.quantity,
      status: 'Unbilled'
    };
    this.generatedBill.billItems.push(itemToAdd);
    this.recalculateTotal();
    this.hasUnsavedChanges = true;
    this.closeMiscChargeModal();
  }
  
  // ... undoChanges, saveChanges, printPage, resetFlow are unchanged ...
  undoChanges(): void {
    if (confirm('Are you sure you want to discard all changes?')) {
      if (!this.originalBillBackup) return;
      this.generatedBill = JSON.parse(JSON.stringify(this.originalBillBackup));
      this.hasUnsavedChanges = false;
      this.cdr.detectChanges();
    }
  }

  saveChanges(): void {
    if (!this.generatedBill) return;
    this.billingService.updateBill(this.generatedBill).subscribe({
      next: (updatedBill) => {
        this.generatedBill = updatedBill;
        this.originalBillBackup = JSON.parse(JSON.stringify(updatedBill));
        this.hasUnsavedChanges = false; 
        alert(`Bill #${updatedBill.billId} has been successfully saved.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save bill:', err);
        alert('Error saving bill. Please try again.');
      }
    });
  }

  printPage(): void {
    window.print();
  }

  resetFlow(): void {
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to start a new bill?')) {
        this.startBillGeneration();
      }
    } else {
      this.startBillGeneration();
    }
  }
}