// Attendance service removed per request.
export const ATTENDANCE_SERVICE_REMOVED = true;
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, FirebaseStorage } from '@angular/fire/storage';

export interface AttendanceRecord {
  userId: string;
  userName: string;
  userRole: string;
  schoolId: string;
  qrData?: string;
  latitude?: number;
  longitude?: number;
  distanceFromSchool?: number; // in meters
  inOut?: 'in' | 'out';
  faceDetected: boolean;
  eyeBlinkDetected: boolean;
  status: 'present' | 'absent' | 'pending'; // pending = scanned but not face verified
  timestamp: any;
  photoUrl?: string; // optional face capture
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private firestore = inject(Firestore);
  // Storage will be injected lazily to avoid breaking modules that don't provide it
  private storage: FirebaseStorage | null = null;

  private attendanceCheckingSubject = new BehaviorSubject<boolean>(false);
  attendanceChecking$ = this.attendanceCheckingSubject.asObservable();

  private attendanceStatusSubject = new BehaviorSubject<string>('');
  attendanceStatus$ = this.attendanceStatusSubject.asObservable();

  // Geolocation: school coordinates (center of 200m radius)
  // These should ideally come from the school document, but we default here
  DEFAULT_SCHOOL_COORDS: { [key: string]: { lat: number; lng: number } } = {
    // Example: 'schoolId1': { lat: 28.5, lng: 77.2 }
  };

  // 200 meters in degrees (approx: 1 degree ≈ 111 km)
  RADIUS_DEGREES = 200 / 111000;

  constructor() {}

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          reject(err.message || 'Unable to get location');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    });
  }

  /**
   * Calculate distance in meters using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if user is within 200 meters of school
   */
  async verifyLocation(schoolId: string, schoolLat: number, schoolLng: number): Promise<{ isWithinRadius: boolean; distance: number }> {
    try {
      const userLocation = await this.getCurrentLocation();
      const distance = this.calculateDistance(userLocation.lat, userLocation.lng, schoolLat, schoolLng);
      return {
        isWithinRadius: distance <= 200,
        distance,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save attendance record to Firestore
   */
  async saveAttendance(record: AttendanceRecord): Promise<string> {
    try {
      this.attendanceCheckingSubject.next(true);
      this.attendanceStatusSubject.next('Saving attendance...');

      const attendanceRef = collection(this.firestore, `schools/${record.schoolId}/attendance`);
      const docRef = await addDoc(attendanceRef, {
        ...record,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      this.attendanceStatusSubject.next('Attendance recorded successfully!');
      this.attendanceCheckingSubject.next(false);
      return docRef.id;
    } catch (error) {
      this.attendanceStatusSubject.next(`Error saving attendance: ${error}`);
      this.attendanceCheckingSubject.next(false);
      throw error;
    }
  }

  /**
   * Upload a data URL (base64 image) to Firebase Storage and return the download URL.
   */
  async uploadPhotoDataUrl(schoolId: string, userId: string, dataUrl: string): Promise<string> {
    try {
      // lazy getStorage
      if (!this.storage) {
        this.storage = getStorage();
      }

      const path = `attendance_photos/${schoolId}/${userId}_${Date.now()}.jpg`;
      const ref = storageRef(this.storage, path);

      // upload as base64 string
      const result = await uploadString(ref, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(result.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Get today's attendance for a user
   */
  async getTodayAttendance(schoolId: string, userId: string): Promise<AttendanceRecord | null> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      // Some Firestore queries (combining multiple where + orderBy) may require a composite index.
      // To avoid requiring an index during runtime, query by userId and filter client-side for today's records.
      const attendanceRef = collection(this.firestore, `schools/${schoolId}/attendance`);
      const q = query(attendanceRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(5));

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as any;
          const ts = data.timestamp && typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp);
          if (ts >= startOfDay) {
            return data as AttendanceRecord;
          }
        }
      }
      return null;
    } catch (error) {
      // If Firestore returned a 'requires an index' error, the message often contains a direct URL to create it.
      try {
        const msg = (error && (error as any).message) || String(error);
        const urlMatch = msg.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
          console.warn('Firestore requires an index to run the original query. Create it here:', urlMatch[0]);
        }
      } catch (e) {}
      console.error('Error fetching today attendance:', error);
      return null;
    }
  }

  /**
   * Get attendance records for a date range
   */
  async getAttendanceRecords(schoolId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    try {
      const attendanceRef = collection(this.firestore, `schools/${schoolId}/attendance`);
      const q = query(
        attendanceRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as AttendanceRecord);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
  }
}
