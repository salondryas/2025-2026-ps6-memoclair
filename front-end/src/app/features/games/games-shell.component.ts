import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-games-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [`:host {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    overflow: hidden;
  }`],
})
export class GamesShellComponent {}
