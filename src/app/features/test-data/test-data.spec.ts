import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestData } from './test-data';

describe('TestData', () => {
  let component: TestData;
  let fixture: ComponentFixture<TestData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
