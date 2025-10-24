import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Directorexpense } from './directorexpense';

describe('Directorexpense', () => {
  let component: Directorexpense;
  let fixture: ComponentFixture<Directorexpense>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directorexpense]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Directorexpense);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
