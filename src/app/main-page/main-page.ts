import { Component, signal } from '@angular/core';
import { environment } from '../../environment';

interface Link {
  title: string;
  description: string;
  url: string;
}

const STORAGE_KEY = 'beautypicks_links';

@Component({
  selector: 'app-main-page',
  imports: [],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage {
  protected readonly name = signal('Beauty Picks');
  protected readonly tagline = signal('Curated beauty essentials, handpicked for you');

  protected readonly links = signal<Link[]>(this.loadLinks());

  private loadLinks(): Link[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    return environment.links.map((l) => ({
      title: (l as any).headerKey ?? l.description,
      description: l.description,
      url: l.href,
    }));
  }
}
