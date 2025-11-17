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

  getContainerColor(status: ContainerStatus): string {
    switch (status) {
      case 'OK': return '#9CA3AF'; // gray-400
      case 'Full': return '#F59E0B'; // yellow-500
      case 'Overweight': return '#F97316'; // orange-500
      case 'Pickup Required': return '#EF4444'; // red-500
      default: return '#6B7280'; // gray-500
    }
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
  
  truckRotation = computed(() => {
    const truck = this.truck();
    if (!truck || truck.status !== 'On Route' || truck.path.length === 0) {
      return 0;
    }
    const currentLoc = truck.location;
    const nextLoc = truck.path[0];
    const dx = nextLoc.gridX - currentLoc.gridX;
    const dy = nextLoc.gridY - currentLoc.gridY;
    
    // Calculate angle in radians, convert to degrees, and add 90 degrees offset
    // because the truck SVG points upwards (0 deg) instead of to the right.
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    return angle;
  });
}