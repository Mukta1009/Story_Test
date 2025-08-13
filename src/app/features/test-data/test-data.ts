import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-test-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-data.html',
  styleUrls: ['./test-data.css']
})
export class TestDataComponent implements OnInit {
  
  private billingService = inject(BillingService);
  private cdr = inject(ChangeDetectorRef);
  data: any[] = [];

  ngOnInit(): void {
    this.billingService.getBills().subscribe(response => {
      console.log('TEST COMPONENT received data:', response);
      this.data = response;
      this.cdr.detectChanges();
    });
  }
}