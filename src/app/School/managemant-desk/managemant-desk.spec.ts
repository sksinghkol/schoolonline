import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagemantDesk } from './managemant-desk';

describe('ManagemantDesk', () => {
  let component: ManagemantDesk;
  let fixture: ComponentFixture<ManagemantDesk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagemantDesk]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagemantDesk);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
