import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-generate-bill',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './generate-bill.html',
  styleUrl: './generate-bill.css'
})
export class GenerateBill implements OnInit {

  // --- Component State ---
  isAskingForPatientId = false;
  patientIdToGenerate: number | null = null;
  generatedBill: any = null;
  originalBillBackup: any = null;
  isLoading = false;
  isFetching = false;
  errorMessage: string | null = null;

  // --- Change Tracking ---
  public hasUnsavedChanges: boolean = false;

  // --- Modal State ---
  isMiscChargeModalVisible: boolean = false;
  isEditMode: boolean = false;
  editingItemIndex: number | null = null;
  newItem = {
    itemName: '',
    itemType: 'MISCELLANEOUS',
    quantity: 1,
    unitPrice: null as number | null
  };

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /**
   * This is the "brain" of the component. It checks the URL to decide whether
   * to load an existing bill for editing or to show the form for a new one.
   */
  ngOnInit(): void {
    const billId = this.route.snapshot.paramMap.get('id');
    if (billId) {
      // An ID was found in the URL -> EDIT MODE
      this.isAskingForPatientId = false;
      this.loadBillForEditing(billId);
    } else {
      // No ID in the URL -> GENERATE NEW MODE
      this.startBillGeneration();
    }
  }

  // --- DATA LOADING & INITIALIZATION ---

  private loadBillForEditing(id: string): void {
    this.isFetching = true;
    this.billingService.getBillById(id).subscribe({
      next: (billData) => {
        this.generatedBill = billData;
        this.originalBillBackup = JSON.parse(JSON.stringify(billData));
        this.isFetching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching bill for editing:', err);
        this.errorMessage = `Failed to load Bill #${id}. It may not exist.`;
        this.isFetching = false;
      }
    });
  }

  startBillGeneration(): void {
    this.isAskingForPatientId = true;
    this.generatedBill = null;
    this.originalBillBackup = null;
    this.errorMessage = null;
    this.patientIdToGenerate = null;
    this.hasUnsavedChanges = false;
  }

  onGenerateBill(): void {
    if (!this.patientIdToGenerate) {
      this.errorMessage = 'Please enter a Patient ID.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.isAskingForPatientId = false;
    this.billingService.generateBillByPatientId(this.patientIdToGenerate).subscribe({
      next: (billId) => {
        // After generating, navigate to the new edit URL for that bill
        this.router.navigate(['/billing/edit', billId]);
      },
      error: (err) => {
        console.error('Error during bill generation:', err);
        this.errorMessage = 'Failed to generate bill. The patient may have no unbilled appointments.';
        this.isLoading = false;
        this.isAskingForPatientId = true;
      },
      complete: () => this.isLoading = false
    });
  }

  // --- LOCAL BILL MANIPULATION ---

  removeItem(itemToRemove: any): void {
    if (!this.generatedBill?.billItems) return;
    this.generatedBill.billItems = this.generatedBill.billItems.filter((item: any) => item !== itemToRemove);
    this.recalculateTotal();
    this.hasUnsavedChanges = true;
  }

  toggleStatus(): void {
    if (!this.generatedBill) return;
    const newStatus = this.generatedBill.status === 'PAID' ? 'PENDING' : 'PAID';
    this.generatedBill.status = newStatus;
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

  // --- MODAL MANAGEMENT ---

  openAddItemModal(): void {
    this.isEditMode = false;
    this.isMiscChargeModalVisible = true;
  }

  openEditItemModal(itemToEdit: any, index: number): void {
    this.isEditMode = true;
    this.editingItemIndex = index;
    this.newItem = { ...itemToEdit }; // Create a copy for editing
    this.isMiscChargeModalVisible = true;
  }

  closeModal(): void {
    this.isMiscChargeModalVisible = false;
    this.isEditMode = false;
    this.editingItemIndex = null;
    // Reset form fields to default
    this.newItem = {
      itemName: '',
      itemType: 'MISCELLANEOUS',
      quantity: 1,
      unitPrice: null
    };
  }

  saveItemChanges(): void {
    if (!this.newItem.itemName.trim() || !this.newItem.unitPrice || this.newItem.unitPrice <= 0 || !this.newItem.quantity || this.newItem.quantity <= 0) {
      alert('Please enter a valid item name, a positive quantity, and a positive price.');
      return;
    }

    if (this.isEditMode && this.editingItemIndex !== null) {
      const updatedItem = { ...this.newItem, totalPrice: this.newItem.unitPrice * this.newItem.quantity };
      this.generatedBill.billItems[this.editingItemIndex] = updatedItem;
    } else {
      const finalNewItem = { ...this.newItem, totalPrice: this.newItem.unitPrice * this.newItem.quantity, status: 'Unbilled' };
      this.generatedBill.billItems.push(finalNewItem);
    }
    
    this.recalculateTotal();
    this.hasUnsavedChanges = true;
    this.closeModal();
  }

  // --- WORKFLOW & BACKEND ACTIONS ---

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
    const navigateToNew = () => this.router.navigate(['/billing/new']);
    
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to start a new bill?')) {
        navigateToNew();
      }
    } else {
      navigateToNew();
    }
  }
}