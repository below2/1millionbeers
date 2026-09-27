import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string): string {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 45) return 'just now';

    const thresholds: [number, string][] = [
      [60, 'second'],
      [3600, 'minute'],
      [86400, 'hour'],
      [604800, 'day'],
      [2629800, 'week'],
      [31557600, 'month'],
      [Number.POSITIVE_INFINITY, 'year'],
    ];
    const divisors = [1, 60, 3600, 86400, 604800, 2629800, 31557600];

    for (let i = 0; i < thresholds.length; i++) {
      const [limit, label] = thresholds[i];
      if (seconds < limit) {
        const amount = Math.max(1, Math.floor(seconds / divisors[i]));
        return `${amount} ${label}${amount !== 1 ? 's' : ''} ago`;
      }
    }
    return 'a while ago';
  }
}
