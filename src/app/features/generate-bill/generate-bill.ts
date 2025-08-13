import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Import CurrencyPipe
import { FormsModule } from '@angular/forms'; 
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-generate-bill',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './generate-bill.html',
  styleUrl: './generate-bill.css'
})

export class GenerateBill {

  // --- Component State ---
  isAskingForPatientId = false;
  patientIdToGenerate: number | null = null;
  generatedBill: any = null;
  
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
    this.errorMessage = null;
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
        this.cdr.detectChanges(); // Ensure UI updates on error
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Fetches the full bill details after it has been generated.
   * @param billId The ID of the bill to fetch.
   */
  private fetchGeneratedBill(billId: number): void {
    this.isFetching = true;
    this.billingService.getBillById(billId.toString()).subscribe({
      next: (billData) => {
        this.generatedBill = billData;
        console.log('Fetched generated bill:', this.generatedBill);
        
        // ** THE FIX **
        // Set fetching to false *before* telling Angular to update the view.
        this.isFetching = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching bill details:', err);
        this.errorMessage = `Bill was generated (ID: ${billId}), but failed to fetch details.`;
        this.isFetching = false;
        this.cdr.detectChanges();
      }
      // The complete() block is no longer needed for setting the flag.
    });
  }

  /**
   * Updates the status of the currently displayed bill.
   * @param newStatus The desired new status ('PAID' or 'PENDING').
   */
  updateStatus(newStatus: string): void {
    if (!this.generatedBill) return;

    const billToUpdate = { ...this.generatedBill, status: newStatus };

    this.billingService.updateBill(billToUpdate).subscribe({
        next: (updatedBill) => {
            this.generatedBill = updatedBill; 
            alert(`Bill #${updatedBill.billId} status updated to ${newStatus}.`);
            this.cdr.detectChanges(); // Refresh view after status update
        },
        error: (err) => {
            console.error('Failed to update status:', err);
            alert('Error updating status. Please try again.');
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
    this.generatedBill = null;
    this.isAskingForPatientId = false;
    this.patientIdToGenerate = null;
    this.errorMessage = null;
  }
}
