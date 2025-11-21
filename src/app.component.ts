import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContainerService } from './services/container.service';
import { ContainerListComponent } from './components/container-list/container-list.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { ContainerStatus, SmartContainer } from './models/container.model';
import { Truck } from './models/truck.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContainerListComponent, MapViewComponent],
})
export class AppComponent {
  private containerService = inject(ContainerService);

  containers = this.containerService.containers;
  truck = this.containerService.truck;
  selectedContainerId = signal<string | null>(null);
  filterStatus = signal<ContainerStatus | 'All'>('All');

  filteredContainers = computed(() => {
    const containers = this.containers();
    const filter = this.filterStatus();

    if (filter === 'All') {
      return containers;
    }
    return containers.filter(c => c.status === filter);
  });
  
  pickupRequiredCount = computed(() => {
      return this.containers().filter(c => c.status === 'Pickup Required').length;
  });

  fastestFillingContainers = computed(() => {
    return this.containers()
      .filter(c => c.status === 'OK' || c.status === 'Overweight' || c.status === 'Full')
      .sort((a, b) => (b.fillRate ?? 0) - (a.fillRate ?? 0))
      .slice(0, 3);
  });

  nextStopAddress = computed(() => {
    const truck = this.truck();
    const containers = this.containers();

    if (truck?.status !== 'On Route' || !truck.path || truck.path.length === 0) {
      return null;
    }

    const nextStop = truck.path[0];
    const nextContainer = containers.find(
      c => c.location.gridX === nextStop.gridX && c.location.gridY === nextStop.gridY
    );

    return nextContainer?.location.address ?? 'Regresando al Depósito';
  });

  handleContainerSelection(id: string | null): void {
    if (this.selectedContainerId() === id) {
        this.selectedContainerId.set(null);
        return;
    }
    
    this.selectedContainerId.set(id);

    if (id) {
        const container = this.containers().find(c => c.id === id);
        // Allow dispatching to any container manually
        if (container) {
            this.containerService.dispatchTruckToContainer(container.id);
        }
    }
  }

  setFilter(status: ContainerStatus | 'All'): void {
    this.filterStatus.set(status);
  }
}