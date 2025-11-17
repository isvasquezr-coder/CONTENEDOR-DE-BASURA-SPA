import { Injectable, signal, OnDestroy } from '@angular/core';
import { SmartContainer, ContainerStatus } from '../models/container.model';
import { Truck } from '../models/truck.model';

@Injectable({ providedIn: 'root' })
export class ContainerService implements OnDestroy {
  private initialContainers: SmartContainer[] = [
    { id: 'BIN-001', location: { address: 'Calle Principal 123', gridX: 4, gridY: 5 }, fillLevel: 25, weight: 10, status: 'OK', fillRate: 1.1 },
    { id: 'BIN-002', location: { address: 'Avenida Central 456', gridX: 18, gridY: 8 }, fillLevel: 88, weight: 40, status: 'OK', fillRate: 2.5 },
    { id: 'BIN-003', location: { address: 'Parque Norte', gridX: 7, gridY: 15 }, fillLevel: 96, weight: 45, status: 'Full', fillRate: 3.2 },
    { id: 'BIN-004', location: { address: 'Plaza del Sol', gridX: 15, gridY: 12 }, fillLevel: 40, weight: 52, status: 'Overweight', fillRate: 1.5 },
    { id: 'BIN-005', location: { address: 'Mercado Municipal', gridX: 11, gridY: 2 }, fillLevel: 98, weight: 55, status: 'Pickup Required', fillRate: 4.5 },
    { id: 'BIN-006', location: { address: 'Estación de Tren', gridX: 2, gridY: 18 }, fillLevel: 15, weight: 5, status: 'OK', fillRate: 0.8 },
    { id: 'BIN-007', location: { address: 'Centro Comercial', gridX: 19, gridY: 19 }, fillLevel: 70, weight: 30, status: 'OK', fillRate: 3.8 },
    { id: 'BIN-008', location: { address: 'Hospital General', gridX: 1, gridY: 1 }, fillLevel: 60, weight: 25, status: 'OK', fillRate: 2.1 },
    { id: 'BIN-009', location: { address: 'Biblioteca Pública', gridX: 10, gridY: 10 }, fillLevel: 30, weight: 15, status: 'OK', fillRate: 1.9 },
    { id: 'BIN-010', location: { address: 'Zona Industrial Sur', gridX: 3, gridY: 12 }, fillLevel: 55, weight: 28, status: 'OK', fillRate: 2.8 },
    { id: 'BIN-011', location: { address: 'Universidad', gridX: 17, gridY: 3 }, fillLevel: 80, weight: 35, status: 'OK', fillRate: 4.1 },
    { id: 'BIN-012', location: { address: 'Cine Central', gridX: 14, gridY: 16 }, fillLevel: 65, weight: 33, status: 'OK', fillRate: 3.5 },
    { id: 'BIN-013', location: { address: 'Aeropuerto', gridX: 19, gridY: 1 }, fillLevel: 45, weight: 20, status: 'OK', fillRate: 2.2 },
    { id: 'BIN-014', location: { address: 'Distrito Financiero', gridX: 8, gridY: 8 }, fillLevel: 75, weight: 38, status: 'OK', fillRate: 3.0 },
  ];

  containers = signal<SmartContainer[]>([]);
  private simulationInterval: any;
  private truckSimulationInterval: any;

  private depot = { gridX: 0.5, gridY: 10 };
  truck = signal<Truck>({
    id: 'TRUCK-01',
    location: this.depot,
    path: [],
    status: 'Idle',
    targetContainerIds: []
  });

  constructor() {
    const initializedData = this.initialContainers.map(c => this.getUpdatedStatusContainer(c));
    this.containers.set(initializedData);

    this.simulationInterval = setInterval(() => this.simulateDataUpdate(), 2000);
    this.truckSimulationInterval = setInterval(() => this.simulateTruckMovement(), 400);
  }

  private simulateDataUpdate(): void {
    this.containers.update(currentContainers => {
      const randomIndex = Math.floor(Math.random() * currentContainers.length);
      
      const updatedContainers = currentContainers.map((container, index) => {
        if (index === randomIndex && container.status !== 'Pickup Required') {
            const updatedContainer = { ...container };
            const fillIncrease = (updatedContainer.fillRate ?? 1) * (0.5 + Math.random());
            updatedContainer.fillLevel = Math.min(100, updatedContainer.fillLevel + fillIncrease);
            updatedContainer.weight = updatedContainer.weight + (fillIncrease * 0.5) * (0.8 + Math.random() * 0.4);
            return this.getUpdatedStatusContainer(updatedContainer);
        }
        return container;
      });
      return updatedContainers;
    });
    this.updateTruckRouteDynamically();
  }
  
  private getUpdatedStatusContainer(c: SmartContainer): SmartContainer {
      const newContainer = {...c};
      let newStatus: ContainerStatus = 'OK';
      
      const isOverweight = c.weight > 50;
      const isFull = c.fillLevel >= 95;

      if (isOverweight && isFull) {
          newStatus = 'Pickup Required';
      } else if (isOverweight) {
          newStatus = 'Overweight';
      } else if (isFull) {
          newStatus = 'Full';
      }
      
      newContainer.status = newStatus;
      return newContainer;
  }

  private updateTruckRouteDynamically(): void {
    const truck = this.truck();

    const pickupRequiredContainers = this.containers().filter(c => c.status === 'Pickup Required');
    const fullContainers = this.containers().filter(c => c.status === 'Full');

    // Build the route for pickups using a nearest-neighbor approach
    const newPath: { gridX: number; gridY: number }[] = [];
    const newTargetIds: string[] = [];
    let currentLocation = truck.location;

    const findAndAddStops = (containers: SmartContainer[]) => {
      const remaining = [...containers];
      while (remaining.length > 0) {
        remaining.sort((a, b) => {
          const distA = Math.hypot(a.location.gridX - currentLocation.gridX, a.location.gridY - currentLocation.gridY);
          const distB = Math.hypot(b.location.gridX - currentLocation.gridX, b.location.gridY - currentLocation.gridY);
          return distA - distB;
        });
        const nextStop = remaining.shift()!;
        newPath.push(nextStop.location);
        newTargetIds.push(nextStop.id);
        currentLocation = nextStop.location;
      }
    };

    findAndAddStops(pickupRequiredContainers);
    findAndAddStops(fullContainers);

    // If there's a route, the depot is always the final destination.
    if (newPath.length > 0) {
      newPath.push(this.depot);
    } else {
      // If no pickups, check if the truck should return to depot.
      const isAtDepot = Math.hypot(truck.location.gridX - this.depot.gridX, truck.location.gridY - this.depot.gridY) < 0.5;
      if (!isAtDepot && truck.status === 'On Route') {
        newPath.push(this.depot);
      }
    }
    
    const oldTargetIds = truck.targetContainerIds ?? [];
    const isPathUnchanged = newTargetIds.length === oldTargetIds.length && newTargetIds.every((id, i) => id === oldTargetIds[i]);

    if (!isPathUnchanged) {
      this.truck.update(t => ({
        ...t,
        path: newPath,
        targetContainerIds: newTargetIds,
        status: newPath.length > 0 ? 'On Route' : 'Idle',
      }));
    } else if (truck.status === 'Idle' && newPath.length > 0) {
       this.truck.update(t => ({ ...t, status: 'On Route' }));
    }
  }


  private simulateTruckMovement(): void {
    const truck = this.truck();
    if (truck.status !== 'On Route' || truck.path.length === 0) {
      return;
    }

    const { location, path } = truck;
    const target = path[0];
    const speed = 0.5;

    const dx = target.gridX - location.gridX;
    const dy = target.gridY - location.gridY;
    const distance = Math.hypot(dx, dy);

    if (distance < speed) {
      // Reached target
      const newLocation = target;
      const remainingPath = path.slice(1);

      const isDepot = target.gridX === this.depot.gridX && target.gridY === this.depot.gridY;

      if (isDepot) {
        this.truck.update(t => ({ ...t, location: this.depot, status: 'Idle', path: [], targetContainerIds: [] }));
        return;
      }

      const containerToCollect = this.containers().find(c =>
        c.location.gridX === target.gridX && c.location.gridY === target.gridY
      );

      if (containerToCollect) {
        this.containers.update(all => all.map(c =>
          c.id === containerToCollect.id ? { ...c, fillLevel: 0, weight: 0, status: 'OK' } : c
        ));
      }

      // Move to next point in the path
      this.truck.update(t => ({ ...t, location: newLocation, path: remainingPath }));

    } else {
      // Move towards target
      const newX = location.gridX + (dx / distance) * speed;
      const newY = location.gridY + (dy / distance) * speed;
      this.truck.update(t => ({ ...t, location: { gridX: newX, gridY: newY } }));
    }
  }


  ngOnDestroy(): void {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.truckSimulationInterval) clearInterval(this.truckSimulationInterval);
  }
}
