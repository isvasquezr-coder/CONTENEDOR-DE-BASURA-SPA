import { Injectable, signal, OnDestroy, inject } from '@angular/core';
import { SmartContainer, ContainerStatus } from '../models/container.model';
import { Truck } from '../models/truck.model';
import { PathfindingService } from './pathfinding.service';

@Injectable({ providedIn: 'root' })
export class ContainerService implements OnDestroy {
  private pathfindingService = inject(PathfindingService);
  private initialContainers: SmartContainer[] = [
    { id: 'BIN-001', location: { address: 'Calle Principal 123', gridX: 4, gridY: 5 }, fillLevel: 25, weight: 10, status: 'OK', fillRate: 1.1 },
    { id: 'BIN-002', location: { address: 'Avenida Central 456', gridX: 18, gridY: 8 }, fillLevel: 88, weight: 40, status: 'OK', fillRate: 2.5 },
    { id: 'BIN-003', location: { address: 'Parque Norte', gridX: 6, gridY: 15 }, fillLevel: 96, weight: 45, status: 'Full', fillRate: 3.2 },
    { id: 'BIN-004', location: { address: 'Plaza del Sol', gridX: 15, gridY: 12 }, fillLevel: 40, weight: 52, status: 'Overweight', fillRate: 1.5 },
    { id: 'BIN-005', location: { address: 'Mercado Municipal', gridX: 12, gridY: 2 }, fillLevel: 98, weight: 55, status: 'Pickup Required', fillRate: 4.5 },
    { id: 'BIN-006', location: { address: 'Estación de Tren', gridX: 4, gridY: 18 }, fillLevel: 15, weight: 5, status: 'OK', fillRate: 0.8 },
    { id: 'BIN-007', location: { address: 'Centro Comercial', gridX: 18, gridY: 19 }, fillLevel: 70, weight: 30, status: 'OK', fillRate: 3.8 },
    { id: 'BIN-008', location: { address: 'Hospital General', gridX: 1, gridY: 5 }, fillLevel: 60, weight: 25, status: 'OK', fillRate: 2.1 },
    { id: 'BIN-009', location: { address: 'Biblioteca Pública', gridX: 10, gridY: 10 }, fillLevel: 30, weight: 15, status: 'OK', fillRate: 1.9 },
    { id: 'BIN-010', location: { address: 'Zona Industrial Sur', gridX: 4, gridY: 12 }, fillLevel: 55, weight: 28, status: 'OK', fillRate: 2.8 },
    { id: 'BIN-011', location: { address: 'Universidad', gridX: 18, gridY: 3 }, fillLevel: 80, weight: 35, status: 'OK', fillRate: 4.1 },
    { id: 'BIN-012', location: { address: 'Cine Central', gridX: 12, gridY: 16 }, fillLevel: 65, weight: 33, status: 'OK', fillRate: 3.5 },
    { id: 'BIN-013', location: { address: 'Aeropuerto', gridX: 19, gridY: 1 }, fillLevel: 45, weight: 20, status: 'OK', fillRate: 2.2 },
    { id: 'BIN-014', location: { address: 'Distrito Financiero', gridX: 9, gridY: 8 }, fillLevel: 75, weight: 38, status: 'OK', fillRate: 3.0 },
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
    targetContainerIds: [],
    capacity: 250, // kg
    currentLoad: 0,
    isCleaning: false,
    maintenanceRequired: false,
  });

  constructor() {
    const initializedData = this.initialContainers.map(c => this.getUpdatedStatusContainer(c));
    this.containers.set(initializedData);

    this.simulationInterval = setInterval(() => this.simulateDataUpdate(), 2000);
    this.truckSimulationInterval = setInterval(() => this.simulateTruckMovement(), 200);
  }

  public dispatchTruckToContainer(containerId: string): void {
    const truck = this.truck();
    if (truck.status !== 'Idle' || truck.isCleaning) {
      console.log('Truck is busy. Manual dispatch ignored.');
      return;
    }

    const targetContainer = this.containers().find(c => c.id === containerId);
    if (!targetContainer) {
      console.error(`Container ${containerId} not found for manual dispatch.`);
      return;
    }
    
    if (truck.currentLoad + targetContainer.weight > truck.capacity) {
        console.log('Truck does not have enough capacity for this container. Manual dispatch ignored.');
        return;
    }

    console.log(`Manually dispatching truck to ${containerId}.`);

    const pathToContainer = this.pathfindingService.findPath(truck.location, targetContainer.location);
    if (pathToContainer.length === 0) {
      console.error(`No path found to container ${containerId}.`);
      return;
    }

    const pathToDepot = this.pathfindingService.findPath(targetContainer.location, this.depot);
    if (pathToDepot.length > 0) {
      pathToDepot.shift(); // remove the container location itself from the start of the return path
    }

    const fullPath = [...pathToContainer, ...pathToDepot];

    this.truck.update(t => ({
      ...t,
      path: fullPath,
      targetContainerIds: [containerId],
      status: 'On Route',
    }));
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
    if (truck.status !== 'Idle' || truck.isCleaning) return;

    if (truck.maintenanceRequired) {
        const pathToDepot = this.pathfindingService.findPath(truck.location, this.depot);
        this.truck.update(t => ({ ...t, path: pathToDepot, status: 'Returning to Depot', targetContainerIds: [] }));
        return;
    }

    const containersToVisit = this.containers().filter(c => c.status !== 'OK' || c.fillLevel >= 50);
    if (containersToVisit.length === 0) return;

    const fullPath: { gridX: number; gridY: number }[] = [];
    const targetIds: string[] = [];
    let currentLocation = truck.location;
    let projectedLoad = truck.currentLoad;

    const allPrioritizedContainers = [
      ...containersToVisit.filter(c => c.status === 'Pickup Required'),
      ...containersToVisit.filter(c => c.status === 'Overweight'),
      ...containersToVisit.filter(c => c.status === 'Full'),
      ...containersToVisit.filter(c => c.status === 'OK'),
    ];

    let remainingContainers = [...allPrioritizedContainers];

    while (remainingContainers.length > 0) {
      let nearestContainer: SmartContainer | null = null;
      let shortestPath: { gridX: number; gridY: number }[] = [];
      let nearestIndex = -1;

      for (let i = 0; i < remainingContainers.length; i++) {
        const container = remainingContainers[i];
        if (projectedLoad + container.weight > truck.capacity) {
          continue; // Skip, not enough capacity
        }
        const path = this.pathfindingService.findPath(currentLocation, container.location);
        if (path.length > 0 && (shortestPath.length === 0 || path.length < shortestPath.length)) {
          shortestPath = path;
          nearestContainer = container;
          nearestIndex = i;
        }
      }

      if (nearestContainer) {
        if (fullPath.length > 0) shortestPath.shift();
        fullPath.push(...shortestPath);
        targetIds.push(nearestContainer.id);
        currentLocation = nearestContainer.location;
        projectedLoad += nearestContainer.weight;
        remainingContainers.splice(nearestIndex, 1);
      } else {
        break; // No more containers can be added
      }
    }

    if (fullPath.length > 0) {
      const pathToDepot = this.pathfindingService.findPath(currentLocation, this.depot);
      if (pathToDepot.length > 0) pathToDepot.shift();
      fullPath.push(...pathToDepot);
      
      this.truck.update(t => ({
        ...t,
        path: fullPath,
        targetContainerIds: targetIds,
        status: 'On Route',
      }));
    }
  }

  private simulateTruckMovement(): void {
    const truck = this.truck();
    if ((truck.status !== 'On Route' && truck.status !== 'Returning to Depot') || truck.path.length === 0) {
      return;
    }

    const { location, path } = truck;
    const target = path[0];
    const speed = 0.5;

    const dx = target.gridX - location.gridX;
    const dy = target.gridY - location.gridY;
    const distance = Math.hypot(dx, dy);

    if (distance < speed) {
      const newLocation = target;
      const remainingPath = path.slice(1);

      const containerToCollect = this.containers().find(c =>
        c.location.gridX === target.gridX && c.location.gridY === target.gridY
      );

      if (containerToCollect) {
        this.containers.update(all => all.map(c =>
          c.id === containerToCollect.id ? { ...c, fillLevel: 0, weight: 0, status: 'OK' } : c
        ));
        this.truck.update(t => {
            const newLoad = t.currentLoad + containerToCollect.weight;
            const needsMaintenance = newLoad >= t.capacity;
            if (needsMaintenance) console.log('Truck capacity reached. Must return to depot.');
            return { ...t, currentLoad: newLoad, maintenanceRequired: t.maintenanceRequired || needsMaintenance };
        });
      }
      
      if (remainingPath.length === 0) {
         this.truck.update(t => ({ ...t, location: this.depot, path: [], targetContainerIds: [] }));
         this.startCleaningCycle();
         return;
      }

      this.truck.update(t => ({ ...t, location: newLocation, path: remainingPath }));

    } else {
      const newX = location.gridX + (dx / distance) * speed;
      const newY = location.gridY + (dy / distance) * speed;
      this.truck.update(t => ({ ...t, location: { gridX: newX, gridY: newY } }));
    }
  }

  private startCleaningCycle(): void {
    console.log('Truck at depot. Starting cleaning and emptying cycle.');
    this.truck.update(t => ({ ...t, status: 'Cleaning', isCleaning: true }));

    setTimeout(() => {
        console.log('Cleaning cycle complete. Truck is idle and ready.');
        this.truck.update(t => ({
            ...t,
            status: 'Idle',
            isCleaning: false,
            currentLoad: 0,
            maintenanceRequired: false
        }));
    }, 5000); // 5 second cleaning cycle
  }

  ngOnDestroy(): void {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.truckSimulationInterval) clearInterval(this.truckSimulationInterval);
  }
}
