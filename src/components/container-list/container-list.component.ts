
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmartContainer, ContainerStatus } from '../../models/container.model';

@Component({
  selector: 'app-container-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './container-list.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerListComponent {
  containers = input.required<SmartContainer[]>();
  selectedContainerId = input<string | null>(null);
  containerSelected = output<string>();

  selectContainer(id: string): void {
    this.containerSelected.emit(id);
  }

  getStatusClasses(status: ContainerStatus): string {
    switch (status) {
      case 'OK':
        return 'bg-green-500/20 text-green-400';
      case 'Full':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Overweight':
        return 'bg-orange-500/20 text-orange-400';
      case 'Pickup Required':
        return 'bg-red-500/20 text-red-400 animate-pulse';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  getFillLevelStrokeClass(fillLevel: number): string {
    if (fillLevel >= 95) return 'text-red-500';
    if (fillLevel > 80) return 'text-yellow-500';
    return 'text-green-500';
  }
}