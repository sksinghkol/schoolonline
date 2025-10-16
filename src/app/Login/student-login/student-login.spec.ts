import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { StudentLogin } from './student-login';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { SchoolStateService } from '../../core/services/school-state.service';
import { of } from 'rxjs';

describe('StudentLogin Component', () => {
  let component: StudentLogin;
  let fixture: ComponentFixture<StudentLogin>;
  let mockRouter: any;
  let mockAuth: any;
  let mockFirestore: any;
  let mockSchoolState: any;

  beforeEach(waitForAsync(() => {
    mockRouter = { navigate: jasmine.createSpy('navigate'), url: '/student-login' };
    mockAuth = { currentUser: null, onAuthStateChanged: jasmine.createSpy() };
    mockFirestore = {};
    mockSchoolState = {
      currentSchool: jasmine.createSpy('currentSchool').and.returnValue(of({ id: 'school123', code: 'SCH001' })),
      setSchoolBySlug: jasmine.createSpy('setSchoolBySlug').and.returnValue(Promise.resolve())
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        StudentLogin,
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: SchoolStateService, useValue: mockSchoolState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the login form', () => {
    expect(component.loginForm).toBeTruthy();
    expect(component.loginForm.get('email')).toBeTruthy();
    expect(component.loginForm.get('password')).toBeTruthy();
    expect(component.loginForm.get('name')).toBeTruthy();
  });

  it('should toggle login/signup view', () => {
    const initial = component.isLoginView();
    component.toggleView();
    expect(component.isLoginView()).toBe(!initial);
    component.toggleView();
    expect(component.isLoginView()).toBe(initial);
  });

  it('should not set errorMessage when loginForm is invalid', fakeAsync(() => {
    component.loginForm.get('email')?.setValue('');
    component.loginForm.get('password')?.setValue('');
    component.handleEmailPassword();
    tick();
    expect(component.errorMessage()).toBeNull();
  })); 

  it('should have getDeviceInfo return an object with width and height', () => {
    const device = component.getDeviceInfo();
    expect(device.screen.width).toBeDefined();
    expect(device.screen.height).toBeDefined();
    expect(device.userAgent).toBeDefined();
    expect(device.platform).toBeDefined();
    expect(device.language).toBeDefined();
  });

  it('should initialize resolving as true', () => {
    expect(component.resolving()).toBeTrue();
  });
});
