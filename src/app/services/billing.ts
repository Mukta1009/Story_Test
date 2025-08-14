import { Injectable, inject } from '@angular/core';
// Import HttpHeaders
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8086/api/billing/bills'; // Replace with your URL

  getBills(): Observable<any[]> {
    //const token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ1c2VyNEBleGFtcGxlLmNvbSIsInJvbGUiOiJbUkVDRVBUSU9OSVNUXSIsImlhdCI6MTc1NTAwMjU3MCwiZXhwIjoxNzU1MDA2MTcwfQ.w08r0BGFkozKJhQZ4ab2_v3IiNEFkrap-8vZ5RWjeX0IChfr7MDqESzGBclT6BFg";

    // const headers = new HttpHeaders({
    //   'Authorization': `Bearer ${token}`
    // });

    //return this.http.get<any[]>(this.apiUrl, { headers: headers });
    // return this.http.get<any[]>(this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
    tap(data => console.log('[BillingService] Emitted:', data))
  );
  }

  getBillById(id: string): Observable<any> {
    console.log("\nId: " + id);
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getBillsByDateRange(start: string, end: string) {
    console.log("\nURL : " + `${this.apiUrl}/range?start=${start}&end=${end}`);
  return this.http.get<any[]>(`${this.apiUrl}/range?start=${start}&end=${end}`);
  }

  deleteBill(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  updateBill(bill: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${bill.billId}`, bill);
  }

  /* generateBillByPatientId(patientId: number): Observable<number> {
    return this.http.post(`${this.apiUrl}/generateBill/${patientId}`, {}, { responseType: 'text' })
      .pipe(
        map(response => {
          const match = response.match(/\d+/);
          if (match) {
            return parseInt(match[0], 10);
          }
          throw new Error('Could not parse Bill ID from the server response.');
        })
      );
  } */

    generateBillByPatientId(patientId: number): Observable<number> {
    return of(30);
  }
}