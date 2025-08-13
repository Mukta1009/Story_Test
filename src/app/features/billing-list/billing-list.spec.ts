import { Component, OnInit, inject } from '@angular/core';
import { BillingService } from '../../services/billing';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [
    CommonModule, // Add CommonModule here
    RouterLink
  ],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.css'
})
export class BillingList implements OnInit {
  
  private billingService = inject(BillingService);
  bills: any[] = [];

  ngOnInit(): void {
    this.billingService.getBills().subscribe(data => {
      console.log('Data fetched from API:', data);
      this.bills = data;
    });
  }
}