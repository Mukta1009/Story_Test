import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // 1. Import ChangeDetectorRef
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-view-bill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-bill.html',
  styleUrls: ['./view-bill.css']
})
export class ViewBill implements OnInit {

  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);
  private cdr = inject(ChangeDetectorRef); // 2. Inject ChangeDetectorRef

  public bill: any;
  public isLoading: boolean = true;

  ngOnInit(): void {
    const billId = this.route.snapshot.paramMap.get('id');

    if (billId) {
      this.billingService.getBillById(billId).subscribe({
        next: (data) => {
          this.bill = data;
          this.isLoading = false;
          
          // 3. Manually trigger a screen refresh
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error('Error fetching bill details:', err);
          this.isLoading = false;
          
          // Also trigger a refresh on error
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  public printPage(): void {
    window.print();
  }
}