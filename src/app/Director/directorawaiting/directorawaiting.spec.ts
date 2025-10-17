import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Directorawaiting } from './directorawaiting';

describe('Directorawaiting', () => {
  let component: Directorawaiting;
  let fixture: ComponentFixture<Directorawaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directorawaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Directorawaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
