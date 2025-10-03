import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  cloudName = 'dgafblzcu';
  uploadPreset = 'school'; // unsigned preset

  async uploadImage(file: File): Promise<string> {
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    try {
      const res = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.secure_url;
    } catch (err: any) {
      console.error('Cloudinary Upload Error:', err.response?.data || err.message);
      throw new Error('Image upload failed');
    }
  }
}
