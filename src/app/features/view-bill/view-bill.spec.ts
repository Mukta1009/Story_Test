import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBill } from './view-bill';

describe('ViewBill', () => {
  let component: ViewBill;
  let fixture: ComponentFixture<ViewBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
