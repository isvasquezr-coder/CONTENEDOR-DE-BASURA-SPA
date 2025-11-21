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
  targetContainerIds = input<string[]>([]);
  containerSelected = output<string>();

  selectContainer(id: string): void {
    this.containerSelected.emit(id);
  }

  getContainerColor(status: ContainerStatus): string {
    switch (status) {
      case 'OK': return '#9CA3AF'; // gray-400
      case 'Full': return '#F59E0B'; // yellow-500
      case 'Overweight': return '#F97316'; // orange-500
      case 'Pickup Required': return '#EF4444'; // red-500
      default: return '#6B7280'; // gray-500
    }
  }

  getFillLevelStrokeClass(fillLevel: number): string {
    if (fillLevel >= 95) return '#EF4444'; // red-500
    if (fillLevel >= 50) return '#F59E0B'; // yellow-500
    return '#22C55E'; // green-500
  }

  truckPathPoints = computed(() => {
    const truck = this.truck();
    if (!truck || truck.path.length === 0 || (truck.status !== 'On Route' && truck.status !== 'Returning to Depot') ) {
      return '';
    }
    const currentPath = [truck.location, ...truck.path];
    return currentPath
      .map(p => `${(p.gridX / 20) * 100},${(p.gridY / 20) * 100}`)
      .join(' ');
  });
  
  truckRotation = computed(() => {
    const truck = this.truck();
    if (!truck || (truck.status !== 'On Route' && truck.status !== 'Returning to Depot') || truck.path.length === 0) {
      return 0;
    }
    const currentLoc = truck.location;
    const nextLoc = truck.path[0];
    const dx = nextLoc.gridX - currentLoc.gridX;
    const dy = nextLoc.gridY - currentLoc.gridY;
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    return angle;
  });

  truckMarkerColor = computed(() => {
    const truck = this.truck();
    if (!truck) return '#6B7280'; // gray-500 default
    switch (truck.status) {
        case 'Idle': return '#9CA3AF'; // gray-400
        case 'On Route': return '#16a34a'; // green-600
        case 'Returning to Depot': return '#F97316'; // orange-500
        case 'Cleaning': return '#06B6D4'; // cyan-500
        default: return '#6B7280';
    }
  });
}
