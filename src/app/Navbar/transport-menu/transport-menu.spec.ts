import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportMenu } from './transport-menu';

describe('TransportMenu', () => {
  let component: TransportMenu;
  let fixture: ComponentFixture<TransportMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
