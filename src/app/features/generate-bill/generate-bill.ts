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

  // --- Component State ---
  isAskingForPatientId = false;
  patientIdToGenerate: number | null = null;
  generatedBill: any = null;

  // State for tracking changes and enabling undo
  originalBillBackup: any = null;

  isLoading = false;
  isFetching = false;
  errorMessage: string | null = null;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startBillGeneration();
  }

  /**
   * Starts the workflow by showing the patient ID input form.
   */
  startBillGeneration(): void {
    this.isAskingForPatientId = true;
    this.generatedBill = null;
    this.originalBillBackup = null; // Clear backup on reset
    this.errorMessage = null;
    this.patientIdToGenerate = null;
  }

  /**
   * Called when the "Generate Bill" button (next to the input) is clicked.
   */
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
        console.log(`Bill generation initiated. New Bill ID: ${billId}`);
        this.fetchGeneratedBill(billId);
      },
      error: (err) => {
        console.error('Error during bill generation:', err);
        this.errorMessage = 'Failed to generate bill. The patient may have no unbilled appointments.';
        this.isLoading = false;
        this.isAskingForPatientId = true;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Fetches the full bill details and creates a backup for the undo functionality.
   * @param billId The ID of the bill to fetch.
   */
  private fetchGeneratedBill(billId: number): void {
    this.isFetching = true;
    this.billingService.getBillById(billId.toString()).subscribe({
      next: (billData) => {
        this.generatedBill = billData;
        // Create a deep copy of the original bill for backup.
        this.originalBillBackup = JSON.parse(JSON.stringify(billData));

        console.log('Fetched and backed up generated bill:', this.generatedBill);
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

  /**
   * Removes an item from the bill LOCALLY without saving to the backend.
   */
  removeItem(itemToRemove: any): void {
    if (!this.generatedBill || !this.generatedBill.billItems) return;

    this.generatedBill.billItems = this.generatedBill.billItems.filter(
      (item: any) => item !== itemToRemove
    );

    // Recalculate total locally after removing an item.
    this.recalculateTotal();
  }

  /**
   * Recalculates the total amount based on the current local items in the bill.
   */
  private recalculateTotal(): void {
    if (!this.generatedBill || !this.generatedBill.billItems) {
      if (this.generatedBill) this.generatedBill.totalAmount = 0;
      return;
    }
    const total = this.generatedBill.billItems.reduce(
      (sum: number, item: any) => sum + (item.totalPrice || 0), 0
    );
    this.generatedBill.totalAmount = total;
  }

  /**
   * Restores the bill to its last saved state, undoing all local changes.
   */
  undoChanges(): void {
    if (!this.originalBillBackup) return;

    // Restore from the backup using a deep copy
    this.generatedBill = JSON.parse(JSON.stringify(this.originalBillBackup));
    alert('Changes have been undone.');
    this.cdr.detectChanges();
  }

  /**
   * Saves the current state of the bill (with any changes) to the backend.
   */
  saveChanges(): void {
    if (!this.generatedBill) return;

    this.billingService.updateBill(this.generatedBill).subscribe({
      next: (updatedBill) => {
        this.generatedBill = updatedBill;
        // The new saved state becomes the new backup
        this.originalBillBackup = JSON.parse(JSON.stringify(updatedBill));
        alert(`Bill #${updatedBill.billId} has been successfully saved.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save bill:', err);
        alert('Error saving bill. Please try again.');
      }
    });
  }

  /**
   * Triggers the browser's print dialog.
   */
  printPage(): void {
    window.print();
  }

  /**
   * Allows the user to go back to the initial state.
   */
  resetFlow(): void {
    this.startBillGeneration();
  }
}