import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmartContainer, ContainerStatus } from '../../models/container.model';
import { Truck } from '../../models/truck.model';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapViewComponent {
  containers = input.required<SmartContainer[]>();
  selectedContainerId = input<string | null>(null);
  truck = input<Truck | null>(null);
  containerSelected = output<string>();

  readonly circumference = 2 * Math.PI * 10; // SVG circle radius is 10

  selectContainer(id: string): void {
    this.containerSelected.emit(id);
  }

  // Used for the ping animation behind the chart
  getMarkerBgClass(status: ContainerStatus): string {
    if (status === 'Pickup Required') {
        return 'bg-red-500';
    }
    return 'bg-transparent'; // No ping for other statuses
  }

  getDonutChartColorClass(fillLevel: number): string {
    if (fillLevel >= 95) return 'stroke-red-500';
    if (fillLevel > 80) return 'stroke-yellow-500';
    return 'stroke-green-500';
  }

  getDonutTextColorClass(fillLevel: number): string {
    if (fillLevel >= 95) return 'fill-red-400';
    if (fillLevel > 80) return 'fill-yellow-400';
    return 'fill-green-400';
  }

  getDonutChartOffset(fillLevel: number): number {
    return this.circumference - (fillLevel / 100) * this.circumference;
  }

  truckPathPoints = computed(() => {
    const truck = this.truck();
    if (!truck || truck.path.length === 0 || truck.status !== 'On Route') {
      return '';
    }
    const currentPath = [truck.location, ...truck.path];
    return currentPath
      .map(p => `${(p.gridX / 20) * 100},${(p.gridY / 20) * 100}`)
      .join(' ');
  });
}
