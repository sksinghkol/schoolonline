import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null): string {
    if (value === null) {
      return '';
    }
    // This will decode HTML entities like &lt; into <
    return new DOMParser().parseFromString(value, 'text/html').documentElement.textContent || '';
  }
}